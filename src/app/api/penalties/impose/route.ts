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
    const { chama_id, membership_id, type, amount, reason } = body;

    if (!chama_id || !membership_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields: chama_id, membership_id, amount' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify admin role
    const { data: adminMembership } = await supabase
      .from('chama_memberships')
      .select('id')
      .eq('profile_id', user.id)
      .eq('chama_id', chama_id)
      .eq('status', 'active')
      .in('role', ['admin', 'chairlady', 'treasurer', 'secretary'])
      .maybeSingle();

    if (!adminMembership) {
      return NextResponse.json({ error: 'Only Chama admins can impose penalties' }, { status: 403 });
    }

    const { data: penalty, error } = await supabase
      .from('member_penalties')
      .insert({
        chama_id,
        membership_id,
        type: type || 'custom',
        amount: Number(amount),
        reason: reason || 'Fine imposed by admin',
        status: 'unpaid',
        imposed_by: adminMembership.id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, penalty });

  } catch (error: any) {
    console.error('Impose penalty error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
