// Trust score: one formula used by the API route, the background jobs and the
// member's breakdown page. Contribution 55 + tenure 25 + streak 20 = 100.
import type { SupabaseClient } from '@supabase/supabase-js'

export async function recalcTrustScore(supabase: SupabaseClient, membershipId: string) {
  const [{ data: membership }, { data: contributions }] = await Promise.all([
    supabase.from('chama_memberships').select('joined_at, created_at').eq('id', membershipId).maybeSingle(),
    supabase.from('contributions_v2').select('created_at, payment_method, mpesa_receipt').eq('membership_id', membershipId).eq('status', 'confirmed').order('created_at', { ascending: true }),
  ])
  if (!membership) return null

  const now = new Date()
  const joined = new Date(membership.joined_at || membership.created_at || now)
  const monthsActive = Math.max(1, (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1)

  // M-Pesa with a receipt counts a full month; cash counts half
  const weights: Record<string, number> = {}
  for (const c of contributions || []) {
    const d = new Date(c.created_at)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    const w = c.payment_method === 'mpesa' && c.mpesa_receipt ? 1 : 0.5
    weights[k] = Math.max(weights[k] || 0, w)
  }
  const confirmedMonths = Object.values(weights).reduce((a, b) => a + b, 0)

  let streak = 0
  const cur = new Date(now.getFullYear(), now.getMonth(), 1)
  while (weights[`${cur.getFullYear()}-${cur.getMonth()}`] !== undefined) {
    streak++
    cur.setMonth(cur.getMonth() - 1)
  }

  const trust_score = Math.round(
    Math.min(confirmedMonths / monthsActive, 1) * 55 +
    Math.min(monthsActive / 24, 1) * 25 +
    (Math.min(streak, 12) / 12) * 20,
  )

  await supabase.from('chama_memberships').update({ trust_score, contribution_streak: streak }).eq('id', membershipId)
  return { trust_score, streak }
}
