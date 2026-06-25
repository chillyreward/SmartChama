import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { phone_number, purpose } = await request.json();
    console.log('OTP request received for:', phone_number);

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
    console.log('Generated OTP code (dev only, remove in production):', code);
    
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry
    
    console.log('Attempting to save OTP to database...');
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
    
    console.log('OTP saved to database successfully');
    
    // Send via Africa's Talking
    if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
      try {
        console.log('Attempting to send SMS via Africa\'s Talking...');
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
        console.log('Africa\'s Talking response:', JSON.stringify(atResult, null, 2));

        if (atResult.SMSMessageData?.Recipients?.[0]?.status !== 'Success') {
          console.error('SMS FAILED. Reason:', atResult.SMSMessageData?.Recipients?.[0]?.status);
        }
      } catch (err) {
        console.error("Africa's Talking Error:", err);
      }
    } else {
      console.log(`\n\n=== DEVELOPMENT MODE: SMS SIMULATION ===\nTo: ${phone}\nCode: ${code}\n=======================================\n\n`);
    }
    
    return NextResponse.json({ success: true, message: 'Verification code sent.' });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
