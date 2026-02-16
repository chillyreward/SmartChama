import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { amount, phoneNumber } = await req.json();

    // Create a test transaction
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        transaction_type: 'deposit',
        amount: amount || 1000,
        phone_number: phoneNumber || '254712345678',
        mpesa_receipt_number: 'TEST' + Math.floor(Math.random() * 1000000),
        merchant_request_id: 'TEST-MERCHANT-' + Date.now(),
        checkout_request_id: 'TEST-CHECKOUT-' + Date.now(),
        transaction_date: new Date().toISOString(),
        description: 'Test Deposit',
        status: 'completed',
      })
      .select()
      .single();

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('Test transaction created:', transaction);

    return NextResponse.json({
      success: true,
      message: 'Test transaction created successfully',
      transaction,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
