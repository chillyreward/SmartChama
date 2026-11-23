'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button, ButtonLink, Field, Notice } from '@/components/ui'

// Reached from the email link: /auth/callback exchanges the code for a
// session, then sends people here to choose a new password.
export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const [state, setState] = useState<'checking' | 'ready' | 'no-session' | 'done'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setState(data.session ? 'ready' : 'no-session')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setState((s) => (s === 'done' ? s : 'ready'))
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [supabase])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError("The passwords don't match.")
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(updateError.message.includes('different')
        ? 'Choose a password you have not used on this account before.'
        : 'Could not save the new password. Request a fresh link and try again.')
      return
    }
    setState('done')
  }

  if (state === 'no-session') {
    return (
      <AuthShell title="This link has expired" subtitle="Reset links work once and only for a short time. Go back to sign in, type your email, and choose Forgot it? to get a new one.">
        <ButtonLink href="/login" size="lg" className="w-full">Back to sign in</ButtonLink>
      </AuthShell>
    )
  }

  if (state === 'done') {
    return (
      <AuthShell title="Password changed" subtitle="Use the new password next time you sign in.">
        <Button size="lg" className="w-full" onClick={() => router.push('/dashboard')}>Continue to your group</Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" subtitle="At least 8 characters. Avoid one you use for M-Pesa or email.">
      {error && <Notice tone="danger" className="mb-5">{error}</Notice>}
      <form onSubmit={save} className="space-y-5">
        <Field label="New password">
          <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={state === 'checking'} required />
        </Field>
        <Field label="Type it again">
          <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={state === 'checking'} required />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={saving || state === 'checking'}>
          {saving ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </AuthShell>
  )
}
