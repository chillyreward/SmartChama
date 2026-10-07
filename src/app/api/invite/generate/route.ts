import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';
import { ADMIN_ROLES, getChamaMembership } from '@/lib/api-guard';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireAuth(req);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { chama_id, inviteePhone } = body;

    if (!chama_id) {
      return NextResponse.json(
        { error: 'Bad Request: chama_id is required' },
        { status: 400 }
      );
    }

    const createdBy = user.id;
    const supabaseAdmin = getSupabaseAdmin();

    // Must be an official of this chama, not just any signed-in user
    if (!(await getChamaMembership(supabaseAdmin, createdBy, chama_id, ADMIN_ROLES))) {
      return NextResponse.json({ error: 'Only chama officials can create invites.' }, { status: 403 });
    }

    // Generate a unique 6-character token code
    const randomChars = randomBytes(3).toString('hex').toUpperCase();
    const tokenCode = `CHAMA-${randomChars}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: insertError } = await supabaseAdmin
      .from('invite_tokens')
      .insert([
        {
          token: tokenCode,
          chama_id,
          created_by: createdBy,
          expires_at: expiresAt.toISOString(),
          max_uses: 1,
          is_active: true,
          invited_phone: inviteePhone || null
        }
      ]);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Could not create invite.' },
        { status: 500 }
      );
    }

    // Send SMS Notification via outbox if phone provided
    if (inviteePhone) {
      try {
        const { data: chamaData } = await supabaseAdmin.from('chamas_v2').select('name').eq('id', chama_id).maybeSingle();

        await supabaseAdmin.from('outbox').insert({
          event_type: 'send_sms',
          payload: {
            phone: inviteePhone,
            message: `You've been invited to join ${chamaData?.name || 'a group'} on SmartChama! Join code: ${tokenCode}`
          }
        });
      } catch (smsErr) {
        console.error("SMS Invite sending failed:", smsErr);
      }
    }

    return NextResponse.json(
      {
        token_code: tokenCode,
        expires_at: expiresAt.toISOString()
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('API Error /invite/generate:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
