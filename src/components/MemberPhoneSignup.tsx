'use client'
import { useState } from 'react'

// Member sign-up with phone number (no email): details -> SMS code.
// /api/auth/phone-signup checks the invite code, that the phone number and ID
// number aren't already registered, texts a code, then creates the account
// with the phone already verified and joins the group.

export type MemberSignupResult = {
  access_token?: string
  refresh_token?: string
  signed_in: boolean
  joined: boolean
  pending: boolean
  chama_id: string | null
  chama_name: string | null
  message?: string
}

const label = 'block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]'
const input = 'w-full px-4 py-3 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]'
const primary = 'w-full py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] disabled:opacity-50 transition-colors'

export default function MemberPhoneSignup({ initialCode = '', onDone }: { initialCode?: string; onDone: (r: MemberSignupResult) => void }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [joinCode, setJoinCode] = useState(initialCode)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const [codeSentTo, setCodeSentTo] = useState<string | null>(null)
  const [chamaName, setChamaName] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const details = { full_name: fullName, phone_number: phone, national_id: nationalId, join_code: joinCode, password }

  async function post(action: 'start' | 'complete', extra: Record<string, string> = {}) {
    const res = await fetch('/api/auth/phone-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...details, ...extra }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
    return data
  }

  async function sendCode() {
    setError('')
    if (password !== confirmPassword) { setError("The passwords don't match."); return }
    if (!agreed) { setError('Please accept the Terms and Privacy Policy.'); return }
    setBusy(true)
    try {
      const data = await post('start')
      setCodeSentTo(data.phone)
      setChamaName(data.chama_name || '')
      setSmsCode('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function createAccount() {
    setError('')
    setBusy(true)
    try {
      const data = await post('complete', { code: smsCode })
      onDone(data)
    } catch (e: any) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (codeSentTo) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[15px] font-semibold text-[#161d16] dark:text-white">Enter the code we texted to {codeSentTo}</p>
          {chamaName && <p className="text-[13px] mt-1 text-[#4F5A53] dark:text-[#8FA196]">You&apos;re joining <strong>{chamaName}</strong>.</p>}
        </div>
        <label htmlFor="signup-sms-code" className="sr-only">SMS code</label>
        <input
          id="signup-sms-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={smsCode}
          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
          placeholder="6-digit code"
          className={input + ' text-center text-[24px] font-mono tracking-[0.4em]'}
          autoFocus
        />
        {error && <p className="text-[14px] text-red-500" role="alert">{error}</p>}
        <button type="button" onClick={createAccount} disabled={busy || smsCode.length !== 6} className={primary}>
          {busy ? 'Creating your account…' : 'Create account'}
        </button>
        <div className="flex justify-between text-[13px]">
          <button type="button" onClick={sendCode} disabled={busy} className="font-semibold text-[#22C55E] hover:underline disabled:opacity-50">Resend code</button>
          <button type="button" onClick={() => { setCodeSentTo(null); setError('') }} className="text-[#4F5A53] dark:text-[#8FA196] hover:underline">Change details</button>
        </div>
      </div>
    )
  }

  const filled = fullName.trim() && phone.replace(/\D/g, '').length >= 9 && /^\d{7,9}$/.test(nationalId) &&
    joinCode.length >= 4 && password.length >= 8 && confirmPassword

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="m-name" className={label}>Full name</label>
        <input id="m-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" className={input} />
      </div>
      <div>
        <label htmlFor="m-phone" className={label}>Phone number</label>
        <input id="m-phone" type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
        <p className="text-[12px] mt-1.5 text-[#8FA196]">You&apos;ll sign in with this number. We&apos;ll text a code to confirm it.</p>
      </div>
      <div>
        <label htmlFor="m-id" className={label}>National ID number</label>
        <input id="m-id" inputMode="numeric" autoComplete="off" value={nationalId} onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 9))} className={input} />
      </div>
      <div>
        <label htmlFor="m-code" className={label}>Group or invite code</label>
        <input
          id="m-code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14))}
          autoComplete="off"
          className={input + ' font-mono tracking-[0.2em] uppercase'}
        />
        <p className="text-[12px] mt-1.5 text-[#8FA196]">From your group admin.</p>
      </div>
      <div>
        <label htmlFor="m-password" className={label}>Password</label>
        <div className="relative">
          <input id="m-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" className={input + ' pr-12'} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8FA196]">
            <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="m-confirm" className={label}>Confirm password</label>
        <input id="m-confirm" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={input} />
        {confirmPassword && confirmPassword !== password && <p className="mt-1.5 text-[12px] text-red-500">Passwords don&apos;t match yet.</p>}
      </div>
      <label className="flex items-start gap-3 text-[13px] text-[#4F5A53] dark:text-[#8FA196]">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 accent-[#22C55E]" />
        <span>I agree to the <a href="/terms" target="_blank" className="text-[#22C55E] underline">Terms</a> and <a href="/privacy" target="_blank" className="text-[#22C55E] underline">Privacy Policy</a>.</span>
      </label>
      {error && <p className="text-[14px] text-red-500" role="alert">{error}</p>}
      <button type="button" onClick={sendCode} disabled={busy || !filled} className={primary}>
        {busy ? 'Checking…' : 'Send verification code'}
      </button>
    </div>
  )
}
