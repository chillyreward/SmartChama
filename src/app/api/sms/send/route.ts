import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    const result = await sendSMS({ to, message });
    
    return NextResponse.json({ 
      success: true, 
      ...result 
    });
  } catch (error: any) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
