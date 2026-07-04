import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { user_id, full_name, phone_number, email, county, national_id } = await req.json()

    if (!user_id || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: user_id, 
        full_name, 
        phone_number: phone_number || null, 
        email: email || '',
        county: county || null,
        national_id: national_id || null
      }, { onConflict: 'id' })

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
