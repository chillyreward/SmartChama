'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { PublicPage } from '@/components/landing/PublicPage'
import { Button, ButtonLink, Field, Notice, Panel, inputClass } from '@/components/ui'
import { SITE } from '@/lib/site'

// Public page linked from Google Play's "Delete account URL" field and from
// the app. Explains what is deleted and lets a signed-in user delete.
export default function DeleteAccountPage() {
  const supabase = getSupabaseBrowser()
  // Phone-only accounts may have no email, so track the sign-in separately
  const [who, setWho] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      setSignedIn(!!u)
      setWho(u?.email || u?.phone || null)
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
    <PublicPage
      cta={false}
      title="Delete your account"
      intro="You can do it in the Akibora app (Profile, then Delete account) or on this page. It can't be undone."
    >
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-24 grid lg:grid-cols-[1fr_440px] gap-10 items-start">
        <div className="grid sm:grid-cols-2 gap-4">
          <Panel>
            <h2 className="font-display text-[24px]">What we delete</h2>
            <p className="text-[16px] text-ink-2 mt-3 leading-relaxed">Your name, phone number, email, ID number, county, photo, notification settings, chat messages and notifications. You won&apos;t be able to sign in again.</p>
          </Panel>
          <Panel>
            <h2 className="font-display text-[24px]">What stays</h2>
            <p className="text-[16px] text-ink-2 mt-3 leading-relaxed">Contributions, penalties and other group records. Your group needs them for its accounts, and financial records must be kept by law. They show as &ldquo;Former member&rdquo;.</p>
          </Panel>
          <Panel tone="sage" className="sm:col-span-2">
            <h2 className="font-display text-[24px]">Before you start</h2>
            <p className="text-[16px] mt-3 leading-relaxed">Pay any unpaid penalty. If you are the only official of a group that has other members, give your role to someone else first.</p>
          </Panel>
        </div>

        <Panel className="space-y-5">
          {checking ? (
            <p className="text-ink-2" aria-busy="true">Checking your sign-in…</p>
          ) : done ? (
            <Notice tone="ok" title="Your account is deleted">You have been signed out.</Notice>
          ) : !signedIn ? (
            <>
              <p className="text-[16px]">Sign in first, then come back here.</p>
              <ButtonLink href="/login?redirect=/account/delete" size="lg" className="w-full">Sign in</ButtonLink>
              <p className="text-[14px] text-ink-3">
                Can&apos;t sign in? Email <a className="underline underline-offset-4" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> from the email or phone number on your account and we&apos;ll handle it.
              </p>
            </>
          ) : (
            <>
              <p className="text-[16px]">Signed in as <strong>{who ?? 'your account'}</strong>.</p>
              <Field label="Type DELETE to confirm" error={error || undefined}>
                <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={inputClass} autoComplete="off" autoCapitalize="characters" />
              </Field>
              <Button variant="danger" size="lg" className="w-full" onClick={handleDelete} disabled={busy || confirmText.trim() !== 'DELETE'}>
                {busy ? 'Deleting…' : 'Delete my account'}
              </Button>
            </>
          )}
        </Panel>
      </section>
    </PublicPage>
  )
}
