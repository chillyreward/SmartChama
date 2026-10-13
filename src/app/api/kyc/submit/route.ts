import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getFaceMatcher } from '@/lib/face-match'

export const maxDuration = 30

// Identity verification for group creators. The browser uploads the ID
// photos and selfie straight into the private `kyc` bucket (own folder only),
// then calls this route with the paths. The server checks the paths, compares
// the selfie with the ID face, records the result and sets profiles.kyc_status.

const MAX_BYTES = 5 * 1024 * 1024 // Rekognition's limit for raw image bytes

function validNumber(type: string, value: string) {
  if (type === 'national_id') return /^\d{7,9}$/.test(value)
  if (type === 'passport') return /^[A-Z0-9]{6,9}$/.test(value)
  return false
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { user } = auth

  const body = await request.json().catch(() => ({}))
  const documentType = String(body.document_type || '')
  const documentNumber = String(body.document_number || '').replace(/\s/g, '').toUpperCase()
  const { id_front_path, id_back_path, selfie_path, consent } = body

  if (consent !== true) {
    return NextResponse.json({ error: 'Please agree to the identity check to continue.' }, { status: 400 })
  }
  if (!['national_id', 'passport'].includes(documentType)) {
    return NextResponse.json({ error: 'Choose national ID or passport.' }, { status: 400 })
  }
  if (!validNumber(documentType, documentNumber)) {
    return NextResponse.json({
      error: documentType === 'national_id'
        ? 'Enter your ID number (7 to 9 digits).'
        : 'Enter your passport number (6 to 9 letters and digits).',
    }, { status: 400 })
  }
  if (documentType === 'national_id' && !id_back_path) {
    return NextResponse.json({ error: 'Add a photo of the back of your ID.' }, { status: 400 })
  }

  // Files must be in this user's folder of the private bucket
  const paths = [id_front_path, selfie_path, ...(documentType === 'national_id' ? [id_back_path] : [])]
  if (paths.some((p) => typeof p !== 'string' || !p.startsWith(`${user.id}/`) || p.includes('..'))) {
    return NextResponse.json({ error: 'Upload the photos again.' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: current } = await admin.from('profiles').select('kyc_status').eq('id', user.id).maybeSingle()
  if (current?.kyc_status === 'verified') {
    return NextResponse.json({ status: 'verified', message: 'Your identity is already verified.' })
  }

  // The same document can't verify two accounts
  const { data: reused } = await admin
    .from('kyc_verifications')
    .select('profile_id')
    .eq('document_type', documentType)
    .eq('document_number', documentNumber)
    .neq('profile_id', user.id)
    .in('status', ['verified', 'review'])
    .limit(1)
  if (reused?.length) {
    return NextResponse.json({ error: 'This document is already linked to another SmartChama account.' }, { status: 409 })
  }

  const download = async (path: string) => {
    const { data, error } = await admin.storage.from('kyc').download(path)
    if (error || !data) throw new Error('missing')
    const bytes = new Uint8Array(await data.arrayBuffer())
    if (bytes.byteLength > MAX_BYTES) throw new Error('too_big')
    return bytes
  }

  let selfie: Uint8Array, idFront: Uint8Array
  try {
    ;[selfie, idFront] = await Promise.all([download(selfie_path), download(id_front_path)])
    if (documentType === 'national_id') await download(id_back_path)
  } catch (e: any) {
    return NextResponse.json({
      error: e?.message === 'too_big' ? 'A photo is too large. Please retake it.' : "We couldn't find your photos. Upload them again.",
    }, { status: 400 })
  }

  let result
  try {
    result = await getFaceMatcher().compare(selfie, idFront)
  } catch (err) {
    console.error('Face match failed:', err)
    result = { outcome: 'unavailable' as const, provider: 'none' as const }
  }

  if (result.outcome === 'retake') {
    // Nothing recorded: the user fixes the photo and submits again
    return NextResponse.json({ error: result.reason, retake: true }, { status: 422 })
  }

  const status = result.outcome === 'match' ? 'verified' : result.outcome === 'no_match' ? 'rejected' : 'review'
  const rejectionReason = status === 'rejected'
    ? "The selfie doesn't match the photo on your ID. Retake both in good light and try again."
    : null

  const { error: insertError } = await admin.from('kyc_verifications').insert({
    profile_id: user.id,
    document_type: documentType,
    document_number: documentNumber,
    id_front_path,
    id_back_path: documentType === 'national_id' ? id_back_path : null,
    selfie_path,
    status,
    face_match_score: 'similarity' in result ? result.similarity : null,
    provider: result.provider,
    rejection_reason: rejectionReason,
    consent_at: new Date().toISOString(),
  })
  if (insertError) {
    console.error('KYC insert failed:', insertError.message)
    return NextResponse.json({ error: 'Could not save your verification. Please try again.' }, { status: 500 })
  }

  await admin.from('profiles').update({ kyc_status: status }).eq('id', user.id)
  if (documentType === 'national_id') {
    await admin.from('profile_private').upsert(
      { profile_id: user.id, national_id: documentNumber, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id' }
    )
  }

  const messages: Record<string, string> = {
    verified: 'Your identity is verified. Withdrawals and investments are now unlocked for your group.',
    review: 'Thanks. A SmartChama team member will check your documents, usually within one working day.',
    rejected: rejectionReason!,
  }
  return NextResponse.json({ status, message: messages[status] })
}
