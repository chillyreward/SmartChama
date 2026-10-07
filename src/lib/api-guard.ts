import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const ADMIN_ROLES = ['admin', 'chairlady', 'treasurer', 'secretary']

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// Server-to-server calls (one API route calling another) and Vercel cron jobs.
// Internal callers send `x-internal-secret: INTERNAL_API_SECRET`; Vercel cron
// sends `Authorization: Bearer CRON_SECRET` automatically when CRON_SECRET is set.
export function isInternalRequest(req: Request): boolean {
  const internal = process.env.INTERNAL_API_SECRET
  const header = req.headers.get('x-internal-secret')
  if (internal && header && safeEqual(header, internal)) return true

  const cron = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (cron && auth && safeEqual(auth, `Bearer ${cron}`)) return true

  return false
}

export function internalHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-internal-secret': process.env.INTERNAL_API_SECRET || ''
  }
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

// Debug/test endpoints: available in local dev only, a plain 404 in production.
export function devOnly(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

// Returns the caller's active membership in the chama, optionally requiring
// one of `roles`. `supabase` can be any client; the check filters on userId.
export async function getChamaMembership(
  supabase: SupabaseClient,
  userId: string,
  chamaId: string,
  roles?: string[]
): Promise<{ id: string; role: string } | null> {
  if (!chamaId) return null
  let q = supabase
    .from('chama_memberships')
    .select('id, role')
    .eq('profile_id', userId)
    .eq('chama_id', chamaId)
    .eq('status', 'active')
  if (roles) q = q.in('role', roles)
  const { data } = await q.maybeSingle()
  return data ?? null
}
