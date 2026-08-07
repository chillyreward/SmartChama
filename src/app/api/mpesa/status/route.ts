import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contributionId = searchParams.get('contribution_id');

    if (!contributionId) {
      return NextResponse.json({ error: 'Missing contribution_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('contributions_v2')
      .select('id, status, amount, mpesa_receipt_number, created_at, failed_reason')
      .eq('id', contributionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status, // 'pending' | 'confirmed' | 'failed'
      amount: data.amount,
      receipt: data.mpesa_receipt_number,
      failedReason: data.failed_reason
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
