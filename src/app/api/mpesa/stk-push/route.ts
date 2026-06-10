import { NextResponse } from 'next/server';
import { initiateSTKPush } from '@/lib/mpesa';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc, chama_id } = await req.json();

    console.log('STK Push Request:', { phoneNumber, amount, accountReference, transactionDesc, chama_id });

    // Validate inputs
    if (!phoneNumber || !amount) {
      return NextResponse.json(
        { success: false, error: 'Phone number and amount are required' },
        { status: 400 }
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
        // In a full implementation, we'd add late_penalty handling here
      }
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!/^254\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format. Use 254XXXXXXXXX' },
        { status: 400 }
      );
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
      accountReference || 'SmartChama',
      transactionDesc || 'Chama Contribution'
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
