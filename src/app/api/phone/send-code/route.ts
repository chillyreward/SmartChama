import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateOtp, hashOtp, normalizeKenyanPhone, OTP_TTL_MS } from '@/lib/otp'
import { sendSms } from '@/lib/sms'

// Step 1 of adding or changing a phone number: text a 6-digit code to it.
// The number is saved only when /api/phone/verify gets the right code back,
// which proves the user holds that SIM.
export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { user } = auth

  const { phone_number } = await request.json().catch(() => ({}))
  const phone = phone_number ? normalizeKenyanPhone(phone_number) : ''
  if (!/^\+254(7|1)\d{8}$/.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid Kenyan mobile number, e.g. 0712 345 678.' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: owner } = await admin
    .from('profiles')
    .select('id')
    .eq('phone_number', phone)
    .maybeSingle()
  if (owner && owner.id !== user.id) {
    return NextResponse.json({ error: 'That number is already linked to another SmartChama account.' }, { status: 409 })
  }
  if (owner && owner.id === user.id) {
    return NextResponse.json({ error: 'That number is already verified on your account.' }, { status: 409 })
  }

  // Rate limits: 3 codes per number and 5 per account in 10 minutes
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const [{ count: perPhone }, { count: perUser }] = await Promise.all([
    admin.from('otp_codes').select('id', { count: 'exact', head: true }).eq('phone_number', phone).gte('created_at', since),
    admin.from('otp_codes').select('id', { count: 'exact', head: true }).eq('profile_id', user.id).gte('created_at', since),
  ])
  if ((perPhone ?? 0) >= 3 || (perUser ?? 0) >= 5) {
    return NextResponse.json({ error: 'Too many codes requested. Please wait 10 minutes and try again.' }, { status: 429 })
  }

  // Only the newest code for this account and number is valid
  await admin
    .from('otp_codes')
    .update({ used: true })
    .eq('profile_id', user.id)
    .eq('purpose', 'phone_verify')
    .eq('used', false)

  const code = generateOtp()
  const { error } = await admin.from('otp_codes').insert({
    phone_number: phone,
    profile_id: user.id,
    code: hashOtp(phone, code),
    purpose: 'phone_verify',
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  })
  if (error) {
    console.error('phone send-code insert failed:', error.message)
    return NextResponse.json({ error: 'Could not send a code. Please try again.' }, { status: 500 })
  }

  const sent = await sendSms(phone, `Your SmartChama code to confirm this phone number is ${code}. It expires in 5 minutes. Do not share it.`)
  if (!sent.success) {
    return NextResponse.json({ error: 'We could not send the SMS. Check the number and try again.' }, { status: 502 })
  }
  if (sent.simulated) {
    if (process.env.NODE_ENV === 'production') {
      // No SMS provider configured: don't pretend a code was sent
      return NextResponse.json({ error: 'SMS is not set up yet. Please try again later.' }, { status: 503 })
    }
    console.log(`[DEV] phone verification code for ${phone}: ${code}`)
  }

  return NextResponse.json({ success: true, phone })
}
