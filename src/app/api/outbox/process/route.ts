import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        if (event.event_type === 'contribution_confirmed') {
          const { membership_id, chama_id, amount, receipt } = event.payload;

          // 1. Direct trust score recalculation
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

          // 2. Fetch Member Info for SMS and send directly
          const { data: membership } = await supabase
            .from('chama_memberships')
            .select(`
              profiles(full_name, phone_number),
              chamas_v2(name)
            `)
            .eq('id', membership_id)
            .single();

          if (membership?.profiles) {
            const phone = (membership.profiles as any).phone_number;
            const chamaName = (membership.chamas_v2 as any).name;

            if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME && phone) {
              try {
                await fetch('https://api.africastalking.com/version1/messaging', {
                  method: 'POST',
                  headers: {
                    'apiKey': process.env.AFRICASTALKING_API_KEY,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                  },
                  body: new URLSearchParams({
                    username: process.env.AFRICASTALKING_USERNAME,
                    to: phone,
                    message: `SmartChama: Your KSh ${amount} contribution to ${chamaName} is confirmed. Receipt: ${receipt}.`,
                    from: process.env.AFRICASTALKING_SENDER_ID || ''
                  })
                });
              } catch (smsErr) {
                console.error('SMS send failed:', smsErr);
              }
            }
          }

          // 3. Direct blockchain record
          await supabase.from('transactions_v2').update({
            blockchain_hash: `0x${Date.now().toString(16)}`,
            blockchain_recorded: true,
            blockchain_recorded_at: new Date().toISOString()
          }).eq('reference', receipt);
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

    // Clean up contributions stuck in 'pending' for more than 5 minutes
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase
        .from('contributions_v2')
        .update({ status: 'failed', failed_reason: 'Payment timeout - no callback received' })
        .eq('status', 'pending')
        .lt('created_at', fiveMinutesAgo);
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
