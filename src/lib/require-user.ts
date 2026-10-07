import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase-server'

type AuthResult =
  | { user: User; supabase: SupabaseClient; response?: never }
  | { user?: never; supabase?: never; response: NextResponse }

// Resolves the signed-in user: an `Authorization: Bearer <access token>` header
// (Expo mobile app) or the web app's auth cookies. API routes must use this
// instead of trusting a user id sent in the request body.
// The returned client acts as that user, so RLS still applies.
export async function requireUser(): Promise<AuthResult> {
  const authHeader = (await headers()).get('authorization')
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()

  let supabase: SupabaseClient
  if (bearer) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      }
    )
  } else {
    supabase = (await getSupabaseServer()) as unknown as SupabaseClient
  }

  const { data: { user }, error } = bearer
    ? await supabase.auth.getUser(bearer)
    : await supabase.auth.getUser()

  if (error || !user) {
    return { response: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) }
  }
  return { user, supabase }
}

// Normalises Kenyan numbers to +254XXXXXXXXX. Returns null for empty input.
export function formatKenyanPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let phone = raw.replace(/[\s-]/g, '')
  if (!phone) return null
  if (phone.startsWith('+')) return phone
  if (phone.startsWith('254')) return '+' + phone
  if (phone.startsWith('0')) phone = phone.slice(1)
  return '+254' + phone
}
