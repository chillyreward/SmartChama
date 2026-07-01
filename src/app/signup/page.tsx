'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function SignupPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Pre-fill token from URL if admin sent an invite link
  const tokenFromUrl = searchParams.get('token') || ''
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inviteCode, setInviteCode] = useState(tokenFromUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    // If invite code provided, validate it first before creating account
    let invite: any = null
    if (inviteCode.trim()) {
      const { data: inviteData } = await supabase
        .from('invite_tokens')
        .select('*')
        .eq('token', inviteCode.trim().toUpperCase())
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!inviteData) {
        setError(
          'This invite code is invalid or has expired. Ask your admin to send a new invite.'
        )
        setLoading(false)
        return
      }

      const { data: chamaData } = await supabase
        .from('chamas_v2')
        .select('id, name')
        .eq('id', inviteData.chama_id)
        .single()

      if (!chamaData) {
        setError('Invited chama group not found.')
        setLoading(false)
        return
      }

      invite = { ...inviteData, chama_name: chamaData.name }
    }

    // Create Supabase auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { 
          full_name: fullName.trim() 
        }
      }
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

    // Create profile row
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        full_name: fullName.trim(),
        email: email.trim()
      })

    if (profileError) {
      setError(
        'Account created but setup failed. Please contact support@smartchama.co.ke'
      )
      setLoading(false)
      return
    }

    // If invite code was valid, link them to the chama immediately
    if (invite) {
      await supabase
        .from('chama_memberships')
        .insert({
          profile_id: authData.user!.id,
          chama_id: invite.chama_id,
          role: 'member',
          trust_score: 0,
          status: 'active'
        })

      // Mark invite as used
      await supabase
        .from('invite_tokens')
        .update({
          is_active: false,
          current_uses: (invite.current_uses || 0) + 1
        })
        .eq('token', inviteCode.trim().toUpperCase())

      // Store active chama
      sessionStorage.setItem('active_chama_id', invite.chama_id)
      localStorage.setItem('sc_last_chama_id', invite.chama_id)
      document.cookie = `active_chama_id=${invite.chama_id}; path=/; max-age=${60 * 60 * 24 * 30}`

      setSuccess(`Welcome to ${invite.chama_name}! Redirecting...`)

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } else {
      // No invite code — go to onboarding to create or join a chama
      setSuccess('Account created! Setting up your profile...')
      setTimeout(() => {
        router.push('/onboarding')
      }, 1500)
    }

    setLoading(false)
  }

  return (
    <div 
      className="min-h-screen flex flex-col justify-between"
      style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* Top bar */}
      <div 
        className="flex items-center justify-between px-6 h-14"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/favicon.svg"
            alt="SmartChama"
            width={28} height={28}
            className="h-7 w-7 object-contain"
          />
          <span 
            className="font-bold text-[17px]"
            style={{ color: 'var(--text-primary)' }}>
            SmartChama
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div 
          className="w-full max-w-md rounded-2xl p-8 transition-colors duration-300"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)'
          }}>

          <h1
            className="text-[28px] font-bold text-center mb-2 font-geist"
            style={{ color: 'var(--text-primary)' }}>
            Create account
          </h1>
          <p
            className="text-[14px] text-center mb-8"
            style={{ color: 'var(--text-secondary)' }}>
            Free to start. No bank account required.
          </p>

          {error && (
            <div 
              className="rounded-xl p-4 mb-5 text-[14px]"
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B'
              }}>
              {error}
            </div>
          )}

          {success && (
            <div 
              className="rounded-xl p-4 mb-5 text-[14px]"
              style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#15803D'
              }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Grace Wanjiku"
                required
                className="w-full px-4 py-3 rounded-xl border text-[15px] focus:outline-none focus:border-[#22C55E] transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="grace@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border text-[15px] focus:outline-none focus:border-[#22C55E] transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border text-[15px] focus:outline-none focus:border-[#22C55E] transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-colors"
                        style={{
                          backgroundColor: strength >= i ? strengthColor : 'var(--border)'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[12px]" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Invite Code
                <span className="ml-1 normal-case font-normal animate-pulse" style={{ color: 'var(--text-muted)' }}>
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase().slice(0, 8))}
                placeholder="e.g. SC4829"
                className="w-full px-4 py-3 rounded-xl border text-[16px] font-mono font-bold tracking-widest text-center uppercase focus:outline-none focus:border-[#22C55E]"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: inviteCode ? '#22C55E' : 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
              <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Leave blank if you are creating a new group
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22C55E] text-white py-4 rounded-xl mt-4 text-[16px] font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-[12px] text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" className="hover:underline" style={{ color: '#22C55E' }}>
              Terms
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="hover:underline" style={{ color: '#22C55E' }}>
              Privacy Policy
            </Link>
          </p>

          <p
            className="text-center text-[14px] mt-6"
            style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold hover:underline"
              style={{ color: '#22C55E' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div 
        className="text-center py-6 text-[12px]"
        style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>
        SmartChama Technologies Ltd. Nairobi, Kenya.
      </div>
    </div>
  )
}
