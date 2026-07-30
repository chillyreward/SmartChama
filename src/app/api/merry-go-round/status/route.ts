import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chama_id = searchParams.get('chama_id');

    if (!chama_id) {
      return NextResponse.json({ error: 'chama_id query param is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch active cycle
    const { data: cycle } = await supabase
      .from('merry_go_round_cycles')
      .select('*')
      .eq('chama_id', chama_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cycle) {
      return NextResponse.json({ success: true, cycle: null, schedule: [], contributions: [] });
    }

    // Fetch schedule with recipient member profile info
    const { data: schedule } = await supabase
      .from('merry_go_round_schedule')
      .select(`
        *,
        chama_memberships (
          id, profile_id, role,
          profiles (full_name, phone_number, email)
        )
      `)
      .eq('cycle_id', cycle.id)
      .order('round_number', { ascending: true });

    // Fetch current round contributions
    const { data: contributions } = await supabase
      .from('merry_go_round_contributions')
      .select(`
        *,
        chama_memberships (
          id, profile_id,
          profiles (full_name)
        )
      `)
      .eq('cycle_id', cycle.id)
      .eq('round_number', cycle.current_round);

    return NextResponse.json({
      success: true,
      cycle,
      schedule: schedule || [],
      contributions: contributions || []
    });

  } catch (error: any) {
    console.error('Merry-Go-Round Status Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
