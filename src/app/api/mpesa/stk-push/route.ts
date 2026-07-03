import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getComplianceConfig } from '@/lib/compliance';

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  const { phone, amount, membership_id, chama_id } = await request.json();

  // Validate compliance transaction limit first
  const limit = await getComplianceConfig('max_single_transaction');
  if (limit && amount > limit.amount) {
    return Response.json(
      { error: `Maximum transaction is KSh ${limit.amount}` },
      { status: 400 }
    );
  }

  // Idempotency check — 5 minute window to prevent double-taps
  const window = new Date(Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000)).toISOString().slice(0, 16);
  const idemKey = `stk-${membership_id}-${chama_id}-${window}-${amount}`;

  const { data: existingKey } = await supabase
    .from('idempotency_keys')
    .select('result')
    .eq('key', idemKey)
    .single();

  if (existingKey) {
    // Return the cached result instead of sending a duplicate STK push
    return Response.json(existingKey.result);
  }

  // Create pending contribution FIRST
  const { data: pendingContribution, error: insertError } = await supabase
    .from('contributions_v2')
    .insert({
      membership_id,
      chama_id,
      amount,
      status: 'pending',
      payment_method: 'mpesa'
    })
    .select()
    .single();

  if (insertError) {
    return Response.json(
      { error: 'Could not initiate contribution.' },
      { status: 500 }
    );
  }

  // Get M-Pesa access token
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  // Determine Safaricom Endpoint based on credentials (sandbox vs production)
  const isSandbox = (process.env.MPESA_BUSINESS_SHORT_CODE === '174379');
  const safaricomBaseUrl = isSandbox ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';

  const tokenRes = await fetch(
    `${safaricomBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { 'Authorization': `Basic ${auth}` } }
  );
  const { access_token } = await tokenRes.json();

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  const formattedPhone = phone.replace(/^\+/, '').replace(/\s/g, '');

  const stkRes = await fetch(
    `${safaricomBaseUrl}/mpesa/stkpush/v1/processrequest`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_BUSINESS_SHORT_CODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: 'SmartChama',
        TransactionDesc: 'Chama Contribution'
      })
    }
  );

  const stkData = await stkRes.json();

  if (!stkData.CheckoutRequestID) {
    await supabase
      .from('contributions_v2')
      .update({ status: 'failed' })
      .eq('id', pendingContribution.id);

    return Response.json(
      { error: 'Could not send payment request. Please try again.' },
      { status: 500 }
    );
  }

  // Save CheckoutRequestID for callback lookup
  await supabase
    .from('contributions_v2')
    .update({
      mpesa_checkout_request_id: stkData.CheckoutRequestID,
      mpesa_merchant_request_id: stkData.MerchantRequestID
    })
    .eq('id', pendingContribution.id);

  const resultPayload = {
    success: true,
    contributionId: pendingContribution.id,
    checkoutRequestId: stkData.CheckoutRequestID
  };

  // Save the idempotency key using upsert
  await supabase
    .from('idempotency_keys')
    .upsert({
      key: idemKey,
      result: resultPayload
    }, { onConflict: 'key' });

  return Response.json(resultPayload);
}
