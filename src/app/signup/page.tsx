'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

function formatPhone(raw: string): string | null {
  let p = raw.replace(/[\s-]/g, '')
  if (!p) return null
  if (p.startsWith('+')) return p
  if (p.startsWith('254')) return '+' + p
  if (p.startsWith('0')) p = p.slice(1)
  return '+254' + p
}

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
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2 — Admin: group details
  const [groupName, setGroupName] = useState('')
  const [contributionAmount, setContributionAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')

  // Step 2 — Member: group code
  // Invite SMS links use ?token=, older links ?code=
  const [groupCode, setGroupCode] = useState(searchParams.get('code') || searchParams.get('token') || '')
  
  // Success state — shows group code for admin after creation
  const [createdGroupCode, setCreatedGroupCode] = useState('')
  const [success, setSuccess] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)
  // Group-code joins wait for an official to approve the request
  const [pendingApproval, setPendingApproval] = useState(false)
  const [targetChamaName, setTargetChamaName] = useState('')

  // Password strength
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColors = ['', '#EF4444', '#F59E0B', '#22C55E']
  const strengthLabels = ['', 'Weak', 'Good', 'Strong']

  async function handleGoogleSignup() {
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
      }
    })
    if (oauthError) {
      setError('Could not sign up with Google. Please try again.')
    }
    // On success, browser is redirected to Google
  }

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
          phone_number: formatPhone(phone)
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
          localStorage.setItem('sc_pending_group', JSON.stringify({
            name: groupName.trim(), amount: contributionAmount, frequency
          }))
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
          phone,
          chama_name: groupName.trim(),
          contribution_amount: contributionAmount,
          contribution_frequency: frequency
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
      setSuccess(true)
      setLoading(false)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  async function handleMemberSignup() {
    setError('')

    const code = groupCode.trim().toUpperCase()

    if (code.length < 4) {
      setError('Please enter your group code.')
      return
    }

    setLoading(true)

    try {
      // 1. Check the code before creating an account (works signed out)
      const { data: preview, error: previewError } = await supabase.rpc('preview_join_code', { p_code: code })

      if (previewError || !preview?.valid) {
        const messages: Record<string, string> = {
          expired: 'This invite code has expired. Ask your admin for a new one.',
          used_up: 'This invite code has already been used. Ask your admin for a new one.'
        }
        setError(messages[preview?.error] || 'Group code not found. Check with your admin and try again.')
        setLoading(false)
        return
      }

      // 2. Create the auth account (the database trigger creates the profile)
      const account = await createAccount()
      if (!account) { setLoading(false); return }

      if (!account.hasSession) {
        try { localStorage.setItem('sc_pending_join_code', code) } catch (e) {}
        setPendingConfirmation(true)
        setLoading(false)
        return
      }

      // 3. Join as the signed-in user
      const joinRes = await fetch('/api/admin/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const joinData = await joinRes.json()

      if (!joinRes.ok) {
        setError(joinData.error || 'Could not join group. Please try again.')
        setLoading(false)
        return
      }

      if (joinData.pending) {
        setTargetChamaName(joinData.chamaName || preview.chama_name || '')
        setPendingApproval(true)
        setLoading(false)
        return
      }

      rememberActiveChama(joinData.chamaId)
      router.push('/dashboard')

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong.')
      setLoading(false)
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

          <button
            onClick={() => router.push('/admin/dashboard')}
            className="w-full py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] transition-colors border-0">
            Go to Admin Dashboard
          </button>

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
            alt="SmartChama"
            width={28} height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="font-bold text-[17px]">
            SmartChama
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
                  Phone Number <span className="ml-1 normal-case font-normal">(optional)</span>
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 rounded-l-xl border border-r-0 text-[14px] bg-[#FAFAFA] dark:bg-[#0B0F0C] border-[#E5E7EB] dark:border-[#1B2520] text-[#4F5A53] dark:text-[#8FA196]">
                    +254
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="712 345 678"
                    className="flex-1 px-4 py-3 rounded-r-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
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

              <button
                onClick={handleStep1}
                className="w-full py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold mt-2 hover:bg-[#16A34A] transition-colors border-0">
                Continue
              </button>

              {/* OR divider */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1B2520]" />
                <span className="text-[12px] font-medium uppercase tracking-wider text-[#8FA196]">or</span>
                <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1B2520]" />
              </div>

              {/* Google sign-up */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border text-[15px] font-medium transition-all hover:border-[#22C55E] disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white">
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
              </button>

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
                  Monthly Contribution (KSh)
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
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[#4F5A53] dark:text-[#8FA196]">
                  Contribution Frequency
                </label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E] appearance-none">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border text-[15px] font-medium bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white">
                  Back
                </button>
                <button
                  onClick={handleAdminSignup}
                  disabled={loading || !groupName.trim() || !contributionAmount}
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

          {/* ═══ STEP 2 MEMBER ═══ */}
          {step === 2 && !isAdminSignup && (
            <div className="space-y-4">
              
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2 text-[#4F5A53] dark:text-[#8FA196]">
                  Group Code
                </label>
                <input
                  type="text"
                  value={groupCode}
                  onChange={e => setGroupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                  className="w-full px-6 py-5 rounded-xl border text-[36px] font-bold font-mono tracking-[0.4em] text-center uppercase focus:outline-none focus:border-[#22C55E] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#22C55E]"
                />
                <p className="text-[12px] text-center mt-2 text-[#8FA196]">
                  Get this 6-character code from your group admin
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border text-[15px] font-medium bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white">
                  Back
                </button>
                <button
                  onClick={handleMemberSignup}
                  disabled={loading || groupCode.length < 4}
                  className="flex-1 py-3 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] disabled:opacity-50 transition-colors border-0">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Joining...
                    </span>
                  ) : 'Join Group'}
                </button>
              </div>

            </div>
          )}

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
