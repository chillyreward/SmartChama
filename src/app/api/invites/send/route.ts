import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';
import { ADMIN_ROLES, getChamaMembership } from '@/lib/api-guard';
import { formatKenyanPhone, sendSms } from '@/lib/sms';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const {
      phone,
      email,
      name,
      chama_id
    } = await request.json();

    const targetContact = phone || email;

    if (!targetContact || !chama_id) {
      return NextResponse.json(
        { error: 'Phone number and chama_id are required.' },
        { status: 400 }
      );
    }

    // Only officials of this chama may invite, and the inviter is always the
    // signed-in user, so nobody can mint invites or send branded SMS for a
    // chama they don't run.
    const invited_by = user.id;
    if (!(await getChamaMembership(supabase, invited_by, chama_id, ADMIN_ROLES))) {
      return NextResponse.json({ error: 'Only chama officials can send invites.' }, { status: 403 });
    }

    // Get chama details
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

    // Unambiguous characters (no 0/O, 1/I), from a secure RNG
    const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const inviteCode = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

    const formattedPhone = phone ? formatKenyanPhone(phone) : null;

    const { error: tokenError } = await supabase
      .from('invite_tokens')
      .insert({
        token: inviteCode,
        chama_id,
        created_by: invited_by,
        invited_phone: formattedPhone,
        invited_email: email || null,
        invited_name: name || null,
        status: 'active',
        max_uses: 1,
        is_active: true,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      });

    if (tokenError) {
      console.error('Save invite token failed:', tokenError);
      return NextResponse.json(
        { error: 'Could not save invite token.' },
        { status: 500 }
      );
    }

    let smsSent = false;
    let note = 'Invite created. Share code manually: ' + inviteCode;

    if (formattedPhone) {
      const chamaNameStr = chama?.name || 'SmartChama';
      const inviterStr = admin?.full_name || 'An Admin';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const link = appUrl ? ` ${appUrl}/signup?token=${inviteCode}` : '';
      const messageText = `You have been invited by ${inviterStr} to join ${chamaNameStr} on SmartChama. Use invite code: ${inviteCode} to register.${link} Expires in 48 hours.`;

      try {
        const result = await sendSms(formattedPhone, messageText);
        smsSent = result.success && !result.simulated;
        note = smsSent ? `SMS invite sent to ${formattedPhone}` : 'Invite saved, but SMS was not sent. Share code manually.';
      } catch (smsErr) {
        console.warn('SMS send warning (non-fatal):', smsErr);
        note = 'Invite saved, but SMS delivery failed. Share code manually.';
      }
    }

    return NextResponse.json({
      success: true,
      code: inviteCode,
      sms_sent: smsSent,
      note
    });
  } catch (error: any) {
    console.error("Send invite error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
