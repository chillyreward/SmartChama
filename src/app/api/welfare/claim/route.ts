import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chama_id, membership_id, amount, reason, description } = body;

    if (!chama_id || !membership_id || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields: chama_id, membership_id, amount, reason' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: claim, error } = await supabase
      .from('welfare_claims')
      .insert({
        chama_id,
        membership_id,
        amount: Number(amount),
        reason,
        description: description || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, claim });

  } catch (error: any) {
    console.error('Submit welfare claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
