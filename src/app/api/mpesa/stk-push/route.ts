import { NextResponse } from 'next/server';
import { initiateSTKPush } from '@/lib/mpesa';

export async function POST(req: Request) {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc } = await req.json();

    console.log('STK Push Request:', { phoneNumber, amount, accountReference, transactionDesc });

    // Validate inputs
    if (!phoneNumber || !amount) {
      return NextResponse.json(
        { success: false, error: 'Phone number and amount are required' },
        { status: 400 }
      );
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
