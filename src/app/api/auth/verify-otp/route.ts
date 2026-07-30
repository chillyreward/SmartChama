import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { phone_number, code } = await request.json();
    
    if (!phone_number || !code) {
      return NextResponse.json({ error: 'Phone number and code are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    let phone = String(phone_number).replace(/\s/g, '');
    if (phone.startsWith('0')) {
      phone = '+254' + phone.slice(1);
    }
    if (!phone.startsWith('+254')) {
      phone = '+254' + phone;
    }
    
    // Fetch latest active OTP record by phone_number (NOT by code, to properly track attempts)
    const { data: latestOtp } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_number', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestOtp) {
      return NextResponse.json({ error: 'No OTP requested for this phone number. Please request a new one.' }, { status: 400 });
    }

    // Lockout check: if attempts >= 5
    if ((latestOtp.attempts || 0) >= 5) {
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 });
    }

    // Expiration check
    if (new Date(latestOtp.expires_at) < new Date() || latestOtp.used) {
      return NextResponse.json({ error: 'OTP code has expired or already been used. Please request a new one.' }, { status: 400 });
    }

    // Code match check
    if (latestOtp.code !== String(code).trim()) {
      // Increment attempts counter on wrong code
      await supabase
        .from('otp_codes')
        .update({ attempts: (latestOtp.attempts || 0) + 1 })
        .eq('id', latestOtp.id);

      const remaining = 5 - ((latestOtp.attempts || 0) + 1);
      if (remaining <= 0) {
        return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 });
      }

      return NextResponse.json({ error: `Invalid OTP code. ${remaining} attempts remaining.` }, { status: 400 });
    }
    
    // Code matched! Mark as used
    await supabase.from('otp_codes')
      .update({ used: true })
      .eq('id', latestOtp.id);
      
    // Find if user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('phone_number', phone)
      .maybeSingle();
      
    let magicLink = null;
    if (profile && profile.email) {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: profile.email
      });
      
      if (!linkError && linkData?.properties?.action_link) {
        magicLink = linkData.properties.action_link;
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      verified: true,
      email: profile?.email || null,
      isNewUser: !profile,
      magicLink
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
