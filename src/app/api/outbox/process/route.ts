import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { forbidden, isInternalRequest } from '@/lib/api-guard';
import { processOutbox } from '@/lib/outbox';
import { recalcTrustScore } from '@/lib/trust-score';

// Daily Vercel cron (Authorization: Bearer CRON_SECRET). Drains queued side
// effects so request handlers never make internal HTTP loopbacks.
// Events are normally handled seconds after they are queued (see lib/outbox);
// this retries failures and refreshes trust scores.

export async function GET(request: Request) {
  if (!isInternalRequest(request)) return forbidden();

  try {
    const supabase = getSupabaseAdmin();
    const processed = await processOutbox(supabase, 100);

    // Keep every active member's trust score current, including cash payments
    // that officials record (those don't go through the M-Pesa callback).
    try {
      const { data: members } = await supabase.from('chama_memberships').select('id').eq('status', 'active');
      for (const m of members || []) await recalcTrustScore(supabase, m.id);
    } catch (scoreErr) {
      console.error('Daily trust score refresh error:', scoreErr);
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

    return NextResponse.json({ processed });

  } catch (error) {
    console.error('Outbox process error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
