import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';
import { ADMIN_ROLES, getChamaMembership } from '@/lib/api-guard';

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

    // Payments are recorded by an official of the cycle's chama (cash / M-Pesa
    // received), for a member of that same chama. Members can't self-confirm.
    const { data: cycle } = await supabase
      .from('merry_go_round_cycles')
      .select('chama_id, amount_per_member, total_rounds, status')
      .eq('id', cycle_id)
      .maybeSingle();
    if (!cycle || cycle.status !== 'active') {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }
    if (!(await getChamaMembership(supabase, user.id, cycle.chama_id, ADMIN_ROLES))) {
      return NextResponse.json({ error: 'Only chama officials can record merry-go-round payments' }, { status: 403 });
    }
    const { data: payer } = await supabase
      .from('chama_memberships')
      .select('id')
      .eq('id', membership_id)
      .eq('chama_id', cycle.chama_id)
      .maybeSingle();
    if (!payer) {
      return NextResponse.json({ error: 'Member is not in this chama' }, { status: 400 });
    }
    const round = Number(round_number);
    const paid = Number(amount);
    if (!Number.isInteger(round) || round < 1 || round > cycle.total_rounds || !(paid > 0)) {
      return NextResponse.json({ error: 'Invalid round or amount' }, { status: 400 });
    }

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
      console.error('Merry-go-round contribution error:', error);
      return NextResponse.json({ error: 'Could not record contribution' }, { status: 500 });
    }

    return NextResponse.json({ success: true, contribution: contrib });

  } catch (error: any) {
    console.error('Contribute Merry-Go-Round Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
