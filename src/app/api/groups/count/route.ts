import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

// Created lazily (on first request), so builds don't need the service key
const getAdmin = () => getSupabaseAdmin()

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count, error } = await getAdmin()
      .from('chamas_v2')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching groups count:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
