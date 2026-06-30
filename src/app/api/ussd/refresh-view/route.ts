import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc('refresh_ussd_summary');
    if (error) throw error;

    return Response.json({ refreshed: true });
  } catch (error: any) {
    console.error('Refresh materialized view error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
