'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { describeSchedule, nextDueDate, prettyDate, todayNairobi, addDays, type GroupSchedule } from '@/lib/contribution-schedule'

// "Next contribution due" for a group, worked out from its schedule.
// Officials get a link to change the schedule.
export default function NextContributionCard({ chamaId, isOfficial = false }: { chamaId?: string | null; isOfficial?: boolean }) {
  const [state, setState] = useState<{ schedule: GroupSchedule; amount: number } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!chamaId) return
    const supabase = getSupabaseBrowser()
    Promise.all([
      supabase.from('chamas_v2').select('contribution_amount, contribution_frequency, contribution_due_day').eq('id', chamaId).maybeSingle(),
      supabase.from('chama_contribution_dates').select('due_date').eq('chama_id', chamaId).order('due_date'),
    ]).then(([g, d]) => {
      if (g.error || !g.data) { setFailed(true); return }
      setState({
        amount: Number(g.data.contribution_amount || 0),
        schedule: {
          frequency: g.data.contribution_frequency,
          dueDay: g.data.contribution_due_day,
          dates: (d.data ?? []).map((r: { due_date: string }) => r.due_date),
        },
      })
    })
  }, [chamaId])

  if (!chamaId || failed) return null
  if (!state) {
    return <div className="h-[84px] mb-6 rounded-2xl bg-gray-100 dark:bg-[#1a2218] animate-pulse" />
  }

  const today = todayNairobi()
  const due = nextDueDate(state.schedule, today)
  const label = !due
    ? 'No upcoming date'
    : due === today
      ? 'Due today'
      : due === addDays(today, 1)
        ? 'Due tomorrow'
        : prettyDate(due)

  return (
    <div className="card-bg border border-[var(--border)] border-l-4 border-l-[#22C55E] rounded-2xl p-4 md:p-5 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined text-[#22C55E] text-[28px]">event</span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Next contribution</div>
          <div className="text-[18px] md:text-[20px] font-bold text-[var(--text-main)] leading-tight">
            {label}
            {due && state.amount > 0 && (
              <span className="text-[14px] font-semibold text-[var(--text-muted)]"> · KSh {state.amount.toLocaleString('en-KE')}</span>
            )}
          </div>
          <div className="text-[12px] text-[var(--text-muted)]">
            {describeSchedule(state.schedule)}
            {!due && state.schedule.frequency === 'custom' && ' · all chosen dates have passed'}
          </div>
        </div>
      </div>
      {isOfficial && (
        <Link href="/admin/settings" className="text-[13px] font-semibold text-[#22C55E] hover:underline">
          {due ? 'Change schedule' : 'Set dates'}
        </Link>
      )}
    </div>
  )
}
