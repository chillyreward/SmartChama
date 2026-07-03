import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || 'MG1c0ae3dc8f92a7965591e868cb3f4c9e';

    if (!accountSid || !authToken || accountSid === 'your_twilio_account_sid') {
      console.warn('[DEV] Twilio not configured — SMS simulated');
      return NextResponse.json({ success: true, simulated: true, to: phone, message });
    }

    // Normalize phone number
    let formattedPhone = phone.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.slice(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+254' + formattedPhone;
    }

    const client = twilio(accountSid, authToken);

    const msg = await client.messages.create({
      body: message,
      to: formattedPhone,
      messagingServiceSid,
    });

    console.log('SMS sent | SID:', msg.sid, '| Status:', msg.status, '| To:', formattedPhone);

    if (msg.errorCode) {
      return NextResponse.json({
        success: false,
        error: `SMS failed (${msg.errorCode}): ${msg.errorMessage}`
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, sid: msg.sid, status: msg.status, to: formattedPhone });

  } catch (error: any) {
    console.error('SMS error:', error.message, '| Code:', error.code);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
