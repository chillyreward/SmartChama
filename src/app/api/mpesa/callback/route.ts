import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { querySTKPushStatus } from '@/lib/mpesa';

// Safaricom doesn't sign callbacks, so this endpoint can't trust the body:
// anyone can POST a fake "ResultCode: 0" for a CheckoutRequestID they started
// themselves and get credited without paying. Two defences:
//  1. The callback URL carries ?secret=MPESA_CALLBACK_SECRET (added by stk-push).
//  2. Before confirming, ask Daraja directly (STK query) whether the payment
//     really succeeded, and check the paid amount matches the contribution.

function secretMatches(given: string | null): boolean {
  const expected = process.env.MPESA_CALLBACK_SECRET;
  if (!expected) return true; // not configured yet; the STK query check still applies
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const respondOk = () =>
  new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!secretMatches(url.searchParams.get('secret'))) {
    console.warn('M-Pesa callback rejected: bad secret');
    return respondOk(); // don't tell a forger what failed
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json().catch(() => null);

  const callback = body?.Body?.stkCallback;
  const resultCode = callback?.ResultCode;
  const checkoutRequestId = callback?.CheckoutRequestID;

  if (!checkoutRequestId || typeof checkoutRequestId !== 'string') {
    console.error('Callback missing CheckoutRequestID');
    return respondOk();
  }

  const { data: contribution } = await supabase
    .from('contributions_v2')
    .select('id, membership_id, chama_id, amount, status')
    .eq('mpesa_checkout_request_id', checkoutRequestId)
    .maybeSingle();

  if (!contribution) {
    console.error('No matching contribution for checkout ID:', checkoutRequestId);
    return respondOk();
  }

  // Idempotency at callback level
  if (contribution.status !== 'pending') {
    return respondOk();
  }

  // Ask Safaricom for the real outcome instead of trusting the callback body
  const query = await querySTKPushStatus(checkoutRequestId);
  const queryResult = query.success ? String(query.data?.ResultCode ?? '') : '';

  if (!query.success || queryResult === '') {
    // Daraja still processing or unreachable: leave pending, don't trust the body
    console.warn('STK query inconclusive for', checkoutRequestId, query.error ?? query.data);
    return respondOk();
  }

  if (queryResult !== '0') {
    await supabase
      .from('contributions_v2')
      .update({ status: 'failed' })
      .eq('id', contribution.id)
      .eq('status', 'pending');
    return respondOk();
  }

  if (resultCode !== 0) {
    // Callback says failed but Daraja says paid: trust Daraja, log the mismatch
    console.warn('Callback/STK query mismatch for', checkoutRequestId);
  }

  const items = callback.CallbackMetadata?.Item || [];
  const get = (name: string) => items.find((i: any) => i.Name === name)?.Value;

  const receipt = get('MpesaReceiptNumber');
  const paidAmount = Number(get('Amount'));

  if (Number.isFinite(paidAmount) && paidAmount !== Number(contribution.amount)) {
    console.error('Amount mismatch for', checkoutRequestId, { paidAmount, expected: contribution.amount });
    await supabase
      .from('contributions_v2')
      .update({ status: 'partial', mpesa_receipt: receipt ?? null })
      .eq('id', contribution.id)
      .eq('status', 'pending');
    return respondOk();
  }

  // Conditional update: only one concurrent callback can flip pending → confirmed,
  // so the wallet is credited once.
  const { data: confirmed } = await supabase
    .from('contributions_v2')
    .update({
      status: 'confirmed',
      mpesa_receipt: receipt ?? null,
      confirmed_at: new Date().toISOString()
    })
    .eq('id', contribution.id)
    .eq('status', 'pending')
    .select('id');

  if (!confirmed || confirmed.length === 0) {
    return respondOk();
  }

  // Use the SAFE locked function
  await supabase.rpc('increment_wallet_balance_safe', {
    p_chama_id: contribution.chama_id,
    p_amount: contribution.amount
  });

  await supabase.from('transactions_v2').insert({
    chama_id: contribution.chama_id,
    membership_id: contribution.membership_id,
    type: 'contribution',
    amount: contribution.amount,
    reference: receipt,
    status: 'confirmed'
  });

  // Record double-entry transaction
  await supabase.rpc('record_ledger_transaction', {
    p_chama_id: contribution.chama_id,
    p_debit_account_type: 'external_cash',
    p_credit_account_type: 'chama_pool',
    p_membership_id: null,
    p_amount: contribution.amount,
    p_description: `Contribution - ${receipt}`
  });

  // Write to outbox instead of calling external APIs directly
  await supabase.from('outbox').insert({
    event_type: 'contribution_confirmed',
    payload: {
      membership_id: contribution.membership_id,
      chama_id: contribution.chama_id,
      amount: contribution.amount,
      receipt: receipt
    }
  });

  return respondOk();
}
