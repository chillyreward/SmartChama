import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { normalizeKenyanPhone, otpMatches, OTP_MAX_ATTEMPTS } from '@/lib/otp';

// A correct code returns a magic login link, so this endpoint is an account
// takeover target. Each code gets OTP_MAX_ATTEMPTS guesses, then it's burned.
// Only the newest code per phone is live (send-otp retires older ones).

const INVALID = () =>
  NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 });

export async function POST(request: Request) {
  try {
    const { phone_number, code } = await request.json();

    if (!phone_number || !code || !/^\d{6}$/.test(String(code))) {
      return NextResponse.json({ error: 'Phone number and a 6-digit code are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const phone = normalizeKenyanPhone(phone_number);

    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('id, code, attempts')
      .eq('phone_number', phone)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) return INVALID();

    const attempts = (otpRecord.attempts || 0) + 1;

    // Count the attempt before comparing, conditioned on the value we read, so
    // parallel guesses can't all slip through on the same attempt count.
    const { data: counted } = await supabase
      .from('otp_codes')
      .update({ attempts, used: attempts >= OTP_MAX_ATTEMPTS })
      .eq('id', otpRecord.id)
      .eq('attempts', otpRecord.attempts || 0)
      .eq('used', false)
      .select('id');

    if (!counted || counted.length === 0) return INVALID();

    if (!otpMatches(phone, String(code), otpRecord.code)) {
      return INVALID();
    }

    // Single use: only the request that flips used=false→true gets the link
    const { data: claimed } = await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id)
      .eq('attempts', attempts)
      .select('id');

    if (!claimed || claimed.length === 0) return INVALID();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('phone_number', phone)
      .maybeSingle();

    // Web uses magicLink; the Android app exchanges token_hash with
    // supabase.auth.verifyOtp({ token_hash, type: 'magiclink' }).
    let magicLink = null;
    let tokenHash = null;
    if (profile?.email) {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: profile.email
      });
      if (!linkError && linkData?.properties?.action_link) {
        magicLink = linkData.properties.action_link;
        tokenHash = linkData.properties.hashed_token ?? null;
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      isNewUser: !profile,
      magicLink,
      token_hash: tokenHash
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
