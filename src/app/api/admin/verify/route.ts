import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireAuth(req);
    if (!user || authError) {
      return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ isAdmin: false }, { status: 400 })

    // Check chama_memberships for admin role
    const { data: memberships } = await supabaseAdmin
      .from('chama_memberships')
      .select('role, chama_id')
      .eq('profile_id', userId)
      .in('role', ['admin', 'chairlady', 'treasurer', 'secretary'])
      .eq('status', 'active')
      .limit(1)

    if (memberships && memberships.length > 0) {
      return NextResponse.json({ isAdmin: true, chamaId: memberships[0].chama_id })
    }

    // Fallback: check chama_admins
    const { data: adminRows } = await supabaseAdmin
      .from('chama_admins')
      .select('chama_id')
      .eq('admin_user_id', userId)
      .limit(1)

    if (adminRows && adminRows.length > 0) {
      return NextResponse.json({ isAdmin: true, chamaId: adminRows[0].chama_id })
    }

    return NextResponse.json({ isAdmin: false })
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
