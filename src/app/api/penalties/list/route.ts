import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chama_id = searchParams.get('chama_id');
    const membership_id = searchParams.get('membership_id');

    if (!chama_id) {
      return NextResponse.json({ error: 'chama_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('member_penalties')
      .select(`
        *,
        chama_memberships (
          id, profile_id,
          profiles (full_name, phone_number, email)
        )
      `)
      .eq('chama_id', chama_id)
      .order('created_at', { ascending: false });

    if (membership_id) {
      query = query.eq('membership_id', membership_id);
    }

    const { data: penalties, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, penalties: penalties || [] });

  } catch (error: any) {
    console.error('List penalties error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
