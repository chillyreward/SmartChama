import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { phone_number, purpose } = await request.json();

    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    const supabase = getSupabaseAdmin();
    
    // Normalize phone
    let phone = phone_number.replace(/\s/g, '');
    if (phone.startsWith('0')) {
      phone = '+254' + phone.slice(1);
    }
    if (!phone.startsWith('+254')) {
      phone = '+254' + phone;
    }
    
    // Rate limit: max 3 OTP requests per phone per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact' })
      .eq('phone_number', phone)
      .gte('created_at', tenMinAgo);
    
    if (count !== null && count >= 3) {
      return NextResponse.json({ error: 'Too many requests. Please wait 10 minutes before trying again.' }, { status: 429 });
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry
    
    const { error: insertError } = await supabase.from('otp_codes').insert({
      phone_number: phone,
      code,
      purpose: purpose || 'login',
      expires_at: expiresAt
    });

    if (insertError) {
      console.error('OTP database insert FAILED:', insertError.message);
      return NextResponse.json({ error: 'Could not generate verification code.' }, { status: 500 });
    }
    
    // Send via Africa's Talking
    if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
      try {
        const atResponse = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'apiKey': process.env.AFRICASTALKING_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: new URLSearchParams({
            username: process.env.AFRICASTALKING_USERNAME,
            to: phone,
            message: `Your SmartChama verification code is ${code}. Valid for 5 minutes. Do not share this code with anyone.`,
            from: process.env.AFRICASTALKING_SENDER_ID || ''
          })
        });

        const atResult = await atResponse.json();

        if (atResult.SMSMessageData?.Recipients?.[0]?.status !== 'Success') {
          console.error('SMS FAILED. Reason:', atResult.SMSMessageData?.Recipients?.[0]?.status);
        }
      } catch (err) {
        console.error("Africa's Talking Error:", err);
      }
    } else {
      console.info(`[DEV] SMS to ${phone}: Code sent (check otp_codes table)`);
    }
    
    return NextResponse.json({ success: true, message: 'Verification code sent.' });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
