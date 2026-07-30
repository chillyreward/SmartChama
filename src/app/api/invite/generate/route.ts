import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';
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

    // Generate a unique 6-character token code
    const randomChars = randomBytes(3).toString('hex').toUpperCase();
    const tokenCode = `CHAMA-${randomChars}`;

    const supabaseAdmin = getSupabaseAdmin();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: insertError } = await supabaseAdmin
      .from('invite_tokens')
      .insert([
        {
          token_code: tokenCode,
          chama_id,
          created_by: createdBy,
          expires_at: expiresAt.toISOString(),
          is_used: false
        }
      ]);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Send SMS Notification via outbox if phone provided
    if (inviteePhone) {
      try {
        const { data: chamaData } = await supabaseAdmin.from('chamas_v2').select('name').eq('id', chama_id).maybeSingle();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
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
