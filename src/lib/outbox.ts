// Side effects queued in the `outbox` table (confirmation SMS and email, trust
// score updates). Request handlers queue an event, then run processOutbox()
// right after responding (next/server `after`), so members hear back within
// seconds. The daily cron runs it again to retry anything that failed.
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/sms'
import { isDeliverable, layout, sendEmail } from '@/lib/email'
import { recalcTrustScore } from '@/lib/trust-score'
import { SITE } from '@/lib/site'

const ksh = (n: number) => `KSh ${Math.round(Number(n) || 0).toLocaleString('en-KE')}`

async function handle(supabase: SupabaseClient, event: { event_type: string; payload: any }) {
  const p = event.payload || {}

  if (event.event_type === 'contribution_confirmed') {
    const { membership_id, amount, receipt } = p
    await recalcTrustScore(supabase, membership_id)

    const { data: m } = await supabase
      .from('chama_memberships')
      .select('profiles(full_name, phone_number, email), chamas_v2(name)')
      .eq('id', membership_id)
      .maybeSingle()
    const profile = (m?.profiles as any) || {}
    const group = (m?.chamas_v2 as any)?.name || 'your group'

    if (profile.phone_number) {
      await sendSms(profile.phone_number, `Akibora: Your ${ksh(amount)} contribution to ${group} is confirmed. M-Pesa ref ${receipt}.`)
    }
    if (isDeliverable(profile.email)) {
      const { html, text } = layout({
        heading: 'Payment confirmed',
        lines: [`${ksh(amount)} is recorded in ${group}.`, `M-Pesa reference: ${receipt}`, 'Everyone in the group can see it in the shared record.'],
        button: { label: 'Open your group', url: `${SITE.url}/dashboard/contributions` },
      })
      await sendEmail(profile.email, `${ksh(amount)} confirmed in ${group}`, html, text)
    }
    return
  }

  if (event.event_type === 'send_sms') {
    if (p.phone && p.message) {
      const r = await sendSms(p.phone, String(p.message).slice(0, 480))
      if (!r.success) throw new Error('SMS provider rejected the message')
    }
    return
  }

  if (event.event_type === 'send_email') {
    if (isDeliverable(p.to) && p.subject) {
      const r = await sendEmail(p.to, p.subject, p.html, p.text || '')
      if (!r.sent && r.skipped !== 'RESEND_API_KEY not set') throw new Error(`Email not sent: ${r.skipped}`)
    }
    return
  }

  console.warn('Outbox: unknown event type', event.event_type)
}

export async function processOutbox(supabase: SupabaseClient, limit = 20) {
  const { data: events } = await supabase
    .from('outbox')
    .select('*')
    .eq('processed', false)
    .lt('attempts', 5)
    .order('created_at', { ascending: true })
    .limit(limit)

  let done = 0
  for (const event of events || []) {
    // Claim the row first so a cron run and an `after` run can't both send it
    const { data: claimed } = await supabase
      .from('outbox')
      .update({ attempts: (event.attempts || 0) + 1 })
      .eq('id', event.id)
      .eq('attempts', event.attempts || 0)
      .eq('processed', false)
      .select('id')
    if (!claimed?.length) continue
    try {
      await handle(supabase, event)
      await supabase.from('outbox').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', event.id)
      done++
    } catch (err) {
      console.error('Outbox event failed:', event.id, err)
    }
  }
  return done
}
