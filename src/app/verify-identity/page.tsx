'use client'
import { MIcon } from '@/components/ui/MIcon';
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import KycVerification, { KycOutcome } from '@/components/KycVerification'

// Identity verification for group creators. Reached right after creating a
// group, and from the banner on the admin dashboard until verified.

function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin/dashboard'
}

function VerifyIdentity() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const next = safeNext(useSearchParams().get('next'))
  const [status, setStatus] = useState<string | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<KycOutcome | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login?redirect=/verify-identity'); return }
      const { data: profile } = await supabase.from('profiles').select('kyc_status').eq('id', user.id).maybeSingle()
      setStatus(profile?.kyc_status ?? 'none')
      if (profile?.kyc_status === 'rejected') {
        const { data: last } = await supabase
          .from('kyc_verifications').select('rejection_reason')
          .eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        setReason(last?.rejection_reason ?? null)
      }
    })()
  }, [supabase, router])

  const shown = outcome?.status ?? status

  return (
    <main className="min-h-screen px-4 py-10 bg-[var(--ak-surface-2)] dark:bg-[var(--ak-page)] text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">
      <div className="max-w-xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-[28px] font-bold">Verify your identity</h1>
          <p className="text-[15px] text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)]">
            Your group is ready to use. Before money can leave it (withdrawals and investments), we need
            to confirm who you are. It takes about two minutes.
          </p>
        </header>

        {status === null ? (
          <p className="text-[14px] text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)]">Loading…</p>
        ) : shown === 'verified' ? (
          <Result tone="good" title="You're verified" body={outcome?.message ?? 'Withdrawals and investments are unlocked for your group.'} next={next} />
        ) : shown === 'review' && !outcome ? (
          <Result tone="wait" title="We're checking your documents" body="An Akibora team member is reviewing your submission, usually within one working day. You can keep using your group meanwhile." next={next} />
        ) : outcome?.status === 'review' ? (
          <Result tone="wait" title="Submitted" body={outcome.message} next={next} />
        ) : (
          <>
            {(outcome?.status === 'rejected' || status === 'rejected') && (
              <p className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-[14px] text-red-700 dark:text-red-300">
                {outcome?.message ?? reason ?? "We couldn't verify your last submission."} Please try again.
              </p>
            )}
            <KycVerification onDone={(o) => { setOutcome(o); if (o.status !== 'rejected') setStatus(o.status) }} />
            <Link href={next} className="block text-center text-[14px] text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] hover:underline">
              Do this later
            </Link>
          </>
        )}
      </div>
    </main>
  )
}

function Result({ tone, title, body, next }: { tone: 'good' | 'wait'; title: string; body: string; next: string }) {
  return (
    <div className="rounded-2xl border border-[var(--ak-line)] dark:border-[var(--ak-line)] bg-white dark:bg-[var(--ak-page)] p-6 space-y-3 text-center">
      <MIcon name={tone === 'good' ? 'verified_user' : 'hourglass_top'}  className="text-[44px]" />
      <h2 className="text-[20px] font-bold">{title}</h2>
      <p className="text-[15px] text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)]">{body}</p>
      <Link href={next} className="inline-block w-full py-3.5 rounded-xl bg-primary text-on-primary font-semibold">Continue</Link>
    </div>
  )
}

export default function VerifyIdentityPage() {
  return (
    <Suspense fallback={null}>
      <VerifyIdentity />
    </Suspense>
  )
}
