'use client'
import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

// Identity check for group creators: ID number, ID photo(s) and a live selfie.
// Photos go straight to the private `kyc` storage bucket (own folder only);
// /api/kyc/submit then compares the selfie with the face on the ID.

type DocType = 'national_id' | 'passport'
export type KycOutcome = { status: 'verified' | 'review' | 'rejected'; message: string }

const MAX_SIDE = 1600

// Downscale and re-encode as JPEG: keeps uploads small (Rekognition's limit is
// 5 MB) and strips the phone's location metadata from the photo.
export async function toJpeg(source: Blob | HTMLCanvasElement): Promise<Blob> {
  let canvas: HTMLCanvasElement
  if (source instanceof HTMLCanvasElement) {
    canvas = source
  } else {
    const bitmap = await createImageBitmap(source)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read the photo'))), 'image/jpeg', 0.85)
  )
}

const box = 'rounded-2xl border border-[#E5E7EB] dark:border-[#1B2520] bg-white dark:bg-[#0E1410] p-5 space-y-4'
const label = 'block text-[11px] font-semibold uppercase tracking-wider text-[#4F5A53] dark:text-[#8FA196]'
const input = 'w-full px-4 py-3 rounded-xl border text-[15px] bg-white dark:bg-[#0E1410] border-[#E5E7EB] dark:border-[#1B2520] text-[#161d16] dark:text-white focus:outline-none focus:border-[#22C55E]'
const primary = 'w-full py-3.5 rounded-xl bg-[#22C55E] text-white text-[16px] font-semibold hover:bg-[#16A34A] disabled:opacity-50'

function PhotoPicker({ id, title, hint, value, onChange }: {
  id: string; title: string; hint: string; value: Blob | null; onChange: (b: Blob | null) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => {
    if (!value) { setPreview(null); return }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={label}>{title}</label>
      <p className="text-[13px] text-[#4F5A53] dark:text-[#8FA196]">{hint}</p>
      {preview && <img src={preview} alt={title} className="w-full max-h-56 object-contain rounded-xl border border-[#E5E7EB] dark:border-[#1B2520]" />}
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          onChange(f ? await toJpeg(f) : null)
        }}
        className="block w-full text-[14px] text-[#4F5A53] dark:text-[#8FA196] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#F0FDF4] file:text-[#16A34A] file:font-semibold"
      />
    </div>
  )
}

function SelfieCamera({ value, onChange }: { value: Blob | null; onChange: (b: Blob | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<'idle' | 'live' | 'unsupported' | 'denied'>('idle')
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])
  useEffect(() => {
    if (!value) { setPreview(null); return }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) { setState('unsupported'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false })
      streamRef.current = stream
      setState('live')
      onChange(null)
      requestAnimationFrame(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}) }
      })
    } catch {
      setState('denied')
    }
  }

  async function capture() {
    const v = videoRef.current
    if (!v) return
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, MAX_SIDE / Math.max(v.videoWidth, v.videoHeight))
    canvas.width = Math.round(v.videoWidth * scale)
    canvas.height = Math.round(v.videoHeight * scale)
    canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height)
    onChange(await toJpeg(canvas))
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setState('idle')
  }

  return (
    <div className="space-y-2">
      <span className={label}>Live selfie</span>
      <p className="text-[13px] text-[#4F5A53] dark:text-[#8FA196]">
        Face the camera in good light, no hat or sunglasses. We compare it with the photo on your ID.
      </p>
      {state === 'live' ? (
        <div className="space-y-3">
          <video ref={videoRef} playsInline muted className="w-full max-h-72 rounded-xl bg-black object-cover -scale-x-100" />
          <button type="button" onClick={capture} className={primary}>Take selfie</button>
        </div>
      ) : preview ? (
        <div className="space-y-3">
          <img src={preview} alt="Your selfie" className="w-full max-h-72 object-contain rounded-xl border border-[#E5E7EB] dark:border-[#1B2520]" />
          <button type="button" onClick={start} className="text-[14px] font-semibold text-[#22C55E] hover:underline">Retake</button>
        </div>
      ) : (
        <button type="button" onClick={start} className="w-full py-3 rounded-xl border-2 border-[#22C55E] text-[#22C55E] font-semibold">
          Open camera
        </button>
      )}
      {state === 'denied' && (
        <p className="text-[13px] text-red-500">Camera access was blocked. Allow the camera for this site in your browser settings, then try again.</p>
      )}
      {state === 'unsupported' && (
        <p className="text-[13px] text-red-500">This browser can't open the camera. Use Chrome or Safari on your phone.</p>
      )}
    </div>
  )
}

export default function KycVerification({ onDone }: { onDone?: (outcome: KycOutcome) => void }) {
  const supabase = getSupabaseBrowser()
  const [docType, setDocType] = useState<DocType>('national_id')
  const [docNumber, setDocNumber] = useState('')
  const [front, setFront] = useState<Blob | null>(null)
  const [back, setBack] = useState<Blob | null>(null)
  const [selfie, setSelfie] = useState<Blob | null>(null)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const ready = consent && docNumber.trim().length >= 6 && front && selfie && (docType === 'passport' || back)

  async function submit() {
    setError('')
    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in again.')
      const stamp = Date.now()
      const upload = async (blob: Blob, name: string) => {
        const path = `${user.id}/${stamp}-${name}.jpg`
        const { error: upErr } = await supabase.storage.from('kyc').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
        if (upErr) throw new Error('Could not upload your photos. Check your connection and try again.')
        return path
      }
      const [id_front_path, id_back_path, selfie_path] = await Promise.all([
        upload(front!, 'id-front'),
        docType === 'national_id' ? upload(back!, 'id-back') : Promise.resolve(null),
        upload(selfie!, 'selfie'),
      ])

      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_type: docType, document_number: docNumber, id_front_path, id_back_path, selfie_path, consent }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.retake) setSelfie(null)
        throw new Error(data.error || 'Verification failed. Please try again.')
      }
      onDone?.({ status: data.status, message: data.message })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className={box}>
        <span className={label}>Document</span>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Document type">
          {([['national_id', 'National ID'], ['passport', 'Passport']] as const).map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={docType === value}
              onClick={() => { setDocType(value); setBack(null) }}
              className={`py-3 rounded-xl border text-[14px] font-semibold ${docType === value ? 'border-[#22C55E] bg-[#F0FDF4] dark:bg-[#0E2E1B] text-[#16A34A]' : 'border-[#E5E7EB] dark:border-[#1B2520] text-[#4F5A53] dark:text-[#8FA196]'}`}
            >
              {text}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <label htmlFor="kyc-number" className={label}>{docType === 'national_id' ? 'ID number' : 'Passport number'}</label>
          <input
            id="kyc-number"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
            inputMode={docType === 'national_id' ? 'numeric' : 'text'}
            autoComplete="off"
            placeholder={docType === 'national_id' ? '12345678' : 'AK1234567'}
            className={input}
          />
        </div>
      </div>

      <div className={box}>
        <PhotoPicker
          id="kyc-front"
          title={docType === 'national_id' ? 'Front of ID' : 'Passport photo page'}
          hint="Lay it flat in good light. All four corners visible, no glare on the photo."
          value={front}
          onChange={setFront}
        />
        {docType === 'national_id' && (
          <PhotoPicker id="kyc-back" title="Back of ID" hint="The side with the fingerprint and serial number." value={back} onChange={setBack} />
        )}
      </div>

      <div className={box}>
        <SelfieCamera value={selfie} onChange={setSelfie} />
      </div>

      <label className="flex items-start gap-3 text-[13px] text-[#4F5A53] dark:text-[#8FA196]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-4 h-4 accent-[#22C55E]" />
        <span>
          I agree that SmartChama may use my ID document and selfie to confirm my identity, including an automated
          comparison of my face with my ID photo. They are stored privately and used only for verification and fraud
          prevention, as described in the <a href="/privacy" target="_blank" className="text-[#22C55E] underline">privacy policy</a>.
        </span>
      </label>

      {error && <p className="text-[14px] text-red-500" role="alert">{error}</p>}

      <button type="button" onClick={submit} disabled={!ready || busy} className={primary}>
        {busy ? 'Checking your identity…' : 'Submit for verification'}
      </button>
    </div>
  )
}
