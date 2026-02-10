import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/twilio';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { code: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, action } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (action === 'verify') {
      // Verify OTP
      const { code } = await request.json();
      const stored = otpStore.get(phoneNumber);

      if (!stored) {
        return NextResponse.json(
          { error: 'No OTP found for this number' },
          { status: 400 }
        );
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(phoneNumber);
        return NextResponse.json(
          { error: 'OTP has expired' },
          { status: 400 }
        );
      }

      if (stored.code !== code) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        );
      }

      otpStore.delete(phoneNumber);
      return NextResponse.json({ success: true, verified: true });
    }

    // Generate and send OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(phoneNumber, { code, expires });

    await sendOTP(phoneNumber, code);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      expiresIn: 600 // seconds
    });
  } catch (error: any) {
    console.error('OTP API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process OTP' },
      { status: 500 }
    );
  }
}
