import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { normalizeKenyanPhone, otpMatches, OTP_MAX_ATTEMPTS } from '@/lib/otp'

// Step 2: check the SMS code and, if it matches, save the number as verified.
// Phone fields can't be written from the browser/app (database trigger), so
// this route is the only way a number gets onto a profile.
const INVALID = (msg = 'That code is wrong or has expired. Request a new one.') =>
  NextResponse.json({ error: msg }, { status: 400 })

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { user } = auth

  const { phone_number, code } = await request.json().catch(() => ({}))
  if (!phone_number || !/^\d{6}$/.test(String(code ?? ''))) {
    return INVALID('Enter the 6-digit code from the SMS.')
  }
  const phone = normalizeKenyanPhone(phone_number)
  const admin = getSupabaseAdmin()

  const { data: otp } = await admin
    .from('otp_codes')
    .select('id, code, attempts')
    .eq('profile_id', user.id)
    .eq('phone_number', phone)
    .eq('purpose', 'phone_verify')
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!otp) return INVALID()

  // Count the attempt first (conditioned on the value read) so parallel
  // guesses can't share one attempt
  const attempts = (otp.attempts || 0) + 1
  const { data: counted } = await admin
    .from('otp_codes')
    .update({ attempts, used: attempts >= OTP_MAX_ATTEMPTS })
    .eq('id', otp.id)
    .eq('attempts', otp.attempts || 0)
    .eq('used', false)
    .select('id')
  if (!counted?.length) return INVALID()

  if (!otpMatches(phone, String(code), otp.code)) {
    return attempts >= OTP_MAX_ATTEMPTS
      ? INVALID('Too many wrong codes. Request a new one.')
      : INVALID(`That code is wrong. ${OTP_MAX_ATTEMPTS - attempts} tries left.`)
  }

  const { data: claimed } = await admin
    .from('otp_codes')
    .update({ used: true })
    .eq('id', otp.id)
    .eq('attempts', attempts)
    .select('id')
  if (!claimed?.length) return INVALID()

  const { error } = await admin
    .from('profiles')
    .update({ phone_number: phone, phone_verified_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That number is already linked to another SmartChama account.' }, { status: 409 })
    }
    console.error('phone verify update failed:', error.message)
    return NextResponse.json({ error: 'Could not save your number. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, phone })
}
