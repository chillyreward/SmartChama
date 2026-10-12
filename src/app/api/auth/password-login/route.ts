import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { normalizeKenyanPhone } from '@/lib/otp'

// Sign in with phone number + password. Supabase password sign-in needs the
// account's email, so the server looks it up from the (verified) phone number
// and signs in on the user's behalf, returning the session tokens. The email
// is never sent back, so this can't be used to discover who owns a number.
// Email + password sign-in stays in the browser (supabase.auth.signInWithPassword).

const WRONG = () =>
  NextResponse.json({ error: 'Incorrect phone number or password.' }, { status: 401 })

const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_PHONE = 5
const MAX_PER_IP = 30

function clientIp(request: Request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
}

export async function POST(request: Request) {
  const { phone_number, password } = await request.json().catch(() => ({}))
  if (!phone_number || !password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Enter your phone number and password.' }, { status: 400 })
  }
  const phone = normalizeKenyanPhone(String(phone_number))
  if (!/^\+254(7|1)\d{8}$/.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid Kenyan phone number, e.g. 0712 345 678.' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const ip = clientIp(request)
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const [{ count: phoneFails }, { count: ipFails }] = await Promise.all([
    admin.from('login_attempts').select('id', { count: 'exact', head: true }).eq('identifier', phone).gte('created_at', since),
    admin.from('login_attempts').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', since),
  ])
  if ((phoneFails ?? 0) >= MAX_PER_PHONE || (ipFails ?? 0) >= MAX_PER_IP) {
    return NextResponse.json({ error: 'Too many failed attempts. Wait 15 minutes or reset your password.' }, { status: 429 })
  }

  const fail = async () => {
    await admin.from('login_attempts').insert({ identifier: phone, ip })
    return WRONG()
  }

  // Only numbers proven with an SMS code can be used to sign in
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('phone_number', phone)
    .not('phone_verified_at', 'is', null)
    .maybeSingle()
  if (!profile) return fail()

  const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
  const email = authUser?.user?.email
  if (!email || email.endsWith('@deleted.smartchama.invalid')) return fail()

  // Throwaway anon client: signs in without touching any server-side session
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await anon.auth.signInWithPassword({ email, password })
  if (error || !data.session) return fail()

  // Successful sign-in clears this number's failure count
  await admin.from('login_attempts').delete().eq('identifier', phone)

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
}
