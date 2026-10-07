import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseServer } from '@/lib/supabase-server'

type AuthResult =
  | { user: User; supabase: SupabaseClient; response?: never }
  | { user?: never; supabase?: never; response: NextResponse }

// Resolves the signed-in user from the request's auth cookies. API routes must use
// this instead of trusting a user id sent in the request body.
// The returned client acts as that user, so RLS still applies.
export async function requireUser(): Promise<AuthResult> {
  const supabase = (await getSupabaseServer()) as unknown as SupabaseClient
  const { data: { user }, error } = await supabase.auth.getUser()

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
