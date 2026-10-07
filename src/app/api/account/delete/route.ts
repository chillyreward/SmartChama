import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Account deletion (required by Google Play for apps that create accounts).
// Used by the Android app (Bearer token) and the /account/delete web page (cookie).
//
// Personal details are erased and sign-in is disabled. Contribution, loan and
// ledger rows are kept for the group's financial records, attached to an
// anonymous "Former member" profile. Hard-deleting the auth user would cascade
// into those records, so the account is disabled instead.

const ERRORS: Record<string, string> = {
  outstanding_loan: 'You still have a loan to repay. Clear it before deleting your account.',
  unpaid_penalty: 'You have an unpaid penalty. Settle it or ask an official to waive it first.',
  sole_official: 'You are the only official of a group with other members. Hand over your role first.',
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const { user } = auth

  const { confirm } = await request.json().catch(() => ({}))
  if (confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data, error } = await admin.rpc('anonymize_account', { p_user: user.id })
  if (error) {
    console.error('anonymize_account failed:', error)
    return NextResponse.json({ error: 'Could not delete your account. Please try again.' }, { status: 500 })
  }
  if (!data?.success) {
    const msg = data?.error === 'sole_official' && data?.chama_name
      ? `You are the only official of ${data.chama_name}, which has other members. Hand over your role first.`
      : ERRORS[data?.error] || 'Could not delete your account.'
    return NextResponse.json({ error: msg, code: data?.error }, { status: 409 })
  }

  // Disable sign-in and free the email address. ~100 years is effectively permanent.
  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    email: `deleted+${user.id}@deleted.smartchama.invalid`,
    user_metadata: {},
    ban_duration: '876000h',
  })
  if (authError) {
    console.error('Disabling auth user failed:', user.id, authError)
    return NextResponse.json({ error: 'Your details were erased but sign-in could not be disabled. Contact support.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
