import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 });
    }

    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;
    const senderId = process.env.AFRICASTALKING_SENDER_ID || 'SmartChama';

    if (!apiKey || !username) {
      console.warn("[DEV] Africa's Talking not configured — SMS simulated");
      return NextResponse.json({ success: true, simulated: true, to: phone, message });
    }

    // Normalize phone number to +254 format
    let formattedPhone = phone.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '+254' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('+')) formattedPhone = '+254' + formattedPhone;

    const params = new URLSearchParams({ username, to: formattedPhone, message });

    // Don't add sender ID — use AT default until SmartChama sender ID is approved
    // if (username !== 'sandbox') params.append('from', senderId);

    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params,
    });

    const data = await res.json();
    console.log('AT SMS response:', JSON.stringify(data));

    const recipient = data.SMSMessageData?.Recipients?.[0];
    const delivered = recipient?.status === 'Success';

    if (!delivered) {
      return NextResponse.json({
        success: false,
        error: `SMS failed: ${recipient?.status || data.SMSMessageData?.Message || 'Unknown error'}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: recipient?.messageId,
      status: recipient?.status,
      cost: recipient?.cost
    });

  } catch (error: any) {
    console.error('SMS error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
