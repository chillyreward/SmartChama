import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const { chamaId, maxUses = 10, expiresInDays = 30, userId } = await req.json();

    if (!chamaId) {
      return NextResponse.json(
        { success: false, error: 'Chama ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique token
    const token = randomBytes(16).toString('hex');

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Insert invite token
    const { data, error } = await supabase
      .from('invite_tokens')
      .insert({
        token,
        chama_id: chamaId,
        created_by: userId,
        max_uses: maxUses,
        current_uses: 0,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select('*, chamas(name)')
      .single();

    if (error) {
      console.error('Error creating invite token:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/member/signup?invite=${token}`;

    return NextResponse.json({
      success: true,
      token: data.token,
      inviteLink,
      chamaName: data.chamas?.name,
      expiresAt: data.expires_at,
      maxUses: data.max_uses
    });
  } catch (error: any) {
    console.error('Generate invite error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
