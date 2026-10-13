'use client'
import { useMemo, useState } from 'react'

// Contribution schedule:
//  - every day
//  - monthly / quarterly / yearly, repeating from a first due date picked on
//    the calendar (dates holds that one start date)
//  - specific dates tapped on a calendar (any number, nothing repeats)

export type ScheduleMode = 'daily' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
export type ContributionSchedule = { mode: ScheduleMode; dates: string[] } // dates: YYYY-MM-DD

const RECURRING: Record<string, string> = { monthly: 'month', quarterly: '3 months', yearly: 'year' }
export const isRecurring = (mode: ScheduleMode) => mode in RECURRING

// Ready to save: every day needs nothing, the others need a date
export function scheduleComplete(s: ContributionSchedule) {
  return s.mode === 'daily' || s.dates.length > 0
}

// Dates to send with the group: none for every day, the start date for a
// repeating schedule, all picked dates otherwise
export function scheduleDates(s: ContributionSchedule) {
  if (s.mode === 'daily') return []
  return isRecurring(s.mode) ? s.dates.slice(0, 1) : s.dates
}

export function scheduleSummary(s: ContributionSchedule) {
  if (s.mode === 'daily') return 'every day'
  if (isRecurring(s.mode)) return s.dates[0] ? `${s.mode}, from ${prettyDate(s.dates[0])}` : `${s.mode}, pick a start date`
  return `${s.dates.length} date${s.dates.length === 1 ? '' : 's'}`
}

// Missing or unknown frequencies (older saved drafts) fall back to picked dates
export function toScheduleMode(f: unknown): ScheduleMode {
  return f === 'daily' || f === 'monthly' || f === 'quarterly' || f === 'yearly' ? f : 'custom'
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

function todayNairobi(): string {
  // en-CA formats as YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' })
}

function prettyDate(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export default function ContributionSchedulePicker({
  value,
  onChange,
}: {
  value: ContributionSchedule
  onChange: (v: ContributionSchedule) => void
}) {
  const today = todayNairobi()
  const [ty, tm] = today.split('-').map(Number)
  const [view, setView] = useState({ year: ty, month: tm - 1 }) // month 0-11

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(view.year, view.month, 1))
    const lead = (first.getUTCDay() + 6) % 7 // Monday-first
    const days = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate()
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  }, [view])

  const selected = new Set(value.dates)
  const monthLabel = new Date(Date.UTC(view.year, view.month, 1)).toLocaleDateString('en-KE', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const atCurrentMonth = view.year === ty && view.month === tm - 1

  const recurring = isRecurring(value.mode)
  const toggle = (d: string) => {
    if (recurring) {
      onChange({ ...value, dates: selected.has(d) ? [] : [d] })
      return
    }
    const next = selected.has(d) ? value.dates.filter((x) => x !== d) : [...value.dates, d].sort()
    onChange({ ...value, dates: next })
  }
  // A repeating schedule keeps only the earliest picked date as its start
  const pick = (mode: ScheduleMode) =>
    onChange({ mode, dates: isRecurring(mode) ? value.dates.slice(0, 1) : value.dates })
  const shift = (delta: number) => {
    const m = view.month + delta
    setView({ year: view.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 })
  }

  const radio = (mode: ContributionSchedule['mode'], title: string, hint: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={value.mode === mode}
      onClick={() => pick(mode)}
      className={`text-left p-3 rounded-xl border transition-colors ${value.mode === mode ? 'border-[#22C55E] bg-[#F0FDF4] dark:bg-[#0E2E1B]' : 'border-[#E5E7EB] dark:border-[#1B2520] bg-white dark:bg-[#0E1410]'}`}
    >
      <span className="block text-[14px] font-semibold text-[#161d16] dark:text-white">{title}</span>
      <span className="block text-[12px] text-[#4F5A53] dark:text-[#8FA196]">{hint}</span>
    </button>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Contribution schedule">
        {radio('daily', 'Every day', 'Members contribute daily')}
        {radio('monthly', 'Monthly', 'Once a month')}
        {radio('quarterly', 'Quarterly', 'Every 3 months')}
        {radio('yearly', 'Yearly', 'Once a year')}
        {radio('custom', 'Specific dates', 'Pick the dates on a calendar')}
      </div>

      {value.mode !== 'daily' && (
        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1B2520] bg-white dark:bg-[#0E1410] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => shift(-1)} disabled={atCurrentMonth} aria-label="Previous month"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F0FDF4] dark:hover:bg-[#0E2E1B] disabled:opacity-30">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="text-[14px] font-semibold text-[#161d16] dark:text-white">{monthLabel}</span>
            <button type="button" onClick={() => shift(1)} aria-label="Next month"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F0FDF4] dark:hover:bg-[#0E2E1B]">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-[11px] font-semibold text-[#8FA196] py-1">{w}</span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`b${i}`} />
              const d = iso(view.year, view.month, day)
              const past = d < today
              const on = selected.has(d)
              return (
                <button
                  key={d}
                  type="button"
                  disabled={past}
                  onClick={() => toggle(d)}
                  aria-pressed={on}
                  aria-label={prettyDate(d)}
                  className={`h-9 rounded-lg text-[13px] tabular-nums transition-colors ${
                    on ? 'bg-[#22C55E] text-white font-semibold'
                      : past ? 'text-[#C4CCC7] dark:text-[#3A4740] cursor-not-allowed'
                      : 'text-[#161d16] dark:text-white hover:bg-[#F0FDF4] dark:hover:bg-[#0E2E1B]'
                  } ${d === today && !on ? 'ring-1 ring-[#22C55E]' : ''}`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {recurring ? (
            <p className="text-[12px] text-[#4F5A53] dark:text-[#8FA196]">
              {value.dates[0]
                ? <>First contribution on <span className="font-semibold text-[#16A34A]">{prettyDate(value.dates[0])}</span>, then every {RECURRING[value.mode]} on the same day{Number(value.dates[0].slice(8)) > 28 ? ' (the last day in shorter months)' : ''}.</>
                : <>Tap the first due date. It repeats every {RECURRING[value.mode]} from there.</>}
            </p>
          ) : value.dates.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-[#4F5A53] dark:text-[#8FA196]">
                {value.dates.length} contribution date{value.dates.length === 1 ? '' : 's'}
              </p>
              <div className="flex flex-wrap gap-2">
                {value.dates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-[#F0FDF4] dark:bg-[#0E2E1B] text-[12px] text-[#16A34A]">
                    {prettyDate(d)}
                    <button type="button" onClick={() => toggle(d)} aria-label={`Remove ${prettyDate(d)}`}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#DCFCE7] dark:hover:bg-[#14532D]">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[#8FA196]">Tap the dates when members should contribute. You can add more later.</p>
          )}
        </div>
      )}
    </div>
  )
}
