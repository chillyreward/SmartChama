import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  const { 
    email, 
    name, 
    chama_id, 
    invited_by 
  } = await request.json()

  if (!email || !chama_id) {
    return Response.json(
      { error: 'Email and chama_id are required.' },
      { status: 400 }
    )
  }

  // Get chama details for the email
  const { data: chama } = await supabase
    .from('chamas_v2')
    .select('name')
    .eq('id', chama_id)
    .single()

  // Get inviting admin's name
  const { data: admin } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', invited_by)
    .single()

  // Generate a simple invite code that is also stored as token
  const inviteCode = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()

  // Save invite record using actual database columns
  const { error: tokenError } = await supabase
    .from('invite_tokens')
    .insert({
      token: inviteCode,
      chama_id,
      created_by: invited_by,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      max_uses: 1,
      is_active: true
    })

  if (tokenError) {
    console.error('Save invite token failed:', tokenError)
    return Response.json(
      { error: 'Could not save invite.' },
      { status: 500 }
    )
  }

  // Send invite email via Supabase Admin (uses configured SMTP or Supabase's built-in email)
  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?token=${inviteCode}&email=${encodeURIComponent(email)}`

  // Use Supabase's built-in invite email system
  const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: name || '',
      chama_name: chama?.name || '',
      inviter_name: admin?.full_name || 'Your admin',
      invite_code: inviteCode,
      chama_id
    },
    redirectTo: signupUrl
  })

  if (emailError) {
    // If Supabase invite fails, the token is still saved.
    // Admin can share the code manually as fallback.
    console.error('Email send failed:', emailError)
    return Response.json({
      success: true,
      code: inviteCode,
      email_sent: false,
      note: 'Invite saved but email delivery failed. Share the code manually.'
    })
  }

  return Response.json({ 
    success: true, 
    code: inviteCode,
    email_sent: true
  })
}
