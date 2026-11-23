'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import SocialSignIn from '@/components/SocialSignIn'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button, Field, Notice, inputClass } from '@/components/ui'

export default function LoginPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [info, setInfo] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    if (lockedUntil && Date.now() < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      setError(`Too many login attempts. Try again in ${remaining} seconds.`)
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    // One field takes either an email or a phone number. Phone sign-in goes via
    // the server, which looks up the account for that (verified) number.
    const identifier = email.trim()
    const usingPhone = !identifier.includes('@')
    let userId: string | null = null
    let authError: { message: string } | null = null

    if (usingPhone) {
      const res = await fetch('/api/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: identifier, password })
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 429 || res.status === 400) {
        setError(data.error || 'Could not sign in.')
        setLoading(false)
        return
      }
      if (!res.ok) {
        authError = { message: res.status === 401 ? 'Invalid' : (data.error || 'Could not sign in.') }
      } else {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        })
        if (sessionError) authError = { message: sessionError.message }
        userId = sessionData.user?.id ?? null
      }
    } else {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password
      })
      if (error) authError = error
      userId = authData.user?.id ?? null
    }

    if (authError || !userId) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 60000)
        setAttempts(0)
        setError('Too many failed login attempts. Account locked for 60 seconds.')
      } else {
        setError(
          authError?.message.includes('Invalid')
            ? `Incorrect ${usingPhone ? 'phone number' : 'email'} or password (${5 - newAttempts} attempts remaining).`
            : 'Could not sign in. Please try again.'
        )
      }
      setLoading(false)
      return
    }

    const { data: memberships } = await supabase
      .from('chama_memberships')
      .select(`
        role, status, 
        chamas_v2!inner(id)
      `)
      .eq('profile_id', userId)
      .eq('status', 'active')

    if (!memberships?.length) {
      router.push('/onboarding')
      return
    }

    if (memberships.length > 1) {
      router.push('/select-group')
      return
    }

    const m = memberships[0]
    const cid = (m.chamas_v2 as any).id
    sessionStorage.setItem('active_chama_id', cid)
    localStorage.setItem('sc_last_chama_id', cid)
    document.cookie = `active_chama_id=${cid}; path=/; max-age=${60 * 60 * 24 * 30}`

    const isAdmin = ['admin', 'chairlady', 'treasurer', 'secretary'].includes(m.role)

    // Return people to the page they were sent away from, if it is on this site
    const back = new URLSearchParams(window.location.search).get('redirect')
    if (back && back.startsWith('/') && !back.startsWith('//') && !back.startsWith('/\\')) {
      router.push(back)
      return
    }
    router.push(isAdmin ? '/admin/dashboard' : '/dashboard')
  }

  async function handleForgotPassword() {
    setInfo('')
    if (!email.trim() || !email.includes('@')) {
      setError('Type your email address above first. Reset links are sent by email. If you signed up with a phone number only, ask your group treasurer to help.')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    )
    if (resetError) {
      setError('Could not send the reset link. Check the address and try again.')
      return
    }
    setError('')
    setInfo(`If ${email.trim()} has an account, a reset link is on its way. Check your inbox and spam folder.`)
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with the phone number or email you joined with."
      footer={
        <>
          New to Akibora?{' '}
          <Link href="/signup" className="font-semibold text-brand underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {error && <Notice tone="danger" className="mb-5">{error}</Notice>}
      {info && <Notice tone="ok" className="mb-5">{info}</Notice>}

      <form onSubmit={handleLogin} className="space-y-5">
        <Field label="Phone number or email">
          <input
            type="text"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="0712 345 678 or you@example.com"
            required
            className={inputClass}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-[14px] font-medium">Password</label>
            <button type="button" onClick={handleForgotPassword} className="text-[14px] font-medium text-brand hover:underline underline-offset-4">
              Forgot it?
            </button>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-5">
        <SocialSignIn next="/dashboard" disabled={loading} />
      </div>

      <p className="mt-6 text-[14px] text-ink-3">
        Running a group?{' '}
        <Link href="/admin/login" className="text-ink-2 font-medium underline underline-offset-4 hover:text-ink">Officials sign in here</Link>
      </p>
    </AuthShell>
  )
}
