import { NextResponse } from 'next/server'
import { requireUser, formatKenyanPhone } from '@/lib/require-user'

import { saveNationalId } from '@/lib/private-profile'
export async function POST(req: Request) {
  try {
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { user, supabase } = auth

    const { full_name, phone_number, county, national_id } = await req.json()

    if (!full_name || !String(full_name).trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Only overwrite optional fields the caller actually sent, so a partial update
    // (e.g. name only) doesn't wipe a phone number saved earlier.
    const row: Record<string, unknown> = {
      id: user.id,
      full_name: String(full_name).trim(),
      email: user.email ?? null,
    }
    // Phone numbers are added only through SMS verification (/api/phone/*)
    if (county !== undefined) row.county = county || null

    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' })

    if (error) {
      console.error('Profile update error:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'That phone number is already linked to another account.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (national_id !== undefined) {
      const { error: idError } = await saveNationalId(supabase, user.id, national_id)
      if (idError) {
        console.error('National ID save error:', idError)
        return NextResponse.json({ error: 'Could not save your ID number.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
