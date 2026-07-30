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
    const { chama_id, name, amount_per_member, frequency, recipient_member_ids } = body;

    if (!chama_id || !amount_per_member || !recipient_member_ids || !Array.isArray(recipient_member_ids) || recipient_member_ids.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: chama_id, amount_per_member, recipient_member_ids' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if user is admin in this Chama
    const { data: adminCheck } = await supabase
      .from('chama_memberships')
      .select('id, role')
      .eq('profile_id', user.id)
      .eq('chama_id', chama_id)
      .eq('status', 'active')
      .in('role', ['admin', 'chairlady', 'treasurer', 'secretary'])
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Only Chama admins can create a Merry-Go-Round cycle' }, { status: 403 });
    }

    // 1. Create Cycle
    const totalRounds = recipient_member_ids.length;
    const { data: cycle, error: cycleError } = await supabase
      .from('merry_go_round_cycles')
      .insert({
        chama_id,
        name: name || 'Merry-Go-Round Cycle',
        amount_per_member: Number(amount_per_member),
        frequency: frequency || 'monthly',
        status: 'active',
        current_round: 1,
        total_rounds: totalRounds
      })
      .select()
      .single();

    if (cycleError || !cycle) {
      return NextResponse.json({ error: cycleError?.message || 'Failed to create cycle' }, { status: 500 });
    }

    // 2. Generate Schedule
    const scheduleItems = recipient_member_ids.map((memberId: string, index: number) => {
      const roundNum = index + 1;
      const scheduledDate = new Date();
      if (frequency === 'weekly') {
        scheduledDate.setDate(scheduledDate.getDate() + (index * 7));
      } else {
        scheduledDate.setMonth(scheduledDate.getMonth() + index);
      }

      return {
        cycle_id: cycle.id,
        round_number: roundNum,
        recipient_membership_id: memberId,
        scheduled_date: scheduledDate.toISOString().slice(0, 10),
        status: 'pending'
      };
    });

    const { error: scheduleError } = await supabase
      .from('merry_go_round_schedule')
      .insert(scheduleItems);

    if (scheduleError) {
      return NextResponse.json({ error: scheduleError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cycle });

  } catch (error: any) {
    console.error('Create Merry-Go-Round Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
