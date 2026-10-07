import { forbidden, isInternalRequest } from '@/lib/api-guard';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  // Server-to-server / cron only: no user calls this directly
  if (!isInternalRequest(request)) return forbidden();

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
