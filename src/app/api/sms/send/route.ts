import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 });
    }

    const apiKey = process.env.WAKALI_API_KEY;

    if (!apiKey) {
      console.warn('[DEV] Wakali not configured — SMS simulated');
      return NextResponse.json({ success: true, simulated: true, to: phone, message });
    }

    // Normalize phone number to +254 format
    let formattedPhone = phone.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '+254' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('+')) formattedPhone = '+254' + formattedPhone;

    const res = await fetch('https://api.wakalisms.com/sms/send', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        message,
      }),
    });

    const data = await res.json();
    console.log('Wakali SMS response:', JSON.stringify(data));

    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.detail || data.message || 'SMS failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('SMS error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
