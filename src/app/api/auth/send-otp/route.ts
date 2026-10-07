import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { generateOtp, hashOtp, normalizeKenyanPhone, OTP_TTL_MS } from '@/lib/otp';

const PURPOSES = ['login', 'signup', 'password_reset'];

export async function POST(request: Request) {
  try {
    const { phone_number, purpose } = await request.json();

    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const phone = normalizeKenyanPhone(phone_number);
    if (!/^\+254(7|1)\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid Kenyan phone number' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Rate limit: max 3 codes per phone per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('otp_codes')
      .select('id', { count: 'exact', head: true })
      .eq('phone_number', phone)
      .gte('created_at', tenMinAgo);

    if (count !== null && count >= 3) {
      return NextResponse.json({ error: 'Too many requests. Please wait 10 minutes before trying again.' }, { status: 429 });
    }

    // Only the newest code is valid
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('phone_number', phone)
      .eq('used', false);

    const code = generateOtp();

    const { error: insertError } = await supabase.from('otp_codes').insert({
      phone_number: phone,
      code: hashOtp(phone, code),
      purpose: PURPOSES.includes(purpose) ? purpose : 'login',
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString()
    });

    if (insertError) {
      console.error('OTP insert failed:', insertError.message);
      return NextResponse.json({ error: 'Could not generate verification code.' }, { status: 500 });
    }

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
        const status = atResult.SMSMessageData?.Recipients?.[0]?.status;
        if (status !== 'Success') {
          console.error('OTP SMS failed:', status);
        }
      } catch (err) {
        console.error("Africa's Talking Error:", err);
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // Local development only: never log codes in production
      console.log(`[DEV] OTP for ${phone}: ${code}`);
    } else {
      console.error('OTP SMS not sent: Africa\'s Talking is not configured');
    }

    return NextResponse.json({ success: true, message: 'Verification code sent.' });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
