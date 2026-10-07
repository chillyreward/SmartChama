import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { forbidden, isInternalRequest } from '@/lib/api-guard';
import { sendSms } from '@/lib/sms';

// Daily Vercel cron (Authorization: Bearer CRON_SECRET). Drains queued side
// effects so request handlers never make internal HTTP loopbacks.
// Events: contribution_confirmed, loan_approved, send_sms.

export async function GET(request: Request) {
  if (!isInternalRequest(request)) return forbidden();

  try {
    const supabase = getSupabaseAdmin();

    const { data: pendingEvents } = await supabase
      .from('outbox')
      .select('*')
      .eq('processed', false)
      .lt('attempts', 5)
      .order('created_at', { ascending: true })
      .limit(20);

    for (const event of pendingEvents || []) {
      try {
        const payload = event.payload || {};

        if (event.event_type === 'contribution_confirmed') {
          const { membership_id, amount, receipt } = payload;

          // 1. Trust score: share of this member's contributions that were confirmed
          const { data: contribs } = await supabase
            .from('contributions_v2')
            .select('status')
            .eq('membership_id', membership_id);
          const total = contribs?.length || 0;
          const confirmed = contribs?.filter(c => c.status === 'confirmed').length || 0;
          const score = total > 0 ? Math.round((confirmed / total) * 100) : 100;
          await supabase
            .from('chama_memberships')
            .update({ trust_score: score })
            .eq('id', membership_id);

          // 2. Confirmation SMS
          const { data: membership } = await supabase
            .from('chama_memberships')
            .select(`
              profiles(full_name, phone_number),
              chamas_v2(name)
            `)
            .eq('id', membership_id)
            .maybeSingle();

          const phone = (membership?.profiles as any)?.phone_number;
          const chamaName = (membership?.chamas_v2 as any)?.name || 'your group';
          if (phone) {
            await sendSms(phone, `SmartChama: Your KSh ${amount} contribution to ${chamaName} is confirmed. Receipt: ${receipt}.`);
          }
        } else if (event.event_type === 'loan_approved') {
          const { phone, amount, group_name } = payload;
          if (phone) {
            await sendSms(phone, `SmartChama: Your loan of KSh ${amount} from ${group_name || 'your group'} has been approved and will be disbursed shortly.`);
          }
        } else if (event.event_type === 'loan_repayment_confirmed') {
          const { membership_id, amount, receipt } = payload;
          const { data: m } = await supabase
            .from('chama_memberships')
            .select('profiles(phone_number), chamas_v2(name)')
            .eq('id', membership_id)
            .maybeSingle();
          const phone = (m?.profiles as any)?.phone_number;
          if (phone) {
            await sendSms(phone, `SmartChama: Loan repayment of KSh ${amount} to ${(m?.chamas_v2 as any)?.name || 'your group'} received. Receipt: ${receipt}.`);
          }
        } else if (event.event_type === 'send_sms') {
          const { phone, message } = payload;
          if (phone && message) {
            const result = await sendSms(phone, String(message).slice(0, 480));
            if (!result.success) throw new Error('SMS provider rejected the message');
          }
        } else {
          console.warn('Outbox: unknown event type', event.event_type);
        }

        // Mark event as processed
        await supabase
          .from('outbox')
          .update({
            processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', event.id);

      } catch (err) {
        console.error('Outbox processing failed:', event.id, err);
        await supabase
          .from('outbox')
          .update({
            attempts: (event.attempts || 0) + 1
          })
          .eq('id', event.id);
      }
    }

    // Contributions still pending after 30 minutes almost certainly never got a
    // callback. The M-Pesa callback still re-checks failed ones with Daraja, so a
    // late payment isn't lost.
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      await supabase
        .from('contributions_v2')
        .update({ status: 'failed', failed_reason: 'Payment timeout - no callback received' })
        .eq('status', 'pending')
        .eq('payment_method', 'mpesa')
        .lt('created_at', cutoff);
    } catch (cleanupErr) {
      console.error('Stale contribution cleanup error:', cleanupErr);
    }

    return NextResponse.json({
      processed: pendingEvents?.length || 0
    });

  } catch (error) {
    console.error('Outbox process error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
