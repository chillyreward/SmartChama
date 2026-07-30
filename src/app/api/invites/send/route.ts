import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { 
      email, 
      name, 
      chama_id
    } = await request.json();

    if (!email || !chama_id) {
      return NextResponse.json(
        { error: 'Email and chama_id are required.' },
        { status: 400 }
      );
    }

    const invited_by = user.id;

    // Get chama details for the email
    const { data: chama } = await supabase
      .from('chamas_v2')
      .select('name')
      .eq('id', chama_id)
      .maybeSingle();

    // Get inviting admin's name
    const { data: admin } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', invited_by)
      .maybeSingle();

    const inviteCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const { error: tokenError } = await supabase
      .from('invite_tokens')
      .insert({
        token: inviteCode,
        token_code: inviteCode,
        chama_id,
        created_by: invited_by,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        is_used: false
      });

    if (tokenError) {
      console.error('Save invite token failed:', tokenError);
      return NextResponse.json(
        { error: 'Could not save invite.' },
        { status: 500 }
      );
    }

    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?token=${inviteCode}&email=${encodeURIComponent(email)}`;

    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name || '',
        chama_name: chama?.name || '',
        inviter_name: admin?.full_name || 'Your admin',
        invite_code: inviteCode,
        chama_id
      },
      redirectTo: signupUrl
    });

    if (emailError) {
      return NextResponse.json({
        success: true,
        code: inviteCode,
        email_sent: false,
        note: 'Invite saved but email delivery failed. Share the code manually.'
      });
    }

    return NextResponse.json({ 
      success: true, 
      code: inviteCode,
      email_sent: true
    });
  } catch (error: any) {
    console.error("Send invite error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
