import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { userId, fullName, email, chamaName, chamaId, role, inviteId } = await req.json()

    if (!userId || !fullName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Upsert profile — must exist before chama (FK constraint)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, full_name: fullName, email }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      // Profile might already exist — try update instead
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: fullName, email })
        .eq('id', userId)
    }

    // JOIN existing chama flow
    if (chamaId && !chamaName) {
      // Check not already a member
      const { data: existing } = await supabaseAdmin
        .from('chama_memberships')
        .select('id')
        .eq('profile_id', userId)
        .eq('chama_id', chamaId)
        .single()

      if (!existing) {
        await supabaseAdmin.from('chama_memberships').insert({
          profile_id: userId,
          chama_id: chamaId,
          role: role || 'member',
          trust_score: 0,
          status: 'active'
        })
      }

      // Mark invite as used
      if (inviteId) {
        await supabaseAdmin
          .from('invite_tokens')
          .update({ status: 'used', used_at: new Date().toISOString(), used_by: userId })
          .eq('id', inviteId)
      }

      return NextResponse.json({ success: true, chamaId })
    }

    // If no chama name — profile only
    if (!chamaName || !chamaName.trim()) {
      return NextResponse.json({ success: true })
    }

    // 2. Create new chama
    const { data: chamaData, error: chamaError } = await supabaseAdmin
      .from('chamas_v2')
      .insert({ name: chamaName, created_by: userId })
      .select('id')
      .single()

    if (chamaError || !chamaData) {
      console.error('Chama error:', chamaError)
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }

    // 3. chama_admins record (best effort)
    await supabaseAdmin.from('chama_admins').insert({
      chama_id: chamaData.id,
      admin_user_id: userId,
      full_name: fullName,
      email,
      role: 'admin'
    }).catch(() => {})

    // 4. Add membership
    const { error: memberError } = await supabaseAdmin
      .from('chama_memberships')
      .insert({
        profile_id: userId,
        chama_id: chamaData.id,
        role: 'admin',
        trust_score: 100,
        status: 'active'
      })

    if (memberError) {
      console.error('Membership error:', memberError)
      return NextResponse.json({ error: 'Failed to set up membership' }, { status: 500 })
    }

    return NextResponse.json({ chamaId: chamaData.id })

  } catch (err) {
    console.error('Create group error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
