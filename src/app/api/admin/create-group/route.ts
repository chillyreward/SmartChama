import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'

// Joins the signed-in user to a chama by group code or invite token.
// Creating a chama lives in /api/chamas/create.
//
// This route used to take userId/chamaId from the body and write with the
// service role, which let anyone add any user to any chama. Joining now goes
// through the join_chama_by_code() database function, which checks the code
// and only ever acts on the caller.

const ERRORS: Record<string, string> = {
  invalid_code: 'Group code not found. Check with your admin and try again.',
  expired: 'This invite code has expired. Ask your admin for a new one.',
  used_up: 'This invite code has already been used. Ask your admin for a new one.',
  no_profile: 'Your profile is not set up yet. Please complete your profile first.',
  not_authenticated: 'Please sign in first.',
  not_allowed: "You can't rejoin this group. Please contact the group admin.",
}

export async function POST(req: Request) {
  try {
    const auth = await requireUser()
    if (auth.response) return auth.response

    const { code } = await req.json()
    if (!code || String(code).trim().length < 4) {
      return NextResponse.json({ error: 'Please enter your group code.' }, { status: 400 })
    }

    const { data, error } = await auth.supabase.rpc('join_chama_by_code', { p_code: String(code) })

    if (error) {
      console.error('Join chama error:', error)
      return NextResponse.json({ error: 'Could not join group. Please try again.' }, { status: 500 })
    }
    if (!data?.success) {
      return NextResponse.json({ error: ERRORS[data?.error] || 'Could not join group.' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      chamaId: data.chama_id,
      chamaName: data.chama_name,
      alreadyMember: data.already_member,
      pending: data.pending === true
    })
  } catch (err) {
    console.error('Join chama error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
