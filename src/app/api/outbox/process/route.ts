import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
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

        // 1. Calculate Trust Score
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/trust-score/calculate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ membership_id })
          }
        );

        // 2. Fetch Member Info for SMS
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

          // 3. Send SMS confirmation
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/send`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone,
                message: `SmartChama: Your KSh ${amount} contribution to ${chamaName} is confirmed. Receipt: ${receipt}.`
              })
            }
          );
        }

        // 4. Record to blockchain
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/blockchain/record`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'CONTRIBUTION',
              membership_id,
              chama_id,
              amount,
              receipt
            })
          }
        );
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
          attempts: event.attempts + 1
        })
        .eq('id', event.id);
    }
  }

  return Response.json({
    processed: pendingEvents?.length || 0
  });
}
