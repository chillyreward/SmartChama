'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import KycVerification, { KycOutcome } from '@/components/KycVerification'
import { AuthShell } from '@/components/auth/AuthShell'
import { ButtonLink, Notice, Panel } from '@/components/ui'
import { Hourglass, ShieldCheck } from 'lucide-react'

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
    <AuthShell
      aside="none"
      wide
      title="Verify your identity"
      subtitle="Your group works now. Before money can leave it, through withdrawals or investments, we confirm who you are. It takes about two minutes."
    >
      {status === null ? (
        <p className="text-[15px] text-ink-2" aria-busy="true">Checking your status…</p>
      ) : shown === 'verified' ? (
        <Result tone="good" title="You're verified" body={outcome?.message ?? 'Withdrawals and investments are open for your group.'} next={next} />
      ) : shown === 'review' && !outcome ? (
        <Result tone="wait" title="We're checking your documents" body="A person on the Akibora team reviews each submission. You can keep using your group meanwhile, and you'll get a notification when it's done." next={next} />
      ) : outcome?.status === 'review' ? (
        <Result tone="wait" title="Submitted" body={outcome.message} next={next} />
      ) : (
        <div className="space-y-5">
          {(outcome?.status === 'rejected' || status === 'rejected') && (
            <Notice tone="danger">
              {outcome?.message ?? reason ?? "We couldn't verify your last submission."} Please try again.
            </Notice>
          )}
          <KycVerification onDone={(o) => { setOutcome(o); if (o.status !== 'rejected') setStatus(o.status) }} />
          <Link href={next} className="block text-center text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink">
            Do this later
          </Link>
        </div>
      )}
    </AuthShell>
  )
}

function Result({ tone, title, body, next }: { tone: 'good' | 'wait'; title: string; body: string; next: string }) {
  const Icon = tone === 'good' ? ShieldCheck : Hourglass
  return (
    <Panel tone={tone === 'good' ? 'sage' : 'surface'} className="space-y-4">
      <Icon size={32} />
      <h2 className="font-display text-[26px] leading-tight">{title}</h2>
      <p className="text-[15px] leading-relaxed">{body}</p>
      <ButtonLink href={next} size="lg" className="w-full">Continue</ButtonLink>
    </Panel>
  )
}

export default function VerifyIdentityPage() {
  return (
    <Suspense fallback={null}>
      <VerifyIdentity />
    </Suspense>
  )
}
