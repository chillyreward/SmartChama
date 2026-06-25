import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { phone_number, code } = await request.json();
    
    if (!phone_number || !code) {
      return NextResponse.json({ error: 'Phone number and code are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    let phone = phone_number.replace(/\s/g, '');
    if (phone.startsWith('0')) {
      phone = '+254' + phone.slice(1);
    }
    if (!phone.startsWith('+254')) {
      phone = '+254' + phone;
    }
    
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_number', phone)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !otpRecord) {
      // Track failed attempts
      await supabase.rpc('increment', { row_id: 0 }); // Placeholder if rpc isn't set up, we can do manual update
      
      const { data: latestOtp } = await supabase
        .from('otp_codes')
        .select('id, attempts')
        .eq('phone_number', phone)
        .eq('code', code)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (latestOtp) {
        await supabase
          .from('otp_codes')
          .update({ attempts: (latestOtp.attempts || 0) + 1 })
          .eq('id', latestOtp.id);
      }
      
      return NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 });
    }
    
    // Mark as used
    await supabase.from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);
      
    // Find if user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('phone_number', phone)
      .single();
      
    let magicLink = null;
    if (profile && profile.email) {
      // Generate a magic link so the client can log in without a password
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
