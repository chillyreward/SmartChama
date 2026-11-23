export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/api-auth'
import { recalcTrustScore } from '@/lib/trust-score'
import { ADMIN_ROLES, getChamaMembership, internalHeaders, isInternalRequest } from '@/lib/api-guard'

export async function POST(request: Request) {
  try {
    const internal = isInternalRequest(request)
    const { user, error: authError } = internal ? { user: null, error: null } : await requireAuth(request)
    if (!internal && (authError || !user)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { membership_id } = await request.json()
    
    if (!membership_id) {
      return new Response(JSON.stringify({ error: 'Missing membership_id' }), { status: 400 })
    }

    // Fetch membership details
    const { data: membership, error: memErr } = await supabase
      .from('chama_memberships')
      .select('joined_at, chama_id, profile_id')
      .eq('id', membership_id)
      .single()

    if (memErr || !membership) {
      return new Response(JSON.stringify({ error: 'Membership not found' }), { status: 404 })
    }

    // Officials of that chama only: this rewrites the member's score with the service role
    if (!internal && !(await getChamaMembership(supabase, user!.id, membership.chama_id, ADMIN_ROLES))) {
      return new Response(JSON.stringify({ error: 'Only chama officials can recalculate scores' }), { status: 403 })
    }

    // Trigger fraud checks
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fraud/check`, {
        method: 'POST',
        headers: internalHeaders(),
        body: JSON.stringify({
          chama_id: membership.chama_id,
          profile_id: (membership as any).profile_id || null
        })
      });
    } catch (fErr) {
      console.error('Trigger fraud check error:', fErr);
    }

    const result = await recalcTrustScore(supabase, membership_id)
    const trust_score = result?.trust_score ?? 0
    const streak = result?.streak ?? 0

    return new Response(JSON.stringify({ trust_score, streak }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Trust score calculation error:', error)
    return new Response(JSON.stringify({ error: 'Could not calculate trust score' }), { status: 500 })
  }
}
