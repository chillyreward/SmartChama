'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    })

    if (authError) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 60000)
        setAttempts(0)
        setError('Too many failed login attempts. Account locked for 60 seconds.')
      } else {
        setError(
          authError.message.includes('Invalid')
            ? `Incorrect email or password (${5 - newAttempts} attempts remaining).`
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
      .eq('profile_id', authData.user.id)
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

    router.push(isAdmin ? '/admin/dashboard' : '/dashboard')
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address above first.')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    )
    if (!resetError) {
      setError('')
      alert('Password reset email sent to ' + email + '. Check your inbox.')
    }
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
            Welcome back
          </h1>
          <p
            className="text-[14px] text-center mb-8"
            style={{ color: 'var(--text-secondary)' }}>
            Sign in to your account
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

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="you@example.com"
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
              <div className="flex justify-between items-center mb-1.5">
                <label
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[13px] font-medium hover:underline"
                  style={{ color: '#22C55E' }}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22C55E] text-white py-4 rounded-xl mt-4 text-[16px] font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts section */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="flex-1 h-px"
                style={{ backgroundColor: 'var(--border)' }} 
              />
              <span 
                className="text-[12px] font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>
                Try a demo account
              </span>
              <div 
                className="flex-1 h-px"
                style={{ backgroundColor: 'var(--border)' }} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Admin demo button */}
              <button
                type="button"
                onClick={() => {
                  setEmail('demo.admin@smartchama.co.ke')
                  setPassword('DemoAdmin2024!')
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:border-[#22C55E]"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg-card)'
                }}>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <span className="material-symbols-outlined text-[16px] text-[#22C55E]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    admin_panel_settings
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Admin Demo
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Grace Wanjiku
                  </p>
                </div>
              </button>

              {/* Member demo button */}
              <button
                type="button"
                onClick={() => {
                  setEmail('demo.member@smartchama.co.ke')
                  setPassword('DemoMember2024!')
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:border-[#22C55E]"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg-card)'
                }}>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <span className="material-symbols-outlined text-[16px] text-[#22C55E]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    person
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Member Demo
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    David Omondi
                  </p>
                </div>
              </button>
            </div>
            
            <p className="text-[11px] text-center mt-3" style={{ color: 'var(--text-muted)' }}>
              Click a button above to auto-fill the credentials, then click Sign In
            </p>
          </div>

          <p
            className="text-center text-[14px] mt-6"
            style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold hover:underline"
              style={{ color: '#22C55E' }}>
              Create account
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