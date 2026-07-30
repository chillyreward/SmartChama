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
    const { cycle_id, round_number, membership_id, amount, mpesa_receipt } = body;

    if (!cycle_id || !round_number || !membership_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: contrib, error } = await supabase
      .from('merry_go_round_contributions')
      .upsert({
        cycle_id,
        round_number: Number(round_number),
        membership_id,
        amount: Number(amount),
        status: 'confirmed',
        mpesa_receipt: mpesa_receipt || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'cycle_id, round_number, membership_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, contribution: contrib });

  } catch (error: any) {
    console.error('Contribute Merry-Go-Round Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
