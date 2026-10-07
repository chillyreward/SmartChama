import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getComplianceConfig } from '@/lib/compliance';
import { requireAuth } from '@/lib/api-auth';
import { isInternalRequest } from '@/lib/api-guard';

// The callback can't be authenticated any other way, so it carries a secret
function callbackUrl() {
  const base = process.env.MPESA_CALLBACK_URL || '';
  const secret = process.env.MPESA_CALLBACK_SECRET;
  if (!secret) return base;
  return `${base}${base.includes('?') ? '&' : '?'}secret=${encodeURIComponent(secret)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount, membership_id, chama_id, account_ref } = body;

    // Validate required fields
    if (!phone || !amount || !membership_id || !chama_id) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, amount, membership_id, chama_id' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Caller must own the membership: a signed-in member paying for themselves,
    // or the USSD route (internal) acting for the phone that dialled in.
    if (!isInternalRequest(request)) {
      const { user, error: authError } = await requireAuth(request);
      if (!user || authError) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: membership } = await supabase
        .from('chama_memberships')
        .select('id')
        .eq('id', membership_id)
        .eq('chama_id', chama_id)
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'Membership not found.' }, { status: 403 });
      }
    }

    // Daraja only accepts whole shillings
    const numericAmount = Math.round(Number(amount));
    if (!Number.isFinite(numericAmount) || numericAmount < 1 || numericAmount > 250000) {
      return NextResponse.json(
        { error: 'Amount must be between KSh 1 and KSh 250,000' },
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

    if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use 07XXXXXXXX or +254XXXXXXXXX' },
        { status: 400 }
      );
    }

    // Validate compliance transaction limit
    const limit = await getComplianceConfig('max_single_transaction');
    if (limit && numericAmount > limit.amount) {
      return NextResponse.json(
        { error: `Maximum transaction is KSh ${limit.amount}` },
        { status: 400 }
      );
    }

    // Idempotency: absorb double-taps within a 5-minute window. (A per-month key
    // would stop a member retrying after cancelling the M-Pesa prompt.)
    const window = new Date(Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000)).toISOString().slice(0, 16);
    const idemKey = `stk-${membership_id}-${chama_id}-${window}-${numericAmount}`;

    const { data: existingKey } = await supabase
      .from('idempotency_keys')
      .select('result')
      .eq('key', idemKey)
      .maybeSingle();

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
          CallBackURL: callbackUrl(),
          AccountReference: String(account_ref || 'SmartChama').slice(0, 12),
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
