'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import ContributionSchedulePicker, { ContributionSchedule, scheduleComplete, scheduleDates, toScheduleMode } from '@/components/ContributionSchedulePicker'
import { describeSchedule, nextDueDate, prettyDate, todayNairobi, type GroupSchedule } from '@/lib/contribution-schedule'

// Group settings: change the contribution schedule and its dates.
export default function ContributionScheduleSettings({ chamaId, onSaved }: { chamaId: string; onSaved?: () => void }) {
  const [current, setCurrent] = useState<GroupSchedule | null>(null)
  const [value, setValue] = useState<ContributionSchedule>({ mode: 'custom', dates: [] })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    const supabase = getSupabaseBrowser()
    const [g, d] = await Promise.all([
      supabase.from('chamas_v2').select('contribution_frequency, contribution_due_day').eq('id', chamaId).maybeSingle(),
      supabase.from('chama_contribution_dates').select('due_date').eq('chama_id', chamaId).order('due_date'),
    ])
    const schedule: GroupSchedule = {
      frequency: g.data?.contribution_frequency,
      dueDay: g.data?.contribution_due_day,
      dates: (d.data ?? []).map((r: { due_date: string }) => r.due_date),
    }
    setCurrent(schedule)

    // The picker only offers today or later: a repeating schedule shows its
    // next due date as the start (same schedule), chosen dates show the
    // upcoming ones. Weekly/biweekly groups start from a fresh choice.
    const today = todayNairobi()
    const mode = toScheduleMode(schedule.frequency)
    const next = nextDueDate(schedule, today)
    if (mode === 'daily') setValue({ mode, dates: [] })
    else if (mode === 'custom') setValue({ mode, dates: schedule.frequency === 'custom' ? schedule.dates.filter((x) => x >= today) : [] })
    else setValue({ mode, dates: next ? [next] : [] })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the group changes
  useEffect(() => { if (chamaId) load() }, [chamaId])

  async function save() {
    setMessage(null)
    if (!scheduleComplete(value)) {
      setMessage({ ok: false, text: value.mode === 'custom' ? 'Pick at least one date, or choose Every day.' : 'Tap the first contribution date.' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/chamas/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chama_id: chamaId, frequency: value.mode, dates: scheduleDates(value) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save the schedule.')
      await load()
      setMessage({ ok: true, text: 'Schedule saved. Members will be reminded before each due date.' })
      onSaved?.()
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not save the schedule.' })
    } finally {
      setSaving(false)
    }
  }

  const next = current ? nextDueDate(current) : null

  return (
    <section className="space-y-4 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-main)] font-geist">Contribution schedule</h2>
        {current && (
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            Now: {describeSchedule(current)}
            {next ? ` · next due ${prettyDate(next)}` : ' · no upcoming date'}
          </p>
        )}
      </div>

      {current ? (
        <ContributionSchedulePicker value={value} onChange={setValue} />
      ) : (
        <div className="h-40 rounded-xl bg-gray-100 dark:bg-[#1a2218] animate-pulse" />
      )}

      {message && (
        <p className={`text-[13px] ${message.ok ? 'text-[#16A34A]' : 'text-red-500'}`} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving || !current}
          className="bg-[#22C55E] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#006e2f] transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save schedule'}
        </button>
      </div>
    </section>
  )
}
