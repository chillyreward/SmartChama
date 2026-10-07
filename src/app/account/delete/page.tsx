'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

// Public page linked from Google Play's "Delete account URL" field and from
// the app. Explains what is deleted and lets a signed-in user delete.
export default function DeleteAccountPage() {
  const supabase = getSupabaseBrowser()
  const [email, setEmail] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setChecking(false)
    })
  }, [supabase])

  async function handleDelete() {
    setError('')
    setBusy(true)
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: confirmText.trim() })
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error || 'Could not delete your account.')
      return
    }
    await supabase.auth.signOut()
    setDone(true)
  }

  return (
    <main className="min-h-screen px-4 py-12" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Delete your SmartChama account</h1>

        <section className="space-y-3 text-[15px]" style={{ color: 'var(--text-secondary)' }}>
          <p>You can delete your account in the SmartChama Android app (Profile → Delete account) or on this page.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>What we delete:</strong> your name, phone number, email, national ID, county, occupation, photo, notification token, your chat messages and notifications. You will no longer be able to sign in.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>What we keep:</strong> records of contributions, loans, repayments and other group transactions. Your chama needs them for its accounts, and we must keep financial records by law. They stay attached to an anonymous &ldquo;Former member&rdquo;.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Before you can delete:</strong> repay any loan, settle any unpaid penalty, and if you are the only official of a group with other members, hand your role to someone else.</p>
        </section>

        <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          {checking ? (
            <p>Checking your sign-in…</p>
          ) : done ? (
            <p className="font-semibold">Your account has been deleted. You have been signed out.</p>
          ) : !email ? (
            <>
              <p>Sign in first, then come back to this page to delete your account.</p>
              <Link href="/login?redirect=/account/delete" className="inline-block px-5 py-3 rounded-xl bg-[#22C55E] text-white font-semibold">Sign in</Link>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Can&apos;t sign in? Email privacy@smartchama.co.ke from the address on your account and we will delete it within 30 days.</p>
            </>
          ) : (
            <>
              <p>Signed in as <strong>{email}</strong>. Type <strong>DELETE</strong> to confirm.</p>
              <label htmlFor="confirm-delete" className="sr-only">Type DELETE to confirm</label>
              <input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-transparent"
                style={{ borderColor: 'var(--border)' }}
                autoComplete="off"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleDelete}
                disabled={busy || confirmText.trim() !== 'DELETE'}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50"
              >
                {busy ? 'Deleting…' : 'Delete my account'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
