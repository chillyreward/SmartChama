'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import PhoneVerification from '@/components/PhoneVerification'
import KycVerification from '@/components/KycVerification'
import MemberPhoneSignup, { MemberSignupResult } from '@/components/MemberPhoneSignup'
import SocialSignIn from '@/components/SocialSignIn'
import ContributionSchedulePicker, { ContributionSchedule, scheduleComplete, scheduleDates } from '@/components/ContributionSchedulePicker'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button, ButtonLink, Field, Notice, Panel, cn, inputClass } from '@/components/ui'
import { Check, Copy, Hourglass, MailCheck } from 'lucide-react'


function SignupForm() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Determine role from URL param
  // /signup?role=admin → admin flow
  // /signup?role=member → member flow
  const urlRole = searchParams.get('role') || 'member'
  const isAdminSignup = urlRole === 'admin'

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingAccount, setExistingAccount] = useState(false)

  // Step 1 fields (both paths)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [copied, setCopied] = useState(false)

  // Step 2 — Admin: group details
  const [groupName, setGroupName] = useState('')
  const [contributionAmount, setContributionAmount] = useState('')
  // Every day, or specific dates picked on a calendar
  const [schedule, setSchedule] = useState<ContributionSchedule>({ mode: 'custom', dates: [] })

  // Step 2 — Member: group code
  // Invite SMS links use ?token=, older links ?code=
  const [groupCode, setGroupCode] = useState(searchParams.get('code') || searchParams.get('token') || '')
  
  // Success state — shows group code for admin after creation
  const [createdGroupCode, setCreatedGroupCode] = useState('')
  const [success, setSuccess] = useState(false)
  // After the group is created: verify phone (step 3), then identity (step 4)
  const [postStep, setPostStep] = useState<null | 'phone' | 'identity'>(null)
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [kycMessage, setKycMessage] = useState('')
  const [pendingConfirmation, setPendingConfirmation] = useState(false)
  // Group-code joins wait for an official to approve the request
  const [pendingApproval, setPendingApproval] = useState(false)
  const [targetChamaName, setTargetChamaName] = useState('')

  // Password strength
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthLabels = ['', 'Too short', 'Good', 'Strong']

  async function handleStep1() {
    setError('')
    if (!fullName.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError("The passwords don't match.")
      return
    }
    setStep(2)
  }

  // Supabase only returns a session from signUp when email confirmation is off.
  // With it on, the user must confirm first, so group setup finishes in /onboarding.
  async function createAccount(): Promise<{ hasSession: boolean } | null> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Read by the handle_new_user trigger to fill the profile row
        data: {
          full_name: fullName.trim(),
          // The group set up on this form. With email confirmation on, the
          // confirmation link can open on another device, so onboarding reads
          // it from here as well as from localStorage.
          pending_group: pendingGroup()
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
      }
    })

    if (authError || !authData.user) {
      if (authError?.message.toLowerCase().includes('already registered')) {
        accountExists()
      } else {
        setError(authError?.message || 'Could not create account.')
      }
      return null
    }

    // With confirmation on, Supabase hides "email taken" by returning a user with no identities
    if (authData.user.identities && authData.user.identities.length === 0) {
      accountExists()
      return null
    }

    return { hasSession: !!authData.session }
  }

  // Email already has an account: keep the group they just described so it is
  // waiting for them after they sign in, and offer a one-tap way there.
  function accountExists() {
    try { if (groupName.trim()) localStorage.setItem('sc_pending_group', JSON.stringify(pendingGroup())) } catch { /* ignore */ }
    setExistingAccount(true)
    setError('')
  }

  function pendingGroup() {
    return { name: groupName.trim(), amount: contributionAmount, frequency: schedule.mode, dates: scheduleDates(schedule) }
  }

  function rememberActiveChama(chamaId: string) {
    try {
      document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
      sessionStorage.setItem('active_chama_id', chamaId)
      localStorage.setItem('sc_last_chama_id', chamaId)
    } catch {}
  }

  async function handleAdminSignup() {
    setError('')
    if (!groupName.trim()) {
      setError('Please enter a group name.')
      return
    }
    if (!scheduleComplete(schedule)) {
      setError(schedule.mode === 'custom'
        ? 'Pick at least one contribution date on the calendar, or choose Every day.'
        : 'Tap the first contribution date on the calendar.')
      return
    }
    if (!contributionAmount || Number(contributionAmount) < 1) {
      setError('Please enter a contribution amount.')
      return
    }

    setLoading(true)

    try {
      const account = await createAccount()
      if (!account) { setLoading(false); return }

      if (!account.hasSession) {
        try {
          localStorage.setItem('sc_pending_group', JSON.stringify(pendingGroup()))
        } catch {}
        setPendingConfirmation(true)
        setLoading(false)
        return
      }

      const res = await fetch('/api/chamas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          chama_name: groupName.trim(),
          contribution_amount: contributionAmount,
          contribution_frequency: schedule.mode,
          contribution_dates: scheduleDates(schedule)
        })
      })
      const data = await res.json()

      if (!res.ok) {
        // The account exists now; onboarding lets them retry creating the group
        setError(data.error || 'Account created but group setup failed.')
        setLoading(false)
        router.push('/onboarding')
        return
      }

      rememberActiveChama(data.chama_id)
      setCreatedGroupCode(data.group_code)
      setPostStep('phone')
      setLoading(false)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  // Member signed up with phone (MemberPhoneSignup): keep the session, then
  // go to the group, or show "request pending" for group-code joins
  async function handleMemberDone(r: MemberSignupResult) {
    if (!r.signed_in || !r.access_token || !r.refresh_token) {
      router.push('/login')
      return
    }
    await supabase.auth.setSession({ access_token: r.access_token, refresh_token: r.refresh_token })
    if (!r.joined) {
      router.push('/onboarding')
    } else if (r.pending) {
      setTargetChamaName(r.chama_name || '')
      setPendingApproval(true)
    } else if (r.chama_id) {
      rememberActiveChama(r.chama_id)
      router.push('/dashboard')
    }
  }

  if (pendingApproval) {
    return (
      <AuthShell
        aside="none"
        title="Your request is in"
        subtitle={<>The officials of <strong className="text-ink">{targetChamaName || 'the group'}</strong> need to approve you. You&apos;ll get a notification, and the group opens for you once they do.</>}
      >
        <Panel tone="sage" className="flex gap-4 items-start">
          <Hourglass className="shrink-0 mt-0.5" size={22} />
          <p className="text-[15px] leading-relaxed">Officials usually approve people they know. If it is taking long, ask your chair or treasurer to check the Members page.</p>
        </Panel>
        <ButtonLink href="/login" size="lg" className="w-full mt-6">Back to sign in</ButtonLink>
      </AuthShell>
    )
  }

  // Shown when Supabase requires email confirmation
  if (pendingConfirmation) {
    return (
      <AuthShell
        aside="none"
        title="Check your email"
        subtitle={<>We sent a link to <strong className="text-ink">{email.trim()}</strong>. Open it to activate your account, and we&apos;ll finish {isAdminSignup ? 'creating your group' : 'adding you to your group'}.</>}
      >
        <Panel tone="sage" className="flex gap-4 items-start">
          <MailCheck className="shrink-0 mt-0.5" size={22} />
          <p className="text-[15px] leading-relaxed">The link can open on any device. Nothing there? Look in spam, or wait a minute before trying again.</p>
        </Panel>
        <ButtonLink href="/login" variant="outline" size="lg" className="w-full mt-6">Go to sign in</ButtonLink>
      </AuthShell>
    )
  }

  // Steps 3 and 4 for officials: phone and identity, after the group exists
  if (postStep) {
    const finish = () => { setPostStep(null); setSuccess(true) }
    return (
      <AuthShell
        aside="none"
        wide
        title={postStep === 'phone' ? 'Verify your phone number' : 'Verify your identity'}
        subtitle={postStep === 'phone'
          ? "We'll text you a code. Your number is used for M-Pesa prompts, SMS sign-in and USSD."
          : 'Your ID number, a photo of your national ID or passport, and a live selfie. Withdrawals and investments open once you are verified.'}
      >
        <StepDots step={postStep === 'phone' ? 3 : 4} total={4} note={`${groupName} is created`} />
        {postStep === 'phone' ? (
          <Panel>
            <PhoneVerification
              currentPhone={verifiedPhone || null}
              onVerified={(p) => { setVerifiedPhone(p); setPostStep('identity') }}
              label="M-Pesa phone number"
            />
          </Panel>
        ) : kycMessage ? (
          <Panel className="space-y-4">
            <p className="text-[15px]">{kycMessage}</p>
            <Button onClick={finish} size="lg" className="w-full">Continue</Button>
          </Panel>
        ) : (
          <KycVerification onDone={(o) => { if (o.status === 'rejected') return; setKycMessage(o.message) }} />
        )}
        <button
          type="button"
          onClick={() => (postStep === 'phone' ? setPostStep('identity') : finish())}
          className="block mx-auto mt-5 text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink"
        >
          {postStep === 'phone' ? 'Skip for now' : 'Do this later'}
        </button>
      </AuthShell>
    )
  }

  // Group created: show the code members use to join
  if (success && createdGroupCode) {
    return (
      <AuthShell
        aside="none"
        title={`${groupName} is ready`}
        subtitle="Share this code with your members. They type it when they sign up, and you approve each person."
      >
        <div className="rounded-[28px] bg-forest text-[#EEF4EF] p-8 text-center">
          <p className="text-[14px] text-[#8FAA9B]">Group code</p>
          <p className="font-mono text-[44px] sm:text-[52px] tracking-[0.14em] mt-2 text-mint">{createdGroupCode}</p>
          <p className="text-[14px] text-[#C9DACF] mt-3">It doesn&apos;t expire. You can also send invite links from Group settings.</p>
          <Button
            variant="mint"
            className="mt-6"
            onClick={async () => {
              try { await navigator.clipboard.writeText(createdGroupCode); setCopied(true) } catch {}
            }}
          >
            {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy the code</>}
          </Button>
        </div>

        {kycMessage ? (
          <Button size="lg" className="w-full mt-6" onClick={() => router.push('/admin/dashboard')}>Open your group</Button>
        ) : (
          <>
            <Button size="lg" className="w-full mt-6" onClick={() => router.push('/verify-identity?next=/admin/dashboard')}>Verify your identity</Button>
            <p className="mt-3 text-[14px] text-ink-3 text-center">Needed before withdrawals or investments.</p>
            <button onClick={() => router.push('/admin/dashboard')} className="block mx-auto mt-4 text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink">
              Open the group first
            </button>
          </>
        )}
      </AuthShell>
    )
  }

  const switcher = (
    <div role="tablist" aria-label="What do you want to do?" className="grid grid-cols-2 p-1 rounded-full bg-surface-2 border border-line mb-8">
      {[
        { href: '/signup?role=member', label: 'Join a group', on: !isAdminSignup },
        { href: '/signup?role=admin', label: 'Start a group', on: isAdminSignup },
      ].map((t) => (
        <Link
          key={t.href}
          href={t.href}
          role="tab"
          aria-selected={t.on}
          className={cn(
            'h-11 rounded-full flex items-center justify-center text-[15px] font-semibold transition-colors',
            t.on ? 'bg-primary text-on-primary' : 'text-ink-2 hover:text-ink',
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )

  const signInFooter = (
    <>
      Already have an account?{' '}
      <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">Sign in</Link>
    </>
  )

  if (!isAdminSignup) {
    return (
      <AuthShell
        title="Join your group"
        subtitle="Sign up with your phone number. You need the group code your chair or treasurer shared."
        footer={signInFooter}
      >
        {switcher}
        <MemberPhoneSignup initialCode={groupCode} onDone={handleMemberDone} />
        <div className="mt-5">
          <SocialSignIn next={groupCode ? `/onboarding?code=${encodeURIComponent(groupCode)}` : '/onboarding'} />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      aside="officials"
      title={step === 1 ? 'Start a group' : 'Set up your group'}
      subtitle={step === 1
        ? 'You will be the first official. You can hand roles to others later.'
        : 'Members join with the code you get at the end. You can change these rules later.'}
      footer={signInFooter}
    >
      {switcher}
      <StepDots step={step} total={4} />

      {error && <Notice tone="danger" className="mb-5">{error}</Notice>}
      {existingAccount && (
        <Notice tone="info" className="mb-5" title="You already have an Akibora account">
          <p>{email.trim()} is already signed up. One account works for every group you are in, so sign in and {groupName.trim() ? <>we&apos;ll set up <b>{groupName.trim()}</b> from there.</> : 'carry on from there.'}</p>
          <Link href={`/login?redirect=${encodeURIComponent(groupName.trim() ? '/onboarding?intent=create' : '/dashboard')}`} className="inline-flex mt-3 h-10 px-4 items-center rounded-full bg-primary text-on-primary text-[14px] font-semibold">Sign in to continue</Link>
        </Notice>
      )}

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); handleStep1() }} className="space-y-5">
          <Field label="Your full name">
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Grace Wanjiku" autoComplete="name" className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputClass} />
          </Field>
          <div className="flex flex-col gap-2">
            <label htmlFor="new-password" className="text-[14px] font-medium">Password</label>
            <PasswordInput id="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
            {password && (
              <div className="flex items-center gap-3" aria-live="polite">
                <div className="flex gap-1 flex-1" aria-hidden="true">
                  {[1, 2, 3].map(i => (
                    <span
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-[2px]',
                        strength >= i ? (strength === 1 ? 'bg-danger' : strength === 2 ? 'bg-amber' : 'bg-mint') : 'bg-raised',
                      )}
                    />
                  ))}
                </div>
                <span className="text-[13px] text-ink-2 w-[70px] text-right">{password.length < 8 ? 'Too short' : strengthLabels[strength]}</span>
              </div>
            )}
          </div>
          <Field label="Type it again" error={confirmPassword && confirmPassword !== password ? "The passwords don't match yet." : undefined}>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
          </Field>
          <Button type="submit" size="lg" className="w-full">Continue</Button>
          <SocialSignIn next="/onboarding" disabled={loading} />
        </form>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field label="Group name">
            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Tujenge Women Group" autoFocus className={inputClass} />
          </Field>
          <Field label="Each member contributes" hint="The amount for one contribution date.">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-3">KSh</span>
              <input type="number" inputMode="numeric" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="5,000" min="1" className={cn(inputClass, 'pl-14')} />
            </div>
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-medium">When people contribute</span>
            <ContributionSchedulePicker value={schedule} onChange={setSchedule} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>Back</Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAdminSignup}
              disabled={loading || !groupName.trim() || !contributionAmount || !scheduleComplete(schedule)}
            >
              {loading ? 'Creating the group…' : 'Create the group'}
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}

function StepDots({ step, total, note }: { step: number; total: number; note?: string }) {
  const names = ['Account', 'Group', 'Phone', 'Identity']
  return (
    <div className="mb-7">
      <ol className="flex gap-1.5" aria-label={`Step ${step} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className="flex-1">
            <span className={cn('block h-1.5 rounded-[2px]', i < step ? 'bg-brand' : 'bg-raised')} />
            <span className={cn('block text-[12px] mt-2', i + 1 === step ? 'text-ink font-medium' : 'text-ink-3')}>{names[i]}</span>
          </li>
        ))}
      </ol>
      {note && <p className="text-[14px] text-ink-2 mt-3">{note}</p>}
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-page" />}>
      <SignupForm />
    </Suspense>
  )
}
