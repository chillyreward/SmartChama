import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateOtp, hashOtp, normalizeKenyanPhone, otpMatches, OTP_MAX_ATTEMPTS, OTP_TTL_MS } from '@/lib/otp'
import { sendSms } from '@/lib/sms'

// Member sign-up with a phone number instead of an email.
//   action "start":    check everything, then text a 6-digit code
//   action "complete": check the code, create the account (phone already
//                      verified), save the ID number, join the group, sign in
//
// Supabase password sign-in needs an email, so phone-only accounts get an
// internal address on the reserved .invalid domain, which can never receive
// mail. Members never see it: they sign in with phone + password.

const PHONE_ACCOUNT_DOMAIN = 'phone.smartchama.invalid'

type Body = {
  action?: 'start' | 'complete'
  full_name?: string
  phone_number?: string
  national_id?: string
  join_code?: string
  password?: string
  code?: string
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

async function validate(admin: ReturnType<typeof getSupabaseAdmin>, b: Body) {
  const fullName = String(b.full_name || '').trim()
  const phone = normalizeKenyanPhone(String(b.phone_number || ''))
  const nationalId = String(b.national_id || '').replace(/\s/g, '')
  const joinCode = String(b.join_code || '').trim().toUpperCase()
  const password = String(b.password || '')

  if (fullName.length < 2) return { error: 'Enter your full name.' }
  if (!/^\+254(7|1)\d{8}$/.test(phone)) return { error: 'Enter a valid Kenyan mobile number, e.g. 0712 345 678.' }
  if (!/^\d{7,9}$/.test(nationalId)) return { error: 'Enter your national ID number (7 to 9 digits).' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (joinCode.length < 4) return { error: 'Enter your group or invite code.' }

  const [{ data: phoneOwner }, { data: idOwner }, { data: preview }] = await Promise.all([
    admin.from('profiles').select('id').eq('phone_number', phone).maybeSingle(),
    admin.from('profile_private').select('profile_id').eq('national_id', nationalId).limit(1),
    admin.rpc('preview_join_code', { p_code: joinCode }),
  ])
  if (phoneOwner) return { error: 'This phone number already has an Akibora account. Sign in instead.', status: 409 }
  if (idOwner?.length) return { error: 'This ID number is already registered. Sign in, or contact support if this is a mistake.', status: 409 }
  if (!preview?.valid) {
    const messages: Record<string, string> = {
      expired: 'This invite code has expired. Ask your admin for a new one.',
      used_up: 'This invite code has already been used. Ask your admin for a new one.',
    }
    return { error: messages[preview?.error] || 'Group code not found. Check with your admin and try again.' }
  }
  return { fullName, phone, nationalId, joinCode, password, chamaName: preview.chama_name as string }
}

export async function POST(request: Request) {
  const body: Body = await request.json().catch(() => ({}))
  const admin = getSupabaseAdmin()

  const v = await validate(admin, body)
  if ('error' in v) return bad(v.error!, v.status ?? 400)

  // ---------- start: text a code ----------
  if (body.action === 'start') {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('otp_codes').select('id', { count: 'exact', head: true })
      .eq('phone_number', v.phone).gte('created_at', since)
    if ((count ?? 0) >= 3) return bad('Too many codes requested. Please wait 10 minutes and try again.', 429)

    await admin.from('otp_codes').update({ used: true })
      .eq('phone_number', v.phone).eq('purpose', 'signup').eq('used', false)

    const code = generateOtp()
    const { error } = await admin.from('otp_codes').insert({
      phone_number: v.phone,
      code: hashOtp(v.phone, code),
      purpose: 'signup',
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    })
    if (error) return bad('Could not send a code. Please try again.', 500)

    const sent = await sendSms(v.phone, `Your Akibora sign-up code is ${code}. It expires in 5 minutes. Do not share it.`)
    if (!sent.success) return bad('We could not send the SMS. Check the number and try again.', 502)
    if (sent.simulated) {
      if (process.env.NODE_ENV === 'production') return bad('SMS is not set up yet. Please try again later.', 503)
      console.log(`[DEV] sign-up code for ${v.phone}: ${code}`)
    }
    return NextResponse.json({ success: true, phone: v.phone, chama_name: v.chamaName })
  }

  // ---------- complete: check the code, create the account ----------
  if (body.action !== 'complete') return bad('Unknown action.')
  if (!/^\d{6}$/.test(String(body.code || ''))) return bad('Enter the 6-digit code from the SMS.')

  const { data: otp } = await admin
    .from('otp_codes').select('id, code, attempts')
    .eq('phone_number', v.phone).eq('purpose', 'signup').eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!otp) return bad('That code has expired. Request a new one.')

  const attempts = (otp.attempts || 0) + 1
  const { data: counted } = await admin.from('otp_codes')
    .update({ attempts, used: attempts >= OTP_MAX_ATTEMPTS })
    .eq('id', otp.id).eq('attempts', otp.attempts || 0).eq('used', false).select('id')
  if (!counted?.length) return bad('That code has expired. Request a new one.')
  if (!otpMatches(v.phone, String(body.code), otp.code)) {
    return bad(attempts >= OTP_MAX_ATTEMPTS ? 'Too many wrong codes. Request a new one.' : `That code is wrong. ${OTP_MAX_ATTEMPTS - attempts} tries left.`)
  }
  const { data: claimed } = await admin.from('otp_codes').update({ used: true })
    .eq('id', otp.id).eq('attempts', attempts).select('id')
  if (!claimed?.length) return bad('That code has expired. Request a new one.')

  // Create the account (the handle_new_user trigger creates the profile)
  const email = `${v.phone.slice(1)}@${PHONE_ACCOUNT_DOMAIN}`
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.fullName, signup_method: 'phone' },
  })
  if (createError || !created.user) {
    const taken = /already|registered|exists/i.test(createError?.message || '')
    return bad(taken ? 'This phone number already has an Akibora account. Sign in instead.' : 'Could not create your account. Please try again.', taken ? 409 : 500)
  }
  const userId = created.user.id

  // Phone is verified (the code just matched); the internal email isn't shown anywhere
  const { error: profileError } = await admin.from('profiles')
    .update({ full_name: v.fullName, email: null, phone_number: v.phone, phone_verified_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return bad(profileError.code === '23505' ? 'This phone number already has an Akibora account. Sign in instead.' : 'Could not create your account. Please try again.', 409)
  }
  await admin.from('profile_private').upsert(
    { profile_id: userId, national_id: v.nationalId, updated_at: new Date().toISOString() },
    { onConflict: 'profile_id' }
  )

  // Sign in, then join as that user (join_chama_by_code acts on auth.uid())
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({ email, password: v.password })
  if (signInError || !signedIn.session) {
    return NextResponse.json({ success: true, signed_in: false, message: 'Account created. Sign in with your phone number and password.' })
  }

  const asUser = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${signedIn.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: join } = await asUser.rpc('join_chama_by_code', { p_code: v.joinCode })

  return NextResponse.json({
    success: true,
    signed_in: true,
    access_token: signedIn.session.access_token,
    refresh_token: signedIn.session.refresh_token,
    joined: !!join?.success,
    pending: !!join?.pending,
    chama_id: join?.chama_id ?? null,
    chama_name: join?.chama_name ?? v.chamaName,
  })
}
