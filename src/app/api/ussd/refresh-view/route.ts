import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc('refresh_ussd_summary');
    if (error) throw error;

    return NextResponse.json({ refreshed: true });
  } catch (error: any) {
    console.error('Refresh materialized view error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
