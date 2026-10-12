'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

// Shown to a group's creator on admin pages until their identity is verified,
// because loan payouts, withdrawals and investments are locked until then.
export default function KycBanner({ creatorId }: { creatorId?: string | null }) {
  const supabase = getSupabaseBrowser()
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !creatorId || user.id !== creatorId) return
      const { data } = await supabase.from('profiles').select('kyc_status').eq('id', user.id).maybeSingle()
      setStatus(data?.kyc_status ?? 'none')
    })()
  }, [supabase, creatorId])

  if (!status || status === 'verified') return null

  const text = status === 'review'
    ? 'Your identity check is being reviewed. Loan payouts, withdrawals and investments unlock once it is approved.'
    : status === 'rejected'
      ? "Your identity check wasn't approved. Submit it again to unlock loan payouts, withdrawals and investments."
      : 'Verify your identity to unlock loan payouts, withdrawals and investments for this group.'

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
      <p className="text-[14px] text-amber-900 dark:text-amber-200">{text}</p>
      {status !== 'review' && (
        <Link href="/verify-identity?next=/admin/dashboard" className="shrink-0 px-4 py-2 rounded-lg bg-[#22C55E] text-white text-[14px] font-semibold">
          Verify now
        </Link>
      )}
    </div>
  )
}
