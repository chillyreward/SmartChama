// Sends transactional email through Resend's HTTP API (no SDK needed).
// Set RESEND_API_KEY and EMAIL_FROM (e.g. "Akibora <hello@mail.akibora.co.ke>")
// in Vercel. Without a key, emails are logged in development and skipped in
// production, so nothing else breaks.
import { SITE } from '@/lib/site'

export type EmailResult = { sent: boolean; skipped?: string; id?: string }

/** Placeholder addresses (phone-only accounts, deleted accounts) can never receive mail. */
export function isDeliverable(email?: string | null): email is string {
  return !!email && /@/.test(email) && !email.endsWith('.invalid')
}

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<EmailResult> {
  if (!isDeliverable(to)) return { sent: false, skipped: 'no deliverable address' }
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || `Akibora <onboarding@resend.dev>`
  if (!key) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[DEV] Email to ${to}: ${subject}\n${text}`)
    return { sent: false, skipped: 'RESEND_API_KEY not set' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, text, reply_to: SITE.contactEmail }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('Email failed:', res.status, data?.message ?? data)
      return { sent: false, skipped: data?.message || `HTTP ${res.status}` }
    }
    return { sent: true, id: data?.id }
  } catch (err) {
    console.error('Email error:', err)
    return { sent: false, skipped: 'network error' }
  }
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

/** One simple, readable layout for every email. `lines` are plain text paragraphs. */
export function layout({ heading, lines, code, button }: { heading: string; lines: string[]; code?: string; button?: { label: string; url: string } }) {
  const html = `<!doctype html><html><body style="margin:0;background:#E4EEE6;font-family:Helvetica,Arial,sans-serif;color:#0F241A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" style="max-width:520px;background:#F6FAF6;border-radius:20px" cellpadding="0" cellspacing="0"><tr><td style="padding:28px">
<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:20px">akibora</p>
<h1 style="margin:0 0 14px;font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.15">${esc(heading)}</h1>
${lines.map((l) => `<p style="margin:0 0 12px;font-size:16px;line-height:1.55;color:#2B4637">${esc(l)}</p>`).join('')}
${code ? `<p style="margin:18px 0;padding:16px;background:#0E1F18;color:#7CE3A6;border-radius:14px;text-align:center;font-family:Menlo,Consolas,monospace;font-size:26px;letter-spacing:4px">${esc(code)}</p>` : ''}
${button ? `<p style="margin:22px 0 6px"><a href="${esc(button.url)}" style="display:inline-block;background:#0E1F18;color:#EEF4EF;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:999px">${esc(button.label)}</a></p>` : ''}
<p style="margin:24px 0 0;font-size:12px;color:#4C6858">Sent by Akibora because of activity in your savings group. Questions: ${esc(SITE.contactEmail)}</p>
</td></tr></table></td></tr></table></body></html>`
  const text = [heading, '', ...lines, code ? `\n${code}\n` : '', button ? `${button.label}: ${button.url}` : '', '', `Questions: ${SITE.contactEmail}`].join('\n')
  return { html, text }
}
