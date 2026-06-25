import { NextResponse } from 'next/server';
import { initiateSTKPush } from '@/lib/mpesa';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = body.phone || body.phoneNumber;
    const amount = body.amount;
    const chama_id = body.chama_id;
    const account_ref = body.account_ref || body.accountReference || 'SmartChama';
    const membership_id = body.membership_id;

    console.log('STK Push Request:', { phone, amount, account_ref, chama_id, membership_id });

    // Validate inputs
    if (!phone || !amount) {
      return NextResponse.json(
        { success: false, error: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Validate phone number format
    const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
    if (!/^254\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Use 254XXXXXXXXX' },
        { status: 400 }
      );
    }

    // Rate Limiting Check (30 seconds deduplication)
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const { data: recentTx } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('phone', cleanPhone)
      .gte('created_at', thirtySecondsAgo)
      .limit(1);

    if (recentTx && recentTx.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Please wait 30 seconds before requesting another STK Push.' },
        { status: 429 }
      );
    }

    if (chama_id) {
      const { data: rules } = await supabaseAdmin
        .from('chama_rules')
        .select('*')
        .eq('chama_id', chama_id)
        .single();
        
      if (rules) {
        if (amount < rules.min_contribution) {
          return NextResponse.json({ 
            success: false, 
            error: `Minimum contribution is KSh ${rules.min_contribution}` 
          }, { status: 400 });
        }
      }
    }

    // Validate amount
    if (amount < 1) {
      return NextResponse.json(
        { success: false, error: 'Amount must be at least 1 KES' },
        { status: 400 }
      );
    }

    // Initiate STK Push
    const result = await initiateSTKPush(
      cleanPhone,
      amount,
      account_ref,
      body.transactionDesc || 'Chama Contribution'
    );

    console.log('STK Push Result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'STK Push sent successfully',
        checkoutRequestID: result.checkoutRequestID,
        merchantRequestID: result.merchantRequestID,
      });
    } else {
      // Extract meaningful error message
      let errorMessage = 'Failed to send STK Push';
      
      // Type assertion for error case
      const errorResult = result as { success: false; error?: any; details?: any };
      
      if (errorResult.error) {
        if (typeof errorResult.error === 'string') {
          errorMessage = errorResult.error;
        } else if (typeof errorResult.error === 'object') {
          errorMessage = errorResult.error.errorMessage || 
                        errorResult.error.message || 
                        JSON.stringify(errorResult.error);
        }
      }
      
      console.error('STK Push Failed:', errorResult.error);
      
      return NextResponse.json(
        { success: false, error: errorMessage, details: errorResult.details },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('STK Push API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
