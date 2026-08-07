import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getComplianceConfig } from '@/lib/compliance';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, amount, membership_id, chama_id, account_ref } = body;

    // Validate required fields
    if (!phone || !amount || !membership_id || !chama_id) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, amount, membership_id, chama_id' },
        { status: 400 }
      );
    }

    // Validate amount
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 1) {
      return NextResponse.json(
        { error: 'Amount must be a positive number (minimum KSh 1)' },
        { status: 400 }
      );
    }

    // Validate and format phone number
    let formattedPhone = String(phone).replace(/\s/g, '');
    if (formattedPhone.startsWith('+254')) {
      formattedPhone = '254' + formattedPhone.slice(4);
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    if (!/^254\d{9}$/.test(formattedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use 07XXXXXXXX or +254XXXXXXXXX' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Validate compliance transaction limit
    const limit = await getComplianceConfig('max_single_transaction');
    if (limit && numericAmount > limit.amount) {
      return NextResponse.json(
        { error: `Maximum transaction is KSh ${limit.amount}` },
        { status: 400 }
      );
    }

    // Idempotency check
    const month = new Date().toISOString().slice(0, 7);
    const idemKey = `stk-${membership_id}-${chama_id}-${month}-${numericAmount}`;

    const { data: existingKey } = await supabase
      .from('idempotency_keys')
      .select('result')
      .eq('key', idemKey)
      .single();

    if (existingKey) {
      return NextResponse.json(existingKey.result);
    }

    // Create pending contribution FIRST
    const { data: pendingContribution, error: insertError } = await supabase
      .from('contributions_v2')
      .insert({
        membership_id,
        chama_id,
        amount: numericAmount,
        status: 'pending',
        payment_method: 'mpesa'
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Could not initiate contribution.' },
        { status: 500 }
      );
    }

    // Get M-Pesa access token
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const isSandbox = (process.env.MPESA_BUSINESS_SHORT_CODE === '174379');
    const safaricomBaseUrl = isSandbox ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';

    const tokenRes = await fetch(
      `${safaricomBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { 'Authorization': `Basic ${auth}` } }
    );
    const { access_token } = await tokenRes.json();

    if (!access_token) {
      await supabase
        .from('contributions_v2')
        .update({ status: 'failed', failed_reason: 'Failed to get M-Pesa access token' })
        .eq('id', pendingContribution.id);

      return NextResponse.json(
        { error: 'M-Pesa service is temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);

    const password = Buffer.from(
      `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

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
          Amount: numericAmount,
          PartyA: formattedPhone,
          PartyB: process.env.MPESA_BUSINESS_SHORT_CODE,
          PhoneNumber: formattedPhone,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: account_ref || 'SmartChama',
          TransactionDesc: 'Chama Contribution'
        })
      }
    );

    const stkData = await stkRes.json();

    if (!stkData.CheckoutRequestID) {
      await supabase
        .from('contributions_v2')
        .update({ status: 'failed', failed_reason: stkData.errorMessage || 'STK push rejected' })
        .eq('id', pendingContribution.id);

      return NextResponse.json(
        { error: stkData.errorMessage || 'Could not send payment request. Please try again.' },
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
      checkoutRequestId: stkData.CheckoutRequestID,
      timeoutSeconds: 120
    };

    // Save the idempotency key
    await supabase
      .from('idempotency_keys')
      .upsert({ key: idemKey, result: resultPayload }, { onConflict: 'key' });

    return NextResponse.json(resultPayload);

  } catch (error: any) {
    console.error('STK Push error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment. Please try again.' },
      { status: 500 }
    );
  }
}
