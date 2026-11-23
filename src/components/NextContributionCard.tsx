'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { describeSchedule, nextDueDate, prettyDate, todayNairobi, addDays, cycleStart, type GroupSchedule } from '@/lib/contribution-schedule';
import { ButtonLink, Money, cn } from '@/components/ui';

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

// "Next contribution due" for a group, worked out from its schedule.
// Members get a pay button; officials get a link to change the schedule.
export default function NextContributionCard({ chamaId, isOfficial = false, className }: { chamaId?: string | null; isOfficial?: boolean; className?: string }) {
  const [state, setState] = useState<{ schedule: GroupSchedule; amount: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!chamaId) return;
    const supabase = getSupabaseBrowser();
    Promise.all([
      supabase.from('chamas_v2').select('contribution_amount, contribution_frequency, contribution_due_day').eq('id', chamaId).maybeSingle(),
      supabase.from('chama_contribution_dates').select('due_date').eq('chama_id', chamaId).order('due_date'),
    ]).then(([g, d]) => {
      if (g.error || !g.data) { setFailed(true); return; }
      setState({
        amount: Number(g.data.contribution_amount || 0),
        schedule: {
          frequency: g.data.contribution_frequency,
          dueDay: g.data.contribution_due_day,
          dates: (d.data ?? []).map((r: { due_date: string }) => r.due_date),
        },
      });
    });
  }, [chamaId]);

  if (!chamaId || failed) return null;
  if (!state) return <div className={cn('rounded-[24px] bg-sage/60 animate-pulse min-h-[220px]', className)} />;

  const today = todayNairobi();
  const due = nextDueDate(state.schedule, today);
  const days = due ? daysBetween(today, due) : null;
  const start = due ? cycleStart(state.schedule, due) : null;
  const span = due && start ? Math.max(1, daysBetween(start, due) + 1) : 0;
  const elapsed = due && start ? Math.min(span, Math.max(0, daysBetween(start, today) + 1)) : 0;
  const segs = Math.min(span, 31);
  const when = !due ? 'No upcoming date set' : due === today ? 'Due today' : due === addDays(today, 1) ? 'Due tomorrow' : `Due ${prettyDate(due)}`;

  return (
    <section aria-labelledby="next-contribution" className={cn('rounded-[24px] bg-sage text-sage-ink p-6 flex flex-col', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="next-contribution" className="text-[15px] text-[#2B4637]">Next contribution</h2>
        {days !== null && days > 1 && <span className="text-[13px] text-[#2B4637]">in {days} days</span>}
      </div>
      {state.amount > 0 && <Money value={state.amount} className="text-[46px] leading-[1.05] mt-1.5" />}
      <div className="text-[15px] mt-1">{when}</div>
      <div className="text-[13px] text-[#44604F] mt-0.5">
        {describeSchedule(state.schedule)}
        {!due && state.schedule.frequency === 'custom' && '. All chosen dates have passed.'}
      </div>
      {span > 1 && (
        <div className="mt-5" aria-hidden="true">
          <div className="flex gap-[3px]">
            {Array.from({ length: segs }, (_, i) => {
              const done = (i + 1) / segs <= elapsed / span;
              return <span key={i} className={cn('flex-1 h-[22px] rounded-[3px]', i === segs - 1 ? 'bg-forest' : done ? 'bg-moss' : 'bg-[#A9C3B0]')} />;
            })}
          </div>
          <div className="text-[13px] text-[#2B4637] mt-2">{span - elapsed} of {span} days left in this cycle</div>
        </div>
      )}
      <div className="mt-auto pt-6 flex flex-col gap-2">
        {isOfficial ? (
          <Link href="/admin/settings" className="h-[50px] rounded-full bg-forest text-[#EEF4EF] font-semibold text-[15px] flex items-center justify-center hover:bg-canopy">
            {due ? 'Change the schedule' : 'Set the dates'}
          </Link>
        ) : (
          <ButtonLink href="/dashboard/contributions?pay=1" variant="forest" size="lg" className="w-full">Pay with M-Pesa</ButtonLink>
        )}
      </div>
    </section>
  );
}
