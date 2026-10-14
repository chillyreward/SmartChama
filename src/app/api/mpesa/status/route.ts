import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { ADMIN_ROLES, getChamaMembership } from '@/lib/api-guard';

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
      .select('id, status, amount, mpesa_receipt, created_at, failed_reason, chama_id, chama_memberships(profile_id)')
      .eq('id', contributionId)
      .maybeSingle();

    // Only the member who paid, or an official of that group, may see it
    const payer = (data?.chama_memberships as any)?.profile_id;
    const allowed = data && (payer === user.id || (await getChamaMembership(supabase, user.id, data.chama_id, ADMIN_ROLES)));
    if (error || !data || !allowed) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status, // 'pending' | 'confirmed' | 'failed'
      amount: data.amount,
      receipt: data.mpesa_receipt,
      failedReason: data.failed_reason
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
