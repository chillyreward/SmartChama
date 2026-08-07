import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';
import { sms } from '@/lib/africastalking';

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
      chama_id,
      channel = 'sms'
    } = await request.json();

    const targetContact = phone || email;

    if (!targetContact || !chama_id) {
      return NextResponse.json(
        { error: 'Phone number and chama_id are required.' },
        { status: 400 }
      );
    }

    const invited_by = user.id;

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

    const inviteCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    // Insert token record into invite_tokens
    const insertPayload: any = {
      token: inviteCode,
      token_code: inviteCode,
      chama_id,
      created_by: invited_by,
      invited_phone: phone || null,
      invited_email: email || null,
      invited_name: name || null,
      status: 'pending',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      is_used: false
    };

    const { error: tokenError } = await supabase
      .from('invite_tokens')
      .insert(insertPayload);

    if (tokenError) {
      console.error('Save invite token failed:', tokenError);
      // Fallback if invited_phone/invited_name columns don't exist yet
      const { error: fallbackError } = await supabase
        .from('invite_tokens')
        .insert({
          token: inviteCode,
          token_code: inviteCode,
          chama_id,
          created_by: invited_by,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          is_used: false
        });

      if (fallbackError) {
        console.error('Fallback save invite token failed:', fallbackError);
        return NextResponse.json(
          { error: 'Could not save invite token.' },
          { status: 500 }
        );
      }
    }

    let smsSent = false;
    let note = 'Invite created. Share code manually: ' + inviteCode;

    // Attempt SMS send via Africa's Talking if phone is provided and API key is set
    if (phone && process.env.AFRICASTALKING_API_KEY) {
      try {
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+254' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }

        const chamaNameStr = chama?.name || 'SmartChama';
        const inviterStr = admin?.full_name || 'An Admin';
        const messageText = `You have been invited by ${inviterStr} to join ${chamaNameStr} on SmartChama. Use invite code: ${inviteCode} to register.`;

        await sms.send({
          to: [formattedPhone],
          message: messageText,
        });

        smsSent = true;
        note = `SMS invite sent to ${phone}`;
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

