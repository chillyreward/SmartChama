import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  const body = await request.json();

  const callback = body.Body?.stkCallback;
  const resultCode = callback?.ResultCode;
  const checkoutRequestId = callback?.CheckoutRequestID;

  const respondOk = () =>
    new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: 'Accepted'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  if (!checkoutRequestId) {
    console.error('Callback missing CheckoutRequestID');
    return respondOk();
  }

  const { data: contribution } = await supabase
    .from('contributions_v2')
    .select(`
      id, membership_id, chama_id, amount, status
    `)
    .eq('mpesa_checkout_request_id', checkoutRequestId)
    .single();

  if (!contribution) {
    console.error('No matching contribution for checkout ID:', checkoutRequestId);
    return respondOk();
  }

  // Idempotency at callback level
  if (contribution.status === 'confirmed') {
    return respondOk();
  }

  if (resultCode !== 0) {
    await supabase
      .from('contributions_v2')
      .update({ status: 'failed' })
      .eq('id', contribution.id);
    return respondOk();
  }

  const items = callback.CallbackMetadata?.Item || [];
  const get = (name: string) => items.find((i: any) => i.Name === name)?.Value;

  const receipt = get('MpesaReceiptNumber');

  await supabase
    .from('contributions_v2')
    .update({
      status: 'confirmed',
      mpesa_receipt: receipt,
      confirmed_at: new Date().toISOString()
    })
    .eq('id', contribution.id);

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
