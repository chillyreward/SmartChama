'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import PhoneVerification from '@/components/PhoneVerification'
import KycVerification from '@/components/KycVerification'
import MemberPhoneSignup, { MemberSignupResult } from '@/components/MemberPhoneSignup'
import SocialSignIn from '@/components/SocialSignIn'
import ContributionSchedulePicker, { ContributionSchedule, scheduleComplete, scheduleDates } from '@/components/ContributionSchedulePicker'


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

  // Step 1 fields (both paths)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
  const strengthColors = ['', '#EF4444', '#F59E0B', '#22C55E']
  const strengthLabels = ['', 'Weak', 'Good', 'Strong']

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
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(authError?.message || 'Could not create account.')
      }
      return null
    }

    // With confirmation on, Supabase hides "email taken" by returning a user with no identities
    if (authData.user.identities && authData.user.identities.length === 0) {
      setError('An account with this email already exists. Please sign in instead.')
      return null
    }

    return { hasSession: !!authData.session }
  }

  function pendingGroup() {
    return { name: groupName.trim(), amount: contributionAmount, frequency: schedule.mode, dates: scheduleDates(schedule) }
  }

  function rememberActiveChama(chamaId: string) {
    try {
      document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
      sessionStorage.setItem('active_chama_id', chamaId)
      localStorage.setItem('sc_last_chama_id', chamaId)
    } catch (e) {}
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
        } catch (e) {}
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
      <div 
        className="min-h-screen flex flex-col justify-center items-center p-6"
        style={{ backgroundColor: 'var(--bg-page)' }}
      >
        <div 
          className="w-full max-w-md rounded-2xl p-8 text-center transition-colors duration-300 shadow-xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[36px]">hourglass_top</span>
          </div>

          <h1 className="text-2xl font-bold mb-2 font-geist" style={{ color: 'var(--text-primary)' }}>
            Request Pending Approval
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your request to join <span className="font-semibold text-[#22C55E]">{targetChamaName}</span> has been sent to the group admin. You will be able to access the dashboard once approved.
          </p>

          <Link
            href="/login"
            className="w-full inline-block py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] transition-colors border-0 text-center"
          >
            Return to Login
          </Link>
        </div>
      </div>
    )
  }

  // CONFIRM-EMAIL SCREEN — shown when Supabase requires email confirmation
  if (pendingConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#0B0F0C] text-[#161d16] dark:text-[#E8F0E4]">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-[#F0FDF4] dark:bg-[#0E2E1B] flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[40px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>
              mark_email_unread
            </span>
          </div>
          <h1 className="text-[28px] font-bold mb-2">Confirm your email</h1>
          <p className="text-[15px] mb-8 text-[#4F5A53] dark:text-[#8FA196]">
            We sent a link to <strong className="text-[#161d16] dark:text-white">{email.trim()}</strong>.
            Open it to activate your account and we&apos;ll finish {isAdminSignup ? 'creating your group' : 'adding you to your group'}.
          </p>
          <Link href="/login" className="inline-block w-full py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] transition-colors">
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  // STEPS 3–4 FOR ADMIN — phone and identity checks after the group exists
  // (both need the new account to be signed in, so they come after creation)
  if (postStep) {
    const finish = () => { setPostStep(null); setSuccess(true) }
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#0B0F0C] text-[#161d16] dark:text-[#E8F0E4]">
        <div className="w-full max-w-xl space-y-6 py-10">
          <div className="space-y-1">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#22C55E]">
              Step {postStep === 'phone' ? 3 : 4} of 4 · {groupName} is created
            </p>
            <h1 className="text-[28px] font-bold">
              {postStep === 'phone' ? 'Verify your phone number' : 'Verify your identity'}
            </h1>
            <p className="text-[15px] text-[#4F5A53] dark:text-[#8FA196]">
              {postStep === 'phone'
                ? "We'll text you a code. Your number is used for M-Pesa prompts, SMS sign-in and USSD."
                : 'Add your ID number, a photo of your national ID or passport, and a live selfie. Withdrawals and investments unlock once you are verified.'}
            </p>
          </div>

          {postStep === 'phone' ? (
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1B2520] bg-white dark:bg-[#0E1410] p-5 space-y-4">
              <PhoneVerification
                currentPhone={verifiedPhone || null}
                onVerified={(p) => { setVerifiedPhone(p); setPostStep('identity') }}
                label="M-Pesa phone number"
              />
            </div>
          ) : kycMessage ? (
            <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#1B2520] bg-white dark:bg-[#0E1410] p-6 space-y-4 text-center">
              <p className="text-[15px]">{kycMessage}</p>
              <button onClick={finish} className="w-full py-3.5 rounded-xl bg-[#22C55E] text-white font-semibold">Continue</button>
            </div>
          ) : (
            <KycVerification onDone={(o) => { if (o.status === 'rejected') return; setKycMessage(o.message) }} />
          )}

          <button
            type="button"
            onClick={() => (postStep === 'phone' ? setPostStep('identity') : finish())}
            className="block mx-auto text-[14px] text-[#4F5A53] dark:text-[#8FA196] hover:underline"
          >
            {postStep === 'phone' ? 'Skip for now' : 'Do this later'}
          </button>
        </div>
      </div>
    )
  }

  // SUCCESS SCREEN FOR ADMIN — shows the group code prominently
  if (success && createdGroupCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] dark:bg-[#0B0F0C] text-[#161d16] dark:text-[#E8F0E4]">
        <div className="w-full max-w-md text-center">
          
          <div className="w-20 h-20 rounded-full bg-[#F0FDF4] dark:bg-[#0E2E1B] flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[40px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>

          <h1 className="text-[28px] font-bold mb-2">
            Group Created!
          </h1>
          <p className="text-[15px] mb-8 text-[#4F5A53] dark:text-[#8FA196]">
            Share this code with your members so they can join <strong className="text-[#161d16] dark:text-white">{groupName}</strong>
          </p>

          {/* GROUP CODE DISPLAY */}
          <div className="rounded-2xl p-8 mb-6 bg-white dark:bg-[#0E1410] border-2 border-[#22C55E]">
            <p className="text-[12px] font-semibold uppercase tracking-widest mb-3 text-[#4F5A53] dark:text-[#8FA196]">
              Your Group Code
            </p>
            <p className="text-[52px] font-bold tracking-[0.2em] text-[#22C55E] font-mono mb-3">
              {createdGroupCode}
            </p>
            <p className="text-[13px] text-[#4F5A53] dark:text-[#8FA196]">
              This code never expires. Save it and share it with your members.
            </p>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(createdGroupCode)
              alert('Group code copied to clipboard!')
            }}
            className="w-full py-3 rounded-xl border-2 border-[#22C55E] text-[#22C55E] font-semibold mb-3 hover:bg-[#22C55E] hover:text-white transition-all bg-transparent">
            Copy Group Code
          </button>

          {kycMessage ? (
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="w-full py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] transition-colors border-0">
              Go to Admin Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/verify-identity?next=/admin/dashboard')}
                className="w-full py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] transition-colors border-0">
                Verify your identity
              </button>
              <p className="mt-3 text-[13px] text-[#4F5A53] dark:text-[#8FA196]">
                Needed before withdrawals or investments: your ID or passport and a selfie.
              </p>
            </>
          )}

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F0C] text-[#161d16] dark:text-[#E8F0E4]">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-[#E5E7EB] dark:border-[#1B2520]">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/favicon.svg"
            alt="Akibora"
            width={28} height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="font-bold text-[17px]">
            Akibora
          </span>
        </Link>
        <Link href="/login" className="text-[14px] font-medium text-[#22C55E]">
          Sign In
        </Link>
      </div>

      {/* Role selector tabs */}
      <div className="flex border-b border-[#E5E7EB] dark:border-[#1B2520]">
        <Link
          href="/signup?role=admin"
          className="flex-1 py-3 text-center text-[14px] font-semibold transition-all"
          style={{
            backgroundColor: isAdminSignup ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
            color: isAdminSignup ? '#22C55E' : '#8FA196',
            borderBottom: isAdminSignup ? '2px solid #22C55E' : '2px solid transparent'
          }}>
          Create a Group (Admin)
        </Link>
        <Link
          href="/signup?role=member"
          className="flex-1 py-3 text-center text-[14px] font-semibold transition-all"
          style={{
            backgroundColor: !isAdminSignup ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
            color: !isAdminSignup ? '#22C55E' : '#8FA196',
            borderBottom: !isAdminSignup ? '2px solid #22C55E' : '2px solid transparent'
          }}>
          Join a Group (Member)
        </Link>
      </div>

      <div className="flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-md">

          {!isAdminSignup && (
            <>
              <h1 className="text-[26px] font-bold mb-1">Join your chama</h1>
              <p className="text-[14px] mb-6 text-[#4F5A53] dark:text-[#8FA196]">
                Sign up with your phone number. You&apos;ll need the code from your group admin.
              </p>
              <MemberPhoneSignup initialCode={groupCode} onDone={handleMemberDone} />
              {/* Social sign-up continues in onboarding (phone code, ID, group code) */}
              <div className="mt-5">
                <SocialSignIn next={groupCode ? `/onboarding?code=${encodeURIComponent(groupCode)}` : '/onboarding'} />
              </div>
            </>
          )}

          {isAdminSignup && (<>
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold bg-[#22C55E] text-white">
              {step === 1 ? '1' : '✓'}
            </div>
            <div className="flex-1 h-0.5 bg-[#E5E7EB] dark:bg-[#1B2520]" style={{ backgroundColor: step === 2 ? '#22C55E' : undefined }} />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
              style={{
                backgroundColor: step === 2 ? '#22C55E' : 'var(--border)',
                color: step === 2 ? 'white' : '#8FA196'
              }}>
              2
            </div>
          </div>

          <h1 className="text-[26px] font-bold mb-1">
            {step === 1 
              ? 'Create your account'
              : isAdminSignup 
                ? 'Set up your group'
                : 'Enter your group code'}
          </h1>
          <p className="text-[14px] mb-6 text-[#4F5A53] dark:text-[#8FA196]">
            {step === 1 
              ? isAdminSignup 
                ? 'You will be creating a new chama as the admin.'
                : 'You will be joining a group with your admin\'s code.'
              : isAdminSignup
                ? 'Members will use your group code to join.'
                : 'Get the code from your group admin.'}
          </p>

          {error && (
            <div className="rounded-xl p-4 mb-5 text-[14px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
              {error}
            </div>
          )}

          {/* ═══ STEP 1 — Account Info ═══ */}
          {step === 1 && (
            <div className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Grace Wanjiku"
                  className="w-full px-4 py-3 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-[#8FA196] cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3].map(i => (
                        <div 
                          key={i}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: strength >= i ? strengthColors[strength] : '#E5E7EB'
                          }} 
                        />
                      ))}
                    </div>
                    <span className="text-[12px] font-medium" style={{ color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Type the password again"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]"
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1.5 text-[12px] text-red-500">Passwords don&apos;t match yet.</p>
                )}
              </div>

              <button
                onClick={handleStep1}
                className="w-full py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold mt-2 hover:bg-[#16A34A] transition-colors border-0">
                Continue
              </button>

              {/* Google / Apple: only providers switched on in Supabase are shown */}
              <SocialSignIn next="/onboarding" disabled={loading} />

            </div>
          )}

          {/* ═══ STEP 2 ADMIN ═══ */}
          {step === 2 && isAdminSignup && (
            <div className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Nairobi Women Investment Group"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]">
                  Contribution amount (KSh)
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 rounded-l-xl border border-r-0 text-[14px] bg-[#FAFAFA] dark:bg-[#0B0F0C] border-[#E5E7EB] dark:border-[#1B2520] text-[#4F5A53] dark:text-[#8FA196]">
                    KSh
                  </div>
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={e => setContributionAmount(e.target.value)}
                    placeholder="5000"
                    min="1"
                    className="flex-1 px-4 py-3 rounded-r-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]">
                  Contribution schedule
                </span>
                <ContributionSchedulePicker value={schedule} onChange={setSchedule} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border text-[15px] font-medium bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white">
                  Back
                </button>
                <button
                  onClick={handleAdminSignup}
                  disabled={loading || !groupName.trim() || !contributionAmount || !scheduleComplete(schedule)}
                  className="flex-1 py-3 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] disabled:opacity-50 transition-colors border-0">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Creating...
                    </span>
                  ) : 'Create Group'}
                </button>
              </div>

            </div>
          )}

          </>)}

          <p className="text-center text-[13px] mt-6 text-[#4F5A53] dark:text-[#8FA196]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#22C55E] hover:underline">
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0B0F0C]">
        <div className="w-10 h-10 rounded-full border-4 border-[#22C55E]/20 border-t-[#22C55E] animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
