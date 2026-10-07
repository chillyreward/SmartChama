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
    const { penalty_id, action } = body; // action = 'pay' | 'waive'

    if (!penalty_id || !action || (action !== 'pay' && action !== 'waive')) {
      return NextResponse.json({ error: 'penalty_id and valid action (pay/waive) are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const newStatus = action === 'pay' ? 'paid' : 'waived';

    // Only an official of the fine's chama can mark it paid or waive it
    const { data: existing } = await supabase
      .from('member_penalties')
      .select('chama_id, status')
      .eq('id', penalty_id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: 'Penalty not found' }, { status: 404 });
    }
    if (!(await getChamaMembership(supabase, user.id, existing.chama_id, ADMIN_ROLES))) {
      return NextResponse.json({ error: 'Only chama officials can settle penalties' }, { status: 403 });
    }
    if (existing.status !== 'unpaid') {
      return NextResponse.json({ error: 'This penalty is already settled' }, { status: 400 });
    }

    const { data: penalty, error } = await supabase
      .from('member_penalties')
      .update({
        status: newStatus,
        paid_at: action === 'pay' ? new Date().toISOString() : null
      })
      .eq('id', penalty_id)
      .eq('status', 'unpaid')
      .select()
      .single();

    if (error) {
      console.error('Pay penalty error:', error);
      return NextResponse.json({ error: 'Could not update penalty' }, { status: 500 });
    }

    return NextResponse.json({ success: true, penalty });

  } catch (error: any) {
    console.error('Pay penalty error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
