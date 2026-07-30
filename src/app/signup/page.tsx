'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

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
  const [groupCode, setGroupCode] = useState(searchParams.get('code') || '')
  
  // Success state — shows group code for admin after creation
  const [createdGroupCode, setCreatedGroupCode] = useState('')
  const [success, setSuccess] = useState(false)
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
    setStep(2)
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
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { 
            full_name: fullName.trim()
          },
          emailRedirectTo: undefined
        }
      })

      if (authError || !authData.user) {
        if (authError?.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(authError?.message || 'Could not create account.')
        }
        setLoading(false)
        return
      }

      const userId = authData.user.id

      // Format phone
      let formattedPhone = phone.replace(/\s/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.slice(1)
      }
      if (!formattedPhone.startsWith('+254') && phone.trim()) {
        formattedPhone = '+254' + formattedPhone
      }

      // 2. Create profile
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: formattedPhone || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      // 3. Create chama (trigger auto-generates code)
      const { data: newChama, error: chamaError } = await supabase
        .from('chamas_v2')
        .insert({
          name: groupName.trim(),
          contribution_amount: Number(contributionAmount),
          contribution_frequency: frequency,
          status: 'active',
          created_by: userId
        })
        .select('id, name, group_code')
        .single()

      if (chamaError || !newChama) {
        console.error(chamaError)
        setError('Could not create group. Please try again.')
        setLoading(false)
        return
      }

      // 4. Create membership
      const { error: membershipError } = await supabase
        .from('chama_memberships')
        .insert({
          profile_id: userId,
          chama_id: newChama.id,
          role: 'chairlady',
          trust_score: 100,
          status: 'active',
          joined_at: new Date().toISOString()
        })

      if (membershipError) {
        console.error(membershipError)
        setError('Account created but group setup failed. Please contact support.')
        setLoading(false)
        return
      }

      // 5. Create wallet
      await supabase
        .from('wallets')
        .insert({
          chama_id: newChama.id,
          balance: 0,
          savings_pool: 0,
          loans_disbursed: 0
        })

      // 6. Sign in immediately
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      // Save to storage
      try {
        sessionStorage.setItem('active_chama_id', newChama.id)
        localStorage.setItem('sc_last_chama_id', newChama.id)
      } catch(e) {}

      // Show success with the group code
      setCreatedGroupCode(newChama.group_code)
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
      // 1. Verify group code exists
      const { data: chama, error: chamaError } = await supabase
        .from('chamas_v2')
        .select('id, name, group_code, status')
        .eq('group_code', code)
        .eq('status', 'active')
        .single()

      if (chamaError || !chama) {
        setError('Group code not found. Check with your admin and try again.')
        setLoading(false)
        return
      }

      // 2. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { 
            full_name: fullName.trim() 
          },
          emailRedirectTo: undefined
        }
      })

      if (authError || !authData.user) {
        if (authError?.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(authError?.message || 'Could not create account.')
        }
        setLoading(false)
        return
      }

      const userId = authData.user.id

      // Format phone
      let formattedPhone = phone.replace(/\s/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.slice(1)
      }
      if (!formattedPhone.startsWith('+254') && phone.trim()) {
        formattedPhone = '+254' + formattedPhone
      }

      // 3. Create profile
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: formattedPhone || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      // 4. Create pending membership
      const { error: membershipError } = await supabase
        .from('chama_memberships')
        .insert({
          profile_id: userId,
          chama_id: chama.id,
          role: 'member',
          trust_score: 0,
          status: 'pending',
          joined_at: new Date().toISOString()
        })

      if (membershipError) {
        console.error(membershipError)
        setError('Could not join group. Please try again.')
        setLoading(false)
        return
      }

      // Send notification to admin(s)
      const { data: admins } = await supabase
        .from('chama_memberships')
        .select('profile_id')
        .eq('chama_id', chama.id)
        .in('role', ['admin', 'chairlady'])
        .eq('status', 'active');

      if (admins && admins.length > 0) {
        const notificationRows = admins.map(admin => ({
          chama_id: chama.id,
          profile_id: admin.profile_id,
          type: 'member_request',
          title: 'New Member Request',
          message: `${fullName.trim()} requested to join your chama group.`
        }));
        await supabase.from('notifications').insert(notificationRows);
      }

      setTargetChamaName(chama.name);
      setPendingApproval(true);
      setLoading(false);
      return;

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
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
