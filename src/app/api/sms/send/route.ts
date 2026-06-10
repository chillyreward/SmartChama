import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();
    
    if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
      console.warn("Africa's Talking env vars missing, skipping real SMS.");
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
