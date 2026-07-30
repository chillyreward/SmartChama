import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let phone = body.phone?.replace(/\s/g, '');
    if (phone?.startsWith('0')) {
      phone = '+254' + phone.slice(1);
    }
    if (phone && !phone.startsWith('+254')) {
      phone = '+254' + phone;
    }

    if (!phone || !/^\+254\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format. Must be +254XXXXXXXXX' }, { status: 400 });
    }

    if (!body.message || !String(body.message).trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const message = String(body.message).trim();
    
    if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
      console.warn("Africa's Talking env vars missing, simulating SMS dispatch.");
      return NextResponse.json({ success: true, simulated: true, to: phone, message });
    }

    const response = await fetch(
      'https://api.africastalking.com/version1/messaging', 
      {
        method: 'POST',
        headers: {
          'apiKey': process.env.AFRICASTALKING_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          username: process.env.AFRICASTALKING_USERNAME,
          to: phone,
          message: message,
          from: process.env.AFRICASTALKING_SENDER_ID || "SmartChama"
        })
      }
    );
    
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("SMS error:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
