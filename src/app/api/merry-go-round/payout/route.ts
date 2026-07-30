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
    const { cycle_id, round_number } = body;

    if (!cycle_id || !round_number) {
      return NextResponse.json({ error: 'cycle_id and round_number are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify cycle exists
    const { data: cycle } = await supabase
      .from('merry_go_round_cycles')
      .select('*')
      .eq('id', cycle_id)
      .single();

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    // Mark current round as paid
    const { error: scheduleError } = await supabase
      .from('merry_go_round_schedule')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('cycle_id', cycle_id)
      .eq('round_number', Number(round_number));

    if (scheduleError) {
      return NextResponse.json({ error: scheduleError.message }, { status: 500 });
    }

    // Advance cycle to next round or mark completed
    const nextRound = Number(round_number) + 1;
    const isCompleted = nextRound > cycle.total_rounds;

    await supabase
      .from('merry_go_round_cycles')
      .update({
        current_round: isCompleted ? cycle.total_rounds : nextRound,
        status: isCompleted ? 'completed' : 'active'
      })
      .eq('id', cycle_id);

    return NextResponse.json({
      success: true,
      completed: isCompleted,
      next_round: isCompleted ? null : nextRound
    });

  } catch (error: any) {
    console.error('Payout Merry-Go-Round Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
