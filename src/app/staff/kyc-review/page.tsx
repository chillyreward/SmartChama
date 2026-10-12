'use client'
import { useCallback, useEffect, useState } from 'react'

// SmartChama staff only (profiles listed in platform_admins). Shows identity
// checks the automatic face match couldn't decide, with the ID photos and
// selfie side by side. Image links expire after 10 minutes.

type Item = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  document_type: 'national_id' | 'passport'
  document_number: string
  face_match_score: number | null
  provider: string | null
  created_at: string
  id_front_url: string | null
  id_back_url: string | null
  selfie_url: string | null
}

export default function KycReviewPage() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [denied, setDenied] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/kyc/review')
    if (res.status === 401 || res.status === 404) { setDenied(true); return }
    const data = await res.json()
    setItems(data.items ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  async function decide(id: string, decision: 'verified' | 'rejected') {
    setError('')
    setBusyId(id)
    const res = await fetch('/api/kyc/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision, reason: reasons[id] }),
    })
    const data = await res.json().catch(() => ({}))
    setBusyId(null)
    if (!res.ok) { setError(data.error || 'Could not save the decision.'); return }
    setItems((prev) => (prev ?? []).filter((i) => i.id !== id))
  }

  if (denied) {
    return <main className="min-h-screen p-8 text-[15px]">This page is for SmartChama staff only.</main>
  }

  return (
    <main className="min-h-screen px-4 py-8 bg-[#FAFAFA] dark:bg-[#0B0F0C] text-[#161d16] dark:text-[#E8F0E4]">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-[26px] font-bold">Identity checks to review</h1>
          <button onClick={load} className="text-[14px] font-semibold text-[#22C55E] hover:underline">Refresh</button>
        </header>
        <p className="text-[14px] text-[#4F5A53] dark:text-[#8FA196]">
          Approve only when the selfie clearly shows the same person as the ID photo and the document number matches the
          document. The person sees the rejection reason you write.
        </p>
        {error && <p className="text-[14px] text-red-500" role="alert">{error}</p>}

        {items === null ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-[#E5E7EB] dark:border-[#1B2520] p-6 text-center">Nothing waiting for review.</p>
        ) : (
          items.map((it) => (
            <article key={it.id} className="rounded-2xl border border-[#E5E7EB] dark:border-[#1B2520] bg-white dark:bg-[#0E1410] p-5 space-y-4">
              <div className="flex flex-wrap justify-between gap-2 text-[14px]">
                <div>
                  <p className="text-[17px] font-semibold">{it.name || 'Unnamed'}</p>
                  <p className="text-[#4F5A53] dark:text-[#8FA196]">{it.email} {it.phone ? `· ${it.phone}` : ''}</p>
                </div>
                <div className="text-right">
                  <p>{it.document_type === 'national_id' ? 'National ID' : 'Passport'} <strong className="font-mono">{it.document_number}</strong></p>
                  <p className="text-[#4F5A53] dark:text-[#8FA196]">
                    Face match: {it.face_match_score != null ? `${it.face_match_score}%` : 'not run'} · {new Date(it.created_at).toLocaleString('en-KE')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[['Selfie', it.selfie_url], [it.document_type === 'national_id' ? 'ID front' : 'Passport page', it.id_front_url], ['ID back', it.id_back_url]]
                  .filter(([, url]) => url)
                  .map(([title, url]) => (
                    <figure key={title as string} className="space-y-1">
                      <img src={url as string} alt={title as string} className="w-full h-56 object-contain rounded-lg bg-[#F3F4F6] dark:bg-black" />
                      <figcaption className="text-[12px] text-[#4F5A53] dark:text-[#8FA196]">{title}</figcaption>
                    </figure>
                  ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor={`reason-${it.id}`} className="sr-only">Rejection reason</label>
                <input
                  id={`reason-${it.id}`}
                  value={reasons[it.id] ?? ''}
                  onChange={(e) => setReasons((r) => ({ ...r, [it.id]: e.target.value }))}
                  placeholder="Reason if rejecting, e.g. selfie too dark"
                  className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-[#E5E7EB] dark:border-[#1B2520] bg-transparent text-[14px]"
                />
                <button
                  onClick={() => decide(it.id, 'rejected')}
                  disabled={busyId === it.id || !(reasons[it.id] ?? '').trim()}
                  className="px-4 py-2 rounded-lg border border-red-400 text-red-600 text-[14px] font-semibold disabled:opacity-40"
                >
                  Reject
                </button>
                <button
                  onClick={() => decide(it.id, 'verified')}
                  disabled={busyId === it.id}
                  className="px-4 py-2 rounded-lg bg-[#22C55E] text-white text-[14px] font-semibold disabled:opacity-40"
                >
                  Approve
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  )
}
