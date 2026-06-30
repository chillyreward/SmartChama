'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function AdminSignupPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Step 1 — account details
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2 — chama details
  const [chamaName, setChamaName] = useState('')
  const [county, setCounty] = useState('')
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionFrequency, setContributionFrequency] = useState('monthly')
  const [chamaRules, setChamaRules] = useState('')

  // Password strength
  function getStrength(p: string) {
    if (p.length === 0) return 0
    if (p.length < 6) return 1
    if (p.length < 10) return 2
    return 3
  }
  const strength = getStrength(password)
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#EF4444', '#F59E0B', '#22C55E'][strength]

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setStep(2)
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } }
      })

      if (authError) {
        setError(
          authError.message.includes('already registered')
            ? 'An account with this email already exists. Try signing in.'
            : authError.message
        )
        setLoading(false)
        return
      }

      const userId = authData.user!.id

      // 2. Create profile
      await supabase.from('profiles').insert({
        id: userId,
        full_name: fullName.trim(),
        email: email.trim()
      })

      // 3. Create the chama
      const { data: chamaData, error: chamaError } = await supabase
        .from('chamas_v2')
        .insert({
          name: chamaName.trim(),
          county: county.trim(),
          contribution_amount: parseFloat(contributionAmount),
          contribution_frequency: contributionFrequency,
          rules: chamaRules.trim() || null,
          created_by: userId
        })
        .select('id')
        .single()

      if (chamaError || !chamaData) {
        setError('Failed to create chama. Please try again.')
        setLoading(false)
        return
      }

      // 4. Add creator as admin in chama_admins
      await supabase.from('chama_admins').insert({
        chama_id: chamaData.id,
        admin_user_id: userId,
        full_name: fullName.trim(),
        email: email.trim(),
        role: 'admin'
      })

      // 5. Also add as member with admin role
      await supabase.from('chama_memberships').insert({
        profile_id: userId,
        chama_id: chamaData.id,
        role: 'admin',
        trust_score: 100,
        status: 'active'
      })

      // 6. Set active chama cookie
      document.cookie = `active_chama_id=${chamaData.id}; path=/; max-age=${60 * 60 * 24 * 30}`
      sessionStorage.setItem('active_chama_id', chamaData.id)

      setSuccess(`"${chamaName}" created! Redirecting to your dashboard...`)
      setTimeout(() => router.push('/admin/dashboard'), 1500)

    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
    'Kiambu', 'Machakos', 'Meru', 'Nyeri', 'Kisii', 'Kakamega',
    'Kericho', 'Embu', 'Garissa', 'Kilifi', 'Kwale', 'Lamu',
    'Mandera', 'Marsabit', 'Migori', 'Muranga', 'Nandi', 'Narok',
    'Nyamira', 'Nyandarua', 'Samburu', 'Siaya', 'Taita Taveta',
    'Tana River', 'Tharaka Nithi', 'Trans Nzoia', 'Turkana',
    'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot', 'Bungoma',
    'Busia', 'Elgeyo Marakwet', 'Homa Bay', 'Isiolo', 'Kajiado',
    'Kirinyaga', 'Laikipia', 'Makueni', 'Nyandarua', 'Other'
  ].sort()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* Left dark panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ backgroundColor: '#000000' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-black text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              crown
            </span>
          </div>
          <span className="text-white text-[22px] font-bold">SmartChama</span>
        </div>

        <div>
          <p className="text-white text-[38px] font-bold leading-[1.1] max-w-sm mb-10">
            Launch your Chama in under 2 minutes.
          </p>
          <div className="space-y-4">
            {[
              ['groups', 'Invite members with a link or code'],
              ['savings', 'Track every contribution automatically'],
              ['account_balance', 'Manage loans and repayments'],
              ['verified', 'Build your group\'s financial identity'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-amber-400">
                  {icon}
                </span>
                <span className="text-gray-400 text-[14px]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-[13px]">SmartChama Technologies Ltd. Nairobi, Kenya.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-10">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-black text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                crown
              </span>
            </div>
            <span className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>
              SmartChama
            </span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold transition-colors ${step >= 1 ? 'bg-amber-500 text-black' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`flex-1 h-0.5 transition-colors ${step >= 2 ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold transition-colors ${step >= 2 ? 'bg-amber-500 text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>2</div>
          </div>

          {error && (
            <div className="rounded-xl p-4 mb-5 bg-red-50 border border-red-200 text-[14px] text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl p-4 mb-5 border text-[14px]"
              style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
              {success}
            </div>
          )}

          {/* STEP 1 — Account */}
          {step === 1 && (
            <>
              <h1 className="text-[28px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Create admin account
              </h1>
              <p className="text-[14px] mb-7" style={{ color: 'var(--text-secondary)' }}>
                Step 1 of 2 — Your login details
              </p>

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Full Name
                  </label>
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Grace Wanjiku" required
                    className="w-full px-4 py-3.5 rounded-xl border text-[15px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="grace@example.com" required
                    className="w-full px-4 py-3.5 rounded-xl border text-[15px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" required
                      className="w-full px-4 py-3.5 pr-12 rounded-xl border text-[15px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-colors"
                            style={{ backgroundColor: strength >= i ? strengthColor : 'var(--border)' }} />
                        ))}
                      </div>
                      <p className="text-[12px]" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                <button type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl mt-2 text-[16px] font-semibold transition-colors">
                  Continue →
                </button>
              </form>
            </>
          )}

          {/* STEP 2 — Chama details */}
          {step === 2 && (
            <>
              <h1 className="text-[28px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Set up your Chama
              </h1>
              <p className="text-[14px] mb-7" style={{ color: 'var(--text-secondary)' }}>
                Step 2 of 2 — Group details
              </p>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Chama Name
                  </label>
                  <input
                    type="text" value={chamaName} onChange={e => setChamaName(e.target.value)}
                    placeholder="e.g. Umoja Savings Group" required
                    className="w-full px-4 py-3.5 rounded-xl border text-[15px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    County
                  </label>
                  <select value={county} onChange={e => setCounty(e.target.value)} required
                    className="w-full px-4 py-3.5 rounded-xl border text-[15px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: county ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    <option value="" disabled>Select county</option>
                    {counties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Contribution (KSh)
                    </label>
                    <input
                      type="number" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)}
                      placeholder="5000" required min="1"
                      className="w-full px-4 py-3.5 rounded-xl border text-[15px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Frequency
                    </label>
                    <select value={contributionFrequency} onChange={e => setContributionFrequency(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border text-[15px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Group Rules
                    <span className="ml-1 normal-case font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <textarea
                    value={chamaRules} onChange={e => setChamaRules(e.target.value)}
                    placeholder="e.g. Members must contribute by the 5th of each month. Late payments attract a KSh 200 fine..."
                    rows={3}
                    className="w-full px-4 py-3.5 rounded-xl border text-[15px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-4 rounded-xl border text-[16px] font-semibold transition-colors"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
                    ← Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl text-[16px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Creating...' : 'Launch Chama 🚀'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="text-[12px] text-center mt-5" style={{ color: 'var(--text-muted)' }}>
            By continuing you agree to our{' '}
            <Link href="/terms" className="hover:underline" style={{ color: '#F59E0B' }}>Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="hover:underline" style={{ color: '#F59E0B' }}>Privacy Policy</Link>
          </p>

          <p className="text-center text-[14px] mt-4" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/admin/login" className="font-semibold hover:underline" style={{ color: '#F59E0B' }}>
              Admin Sign In
            </Link>
          </p>

          <p className="text-center text-[13px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Joining a group instead?{' '}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: '#22C55E' }}>
              Member Sign Up
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
