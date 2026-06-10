import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // 1. Client Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Instantiate a client to verify the user's token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      );
    }

    const createdBy = user.id;

    // 2. Input Validation
    const body = await req.json().catch(() => ({}));
    const { chama_id, inviteePhone } = body;

    if (!chama_id) {
      return NextResponse.json(
        { error: 'Bad Request: chama_id is required' },
        { status: 400 }
      );
    }

    // 3. Token Generation
    // Generate a unique 6-character alphanumeric string (e.g., using randomBytes)
    const randomChars = randomBytes(3).toString('hex').toUpperCase(); // 6 chars like XYZ123
    const tokenCode = `CHAMA-${randomChars}`;

    // 4. Admin Bypass
    // Instantiate a separate Supabase admin client using the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 5. The Insert
    // Set expires_at to 7 days from now
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

    // 5.1 Send SMS Notification
    if (inviteePhone) {
      try {
        const { data: chamaData } = await supabaseAdmin.from('chamas').select('name').eq('id', chama_id).single();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        await fetch(`${appUrl}/api/sms/send`, {
          method: 'POST',
          body: JSON.stringify({
            phone: inviteePhone,
            message: `You've been invited to join ${chamaData?.name || 'a group'} on SmartChama! Click to join: ${appUrl}/signup?token=${tokenCode} Expires in 7 days.`
          })
        });
      } catch (smsErr) {
        console.error("SMS Invite sending failed:", smsErr);
      }
    }

    // 6. The Response
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
