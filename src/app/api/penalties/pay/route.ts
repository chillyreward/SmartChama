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
    const { penalty_id, action } = body; // action = 'pay' | 'waive'

    if (!penalty_id || !action || (action !== 'pay' && action !== 'waive')) {
      return NextResponse.json({ error: 'penalty_id and valid action (pay/waive) are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const newStatus = action === 'pay' ? 'paid' : 'waived';

    const { data: penalty, error } = await supabase
      .from('member_penalties')
      .update({
        status: newStatus,
        paid_at: action === 'pay' ? new Date().toISOString() : null
      })
      .eq('id', penalty_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, penalty });

  } catch (error: any) {
    console.error('Pay penalty error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
