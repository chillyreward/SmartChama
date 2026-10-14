import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { forbidden, isInternalRequest } from '@/lib/api-guard';
import { sendSms } from '@/lib/sms';
import { addDays, cycleStart, nextDueDate, prettyDate, todayNairobi, type GroupSchedule } from '@/lib/contribution-schedule';

// Daily Vercel cron (Authorization: Bearer CRON_SECRET), 08:00 Kenya time.
// Reminds members 3 days before and on each contribution due date, by SMS
// and in-app notification. Skips groups that contribute every day, members
// who already paid this cycle, and members who turned reminders off.
// contribution_reminders records each send, so a re-run never repeats one.

type Kind = 'three_days' | 'due_today';
type MemberRow = {
  id: string;
  profile_id: string;
  profiles: { full_name: string | null; phone_number: string | null; notification_prefs: Record<string, boolean> | null } | null;
};

export async function GET(request: Request) {
  if (!isInternalRequest(request)) return forbidden();

  const supabase = getSupabaseAdmin();
  const today = todayNairobi();
  const inThree = addDays(today, 3);
  const summary = { groups_checked: 0, groups_due: 0, reminders_sent: 0, sms_sent: 0, skipped_paid: 0, errors: 0 };

  try {
    const { data: chamas, error: chamaError } = await supabase
      .from('chamas_v2')
      .select('id, name, contribution_amount, contribution_frequency, contribution_due_day, status')
      .neq('contribution_frequency', 'daily');
    if (chamaError) throw chamaError;

    for (const chama of chamas ?? []) {
      if (chama.status && chama.status !== 'active') continue;
      summary.groups_checked++;
      try {
        const { data: dateRows } = await supabase
          .from('chama_contribution_dates')
          .select('due_date')
          .eq('chama_id', chama.id);
        const schedule: GroupSchedule = {
          frequency: chama.contribution_frequency,
          dueDay: chama.contribution_due_day,
          dates: (dateRows ?? []).map((r) => r.due_date as string),
        };

        const due = nextDueDate(schedule, today);
        const kind: Kind | null = due === today ? 'due_today' : due === inThree ? 'three_days' : null;
        if (!due || !kind) continue;
        summary.groups_due++;

        const { data: members } = await supabase
          .from('chama_memberships')
          .select('id, profile_id, profiles(full_name, phone_number, notification_prefs)')
          .eq('chama_id', chama.id)
          .eq('status', 'active');
        const rows = (members ?? []) as unknown as MemberRow[];
        if (!rows.length) continue;

        // Paid for this cycle = a confirmed contribution since the cycle began
        const { data: paidRows } = await supabase
          .from('contributions_v2')
          .select('membership_id')
          .eq('chama_id', chama.id)
          .eq('status', 'confirmed')
          .gte('created_at', `${cycleStart(schedule, due)}T00:00:00+03:00`);
        const paid = new Set((paidRows ?? []).map((r) => r.membership_id));

        const toRemind = rows.filter((m) => {
          if (paid.has(m.id)) { summary.skipped_paid++; return false; }
          return m.profiles?.notification_prefs?.contribution_reminders !== false;
        });
        if (!toRemind.length) continue;

        // Claim each (member, due date, kind) first; only newly claimed rows are sent
        const { data: claimed, error: claimError } = await supabase
          .from('contribution_reminders')
          .upsert(
            toRemind.map((m) => ({ chama_id: chama.id, membership_id: m.id, due_date: due, kind })),
            { onConflict: 'chama_id,membership_id,due_date,kind', ignoreDuplicates: true }
          )
          .select('membership_id');
        if (claimError) throw claimError;
        const fresh = new Set((claimed ?? []).map((r) => r.membership_id));

        const amount = Number(chama.contribution_amount || 0);
        const amountText = amount > 0 ? `KSh ${amount.toLocaleString('en-KE')} ` : '';
        const when = kind === 'due_today' ? 'today' : `on ${prettyDate(due)}`;
        const title = kind === 'due_today' ? 'Contribution due today' : 'Contribution due in 3 days';
        const message = `Your ${amountText}contribution to ${chama.name} is due ${when}.`;

        const notifications = [];
        for (const m of toRemind) {
          if (!fresh.has(m.id)) continue;
          notifications.push({ profile_id: m.profile_id, chama_id: chama.id, type: 'reminder', title, message });
          const phone = m.profiles?.phone_number;
          if (phone && m.profiles?.notification_prefs?.sms_notifications !== false) {
            const result = await sendSms(phone, `Akibora: ${message} Pay via the app or M-Pesa.`);
            if (result.success && !result.simulated) summary.sms_sent++;
          }
          summary.reminders_sent++;
        }
        if (notifications.length) {
          const { error: notifyError } = await supabase.from('notifications').insert(notifications);
          if (notifyError) console.error('Reminder notifications failed:', chama.id, notifyError);
        }
      } catch (err) {
        summary.errors++;
        console.error('Reminder run failed for group', chama.id, err);
      }
    }

    return NextResponse.json({ date: today, ...summary });
  } catch (error) {
    console.error('Reminder run failed:', error);
    return NextResponse.json({ error: 'Reminder run failed', ...summary }, { status: 500 });
  }
}
