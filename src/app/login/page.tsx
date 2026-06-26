'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    })

    if (authError) {
      if (authError.message.includes('Invalid')) {
        setError('Incorrect email or password.')
      } else if (authError.message.includes('confirmed')) {
        setError('Please check your email and confirm your account first.')
      } else {
        setError('Could not sign in. Please try again.')
      }
      setLoading(false)
      return
    }

    // Get memberships to route correctly
    const { data: memberships } = await supabase
      .from('chama_memberships')
      .select(`
        role, status,
        chamas_v2 ( id, name )
      `)
      .eq('profile_id', data.user.id)
      .eq('status', 'active')

    if (!memberships || memberships.length === 0) {
      router.push('/onboarding')
      return
    }

    if (memberships.length > 1) {
      router.push('/select-group')
      return
    }

    const m = memberships[0]
    sessionStorage.setItem('active_chama_id', (m.chamas_v2 as any).id)

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
      { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password` }
    )
    if (!resetError) {
      setError('')
      alert('Password reset email sent to ' + email + '. Check your inbox.')
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* Left dark panel — desktop only */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ backgroundColor: '#000000' }}>
        <div className="flex items-center gap-3">
          <Image
            src="/favicon.svg"
            alt="SmartChama"
            width={40} height={40}
            className="h-10 w-10 object-contain brightness-0 invert"
          />
          <span className="text-white text-[22px] font-bold">
            SmartChama
          </span>
        </div>

        <div>
          <p className="text-white text-[38px] font-bold leading-[1.1] max-w-sm mb-10">
            Your Chama,<br />your financial<br />identity.
          </p>
          <div className="space-y-4">
            {[
              ['shield', 'Tamper-proof records'],
              ['payments', 'M-Pesa connected'],
              ['verified_user', '256-bit encryption'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-[#22C55E]">
                  {icon}
                </span>
                <span className="text-gray-400 text-[14px]">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-[13px]">
          SmartChama Technologies Ltd. Nairobi, Kenya.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-10">
            <Image
              src="/favicon.svg"
              alt="SmartChama"
              width={36} height={36}
              className="h-9 w-9 object-contain"
            />
            <span
              className="text-[20px] font-bold"
              style={{ color: 'var(--text-primary)' }}>
              SmartChama
            </span>
          </div>

          <h1
            className="text-[30px] font-bold text-center mb-2"
            style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p
            className="text-[15px] text-center mb-8"
            style={{ color: 'var(--text-secondary)' }}>
            Sign in to your account
          </p>

          {error && (
            <div className="rounded-xl p-4 mb-5 bg-red-50 border border-red-200 text-[14px] text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
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
                className="w-full px-4 py-3.5 rounded-xl border text-[15px] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Password */}
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
                  placeholder="Your password"
                  required
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border text-[15px] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
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
              className="w-full bg-[#22C55E] text-white py-4 rounded-xl mt-2 text-[16px] font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>

          <p
            className="text-center text-[14px] mt-6"
            style={{ color: 'var(--text-secondary)' }}>
            Do not have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold hover:underline"
              style={{ color: '#22C55E' }}>
              Create account
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}