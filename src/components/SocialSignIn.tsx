'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

// "Continue with Google / Apple" buttons. Supabase's public auth settings say
// which providers are switched on, and only those are shown, so people never
// land on Supabase's "provider is not enabled" error page.

type Provider = 'google' | 'apple'

let enabledCache: Promise<Record<string, boolean>> | null = null
function enabledProviders(): Promise<Record<string, boolean>> {
  if (!enabledCache) {
    enabledCache = fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: any) => d?.external ?? {})
      .catch(() => ({}))
  }
  return enabledCache
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="18" height="20" viewBox="0 0 814 1000" aria-hidden="true" fill="currentColor">
    <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-166 41s-106-58-156-128C44 790 0 666 0 548 0 359 123 259 244 259c64 0 118 42 158 42 39 0 99-45 172-45 28 0 128 3 194 85zM552 165c30-36 52-86 52-136 0-7-1-14-2-20-49 2-108 33-143 74-28 32-54 82-54 133 0 8 1 15 2 18 3 1 9 1 14 1 45 0 101-30 131-70z"/>
  </svg>
)

export default function SocialSignIn({ next = '/dashboard', disabled = false }: { next?: string; disabled?: boolean }) {
  const supabase = getSupabaseBrowser()
  const [enabled, setEnabled] = useState<Provider[]>([])
  const [busy, setBusy] = useState<Provider | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    enabledProviders().then((ext) => setEnabled((['google', 'apple'] as Provider[]).filter((p) => ext[p])))
  }, [])

  if (enabled.length === 0) return null

  async function go(provider: Provider) {
    setError('')
    setBusy(provider)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (oauthError) {
      setError(`Could not continue with ${provider === 'google' ? 'Google' : 'Apple'}. Please try again.`)
      setBusy(null)
    }
  }

  const base = 'w-full flex items-center justify-center gap-3 py-3 rounded-xl border text-[15px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1B2520]" />
        <span className="text-[12px] font-medium uppercase tracking-wider text-[#8FA196]">or</span>
        <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1B2520]" />
      </div>
      {enabled.includes('google') && (
        <button type="button" onClick={() => go('google')} disabled={disabled || !!busy}
          className={`${base} hover:border-[#22C55E] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white`}>
          <GoogleIcon />
          {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </button>
      )}
      {enabled.includes('apple') && (
        <button type="button" onClick={() => go('apple')} disabled={disabled || !!busy}
          className={`${base} bg-black text-white border-black dark:bg-white dark:text-black dark:border-white`}>
          <AppleIcon />
          {busy === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
        </button>
      )}
      {error && <p className="text-[13px] text-red-500" role="alert">{error}</p>}
    </div>
  )
}
