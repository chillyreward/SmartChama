'use client'
import { useState } from 'react'

// Adds or changes the user's phone number. The number is saved only after the
// user types the code we text to it (/api/phone/send-code, /api/phone/verify),
// so nobody can attach a number they don't hold. Phone sign-in, USSD and
// M-Pesa defaults all rely on that.

type Props = {
  currentPhone?: string | null
  verified?: boolean
  onVerified?: (phone: string) => void
  label?: string
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]'

export default function PhoneVerification({ currentPhone, verified, onVerified, label = 'Phone number' }: Props) {
  const [editing, setEditing] = useState(!currentPhone)
  const [phone, setPhone] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function post(path: string, body: unknown) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
    return data
  }

  async function sendCode() {
    setError(''); setInfo(''); setBusy(true)
    try {
      const data = await post('/api/phone/send-code', { phone_number: phone })
      setSentTo(data.phone)
      setCode('')
      setInfo(`We sent a 6-digit code to ${data.phone}.`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (!sentTo) return
    setError(''); setBusy(true)
    try {
      const data = await post('/api/phone/verify', { phone_number: sentTo, code })
      setEditing(false)
      setSentTo(null)
      setInfo('')
      onVerified?.(data.phone)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4F5A53] dark:text-[#8FA196]">
        {label}
      </label>

      {!editing && currentPhone ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-[#1B2520]">
          <span className="text-[15px] font-medium text-[#161d16] dark:text-white">{currentPhone}</span>
          <span className="flex items-center gap-3">
            {verified !== false && (
              <span className="text-[12px] font-semibold text-[#16A34A]">Verified</span>
            )}
            <button type="button" onClick={() => setEditing(true)} className="text-[13px] font-semibold text-[#22C55E] hover:underline">
              Change number
            </button>
          </span>
        </div>
      ) : !sentTo ? (
        <div className="flex gap-2">
          <input
            id="phone-to-verify"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
            className={inputClass}
            aria-label="Phone number to verify"
          />
          <button
            type="button"
            onClick={sendCode}
            disabled={busy || phone.replace(/\D/g, '').length < 9}
            className="shrink-0 px-4 rounded-xl bg-[#22C55E] text-white text-[14px] font-semibold disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send code'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id="phone-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              className={inputClass + ' tracking-[0.3em] font-mono'}
              aria-label="Verification code"
            />
            <button
              type="button"
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="shrink-0 px-4 rounded-xl bg-[#22C55E] text-white text-[14px] font-semibold disabled:opacity-50"
            >
              {busy ? 'Checking…' : 'Verify'}
            </button>
          </div>
          <div className="flex gap-4 text-[13px]">
            <button type="button" onClick={sendCode} disabled={busy} className="font-semibold text-[#22C55E] hover:underline disabled:opacity-50">
              Resend code
            </button>
            <button type="button" onClick={() => { setSentTo(null); setInfo(''); setError('') }} className="text-[#4F5A53] dark:text-[#8FA196] hover:underline">
              Use a different number
            </button>
          </div>
        </div>
      )}

      {editing && currentPhone && !sentTo && (
        <button type="button" onClick={() => { setEditing(false); setError('') }} className="text-[13px] text-[#4F5A53] dark:text-[#8FA196] hover:underline">
          Keep {currentPhone}
        </button>
      )}
      {info && <p className="text-[13px] text-[#4F5A53] dark:text-[#8FA196]">{info}</p>}
      {error && <p className="text-[13px] text-red-500" role="alert">{error}</p>}
    </div>
  )
}
