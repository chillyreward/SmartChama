import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Staff review of identity checks the automatic face match couldn't decide.
// Only profiles listed in platform_admins may use it. Images are served as
// signed links that expire after 10 minutes.

async function requireStaff() {
  const auth = await requireUser()
  if (auth.response) return { response: auth.response }
  const admin = getSupabaseAdmin()
  const { data } = await admin.from('platform_admins').select('profile_id').eq('profile_id', auth.user.id).maybeSingle()
  if (!data) return { response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { user: auth.user, admin }
}

export async function GET() {
  const staff = await requireStaff()
  if (staff.response) return staff.response
  const { admin } = staff

  const { data: rows, error } = await admin
    .from('kyc_verifications')
    .select('id, profile_id, document_type, document_number, id_front_path, id_back_path, selfie_path, status, face_match_score, provider, created_at, profiles(full_name, email, phone_number)')
    .eq('status', 'review')
    .order('created_at', { ascending: true })
    .limit(50)
  if (error) return NextResponse.json({ error: 'Could not load submissions.' }, { status: 500 })

  const sign = async (path: string | null) => {
    if (!path) return null
    const { data } = await admin.storage.from('kyc').createSignedUrl(path, 600)
    return data?.signedUrl ?? null
  }

  const items = await Promise.all((rows ?? []).map(async (r: any) => ({
    id: r.id,
    name: r.profiles?.full_name,
    email: r.profiles?.email,
    phone: r.profiles?.phone_number,
    document_type: r.document_type,
    document_number: r.document_number,
    face_match_score: r.face_match_score,
    provider: r.provider,
    created_at: r.created_at,
    id_front_url: await sign(r.id_front_path),
    id_back_url: await sign(r.id_back_path),
    selfie_url: await sign(r.selfie_path),
  })))
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const staff = await requireStaff()
  if (staff.response) return staff.response
  const { admin, user } = staff

  const { id, decision, reason } = await request.json().catch(() => ({}))
  if (!id || !['verified', 'rejected'].includes(decision)) {
    return NextResponse.json({ error: 'Choose approve or reject.' }, { status: 400 })
  }
  if (decision === 'rejected' && !String(reason || '').trim()) {
    return NextResponse.json({ error: 'Give the reason the person will see.' }, { status: 400 })
  }

  // Only a submission still awaiting review can be decided (no double decisions)
  const { data: updated, error } = await admin
    .from('kyc_verifications')
    .update({
      status: decision,
      rejection_reason: decision === 'rejected' ? String(reason).trim().slice(0, 300) : null,
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'review')
    .select('profile_id, document_type, document_number')
  if (error || !updated?.length) {
    return NextResponse.json({ error: 'This submission was already decided or no longer exists.' }, { status: 409 })
  }

  const row = updated[0]
  await admin.from('profiles').update({ kyc_status: decision }).eq('id', row.profile_id)
  if (decision === 'verified' && row.document_type === 'national_id') {
    await admin.from('profile_private').upsert(
      { profile_id: row.profile_id, national_id: row.document_number, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id' }
    )
  }
  await admin.from('notifications').insert({
    profile_id: row.profile_id,
    type: 'kyc_' + decision,
    title: decision === 'verified' ? 'Identity verified' : 'Identity check not approved',
    message: decision === 'verified'
      ? 'Your identity is verified. Loans, withdrawals and investments are unlocked for your group.'
      : `We couldn't verify your identity: ${String(reason).trim()}. Please submit again.`,
  })

  return NextResponse.json({ success: true })
}
