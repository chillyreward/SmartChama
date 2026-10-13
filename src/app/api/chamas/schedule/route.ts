import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { ADMIN_ROLES, getChamaMembership } from '@/lib/api-guard';
import { RECURRING, todayNairobi, validateSchedule } from '@/lib/contribution-schedule';

// Officials change their group's contribution schedule. Past dates are kept as
// history; upcoming dates are replaced by the new schedule's dates.
export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { user } = auth;

    const body = await request.json().catch(() => ({}));
    const chamaId = String(body.chama_id || '');
    const admin = getSupabaseAdmin();

    if (!(await getChamaMembership(admin, user.id, chamaId, ADMIN_ROLES))) {
      return NextResponse.json({ error: 'Only group officials can change the schedule.' }, { status: 403 });
    }

    const schedule = validateSchedule(body.frequency, body.dates);
    if ('error' in schedule) {
      return NextResponse.json({ error: schedule.error }, { status: 400 });
    }

    const today = todayNairobi();
    const { data: upcoming, error: readError } = await admin
      .from('chama_contribution_dates')
      .select('due_date')
      .eq('chama_id', chamaId)
      .gte('due_date', today);
    if (readError) throw readError;

    const keep = new Set(schedule.dates);
    const existing = new Set((upcoming ?? []).map((r) => r.due_date as string));
    const toDelete = [...existing].filter((d) => !keep.has(d));
    const toAdd = schedule.dates.filter((d) => !existing.has(d));

    const { error: updateError } = await admin
      .from('chamas_v2')
      .update({ contribution_frequency: schedule.frequency, updated_at: new Date().toISOString() })
      .eq('id', chamaId);
    if (updateError) throw updateError;

    if (toDelete.length) {
      const { error } = await admin
        .from('chama_contribution_dates')
        .delete()
        .eq('chama_id', chamaId)
        .in('due_date', toDelete);
      if (error) throw error;
    }
    if (toAdd.length) {
      const { error } = await admin
        .from('chama_contribution_dates')
        .insert(toAdd.map((due_date) => ({ chama_id: chamaId, due_date })));
      if (error) throw error;
    }

    await admin.from('group_activity').insert({
      chama_id: chamaId,
      event_type: 'schedule_changed',
      description: RECURRING.includes(schedule.frequency)
        ? `Contribution schedule set to ${schedule.frequency} from ${schedule.dates[0]}`
        : schedule.frequency === 'daily'
          ? 'Contribution schedule set to every day'
          : `Contribution schedule set to ${schedule.dates.length} chosen date(s)`
    });

    return NextResponse.json({ success: true, frequency: schedule.frequency, dates: schedule.dates });
  } catch (error) {
    console.error('Schedule update error:', error);
    return NextResponse.json({ error: 'Could not save the schedule. Please try again.' }, { status: 500 });
  }
}
