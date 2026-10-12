'use client'
import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { toJpeg } from '@/components/KycVerification'

// Photo of the member's national ID (front). Uploaded straight to the private
// `kyc` bucket in the user's own folder; only the owner and the server can
// read it. The caller saves the returned path with the profile.

export default function IdDocumentUpload({
  value,
  onUploaded,
  label = 'Photo of your ID (front)',
}: {
  value: string | null
  onUploaded: (path: string) => void
  label?: string
}) {
  const supabase = getSupabaseBrowser()
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in again.')
      const jpeg = await toJpeg(file)
      const path = `${user.id}/id-document-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('kyc').upload(path, jpeg, { contentType: 'image/jpeg', upsert: false })
      if (upErr) throw new Error('Could not upload the photo. Check your connection and try again.')
      setPreview(URL.createObjectURL(jpeg))
      onUploaded(path)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor="id-document" className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {preview && <img src={preview} alt="Your ID" className="w-full max-h-48 object-contain rounded-xl border" style={{ borderColor: 'var(--border)' }} />}
      {value && !preview && (
        <p className="text-[13px] font-semibold text-[#16A34A]">ID photo uploaded</p>
      )}
      <input
        id="id-document"
        type="file"
        accept="image/*"
        capture="environment"
        disabled={busy}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="block w-full text-[14px] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#F0FDF4] file:text-[#16A34A] file:font-semibold"
        style={{ color: 'var(--text-secondary)' }}
      />
      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
        {busy ? 'Uploading…' : 'Lay the card flat in good light with all corners visible.'}
      </p>
      {error && <p className="text-[13px] text-red-500" role="alert">{error}</p>}
    </div>
  )
}
