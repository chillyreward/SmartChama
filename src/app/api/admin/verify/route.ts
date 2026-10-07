import { forbidden, isInternalRequest } from '@/lib/api-guard';
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/api-auth'

// Created lazily (on first request), so builds don't need the service key
const getAdmin = () => getSupabaseAdmin()

export async function POST(req: Request) {
  // Server-to-server / cron only: no user calls this directly
  if (!isInternalRequest(req)) return forbidden();

  try {
    const { user, error: authError } = await requireAuth(req);
    if (!user || authError) {
      return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ isAdmin: false }, { status: 400 })

    // Check chama_memberships for admin role
    const { data: memberships } = await getAdmin()
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
    const { data: adminRows } = await getAdmin()
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
