import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { claim_id, action } = body; // action = 'approve' | 'reject' | 'paid'

    if (!claim_id || !action || !['approve', 'reject', 'paid'].includes(action)) {
      return NextResponse.json({ error: 'claim_id and valid action (approve/reject/paid) are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: claim } = await supabase
      .from('welfare_claims')
      .select('*')
      .eq('id', claim_id)
      .single();

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Verify admin membership
    const { data: adminMembership } = await supabase
      .from('chama_memberships')
      .select('id')
      .eq('profile_id', user.id)
      .eq('chama_id', claim.chama_id)
      .eq('status', 'active')
      .in('role', ['admin', 'chairlady', 'treasurer', 'secretary'])
      .maybeSingle();

    if (!adminMembership) {
      return NextResponse.json({ error: 'Only Chama admins can review welfare claims' }, { status: 403 });
    }

    if (claim.membership_id === adminMembership.id) {
      return NextResponse.json({ error: 'You cannot review your own claim' }, { status: 403 });
    }

    // pending -> approved | rejected ; approved -> paid
    const allowedFrom: Record<string, string> = { approve: 'pending', reject: 'pending', paid: 'approved' };
    if (claim.status !== allowedFrom[action]) {
      return NextResponse.json({ error: `A ${claim.status} claim can't be marked ${action}` }, { status: 400 });
    }

    if (action === 'paid') {
      const { data: fundCheck } = await supabase
        .from('welfare_fund')
        .select('balance')
        .eq('chama_id', claim.chama_id)
        .maybeSingle();
      if (!fundCheck || Number(fundCheck.balance) < Number(claim.amount)) {
        return NextResponse.json({ error: 'Insufficient welfare fund balance' }, { status: 400 });
      }
    }

    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'paid';

    const { data: updatedClaim, error } = await supabase
      .from('welfare_claims')
      .update({
        status: newStatus,
        approved_by: adminMembership.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', claim_id)
      .eq('status', claim.status)
      .select()
      .single();

    if (error) {
      console.error('Approve welfare claim error:', error);
      return NextResponse.json({ error: 'Claim was changed by someone else. Refresh and try again.' }, { status: 409 });
    }

    // If paid out, deduct claim amount from welfare fund
    if (action === 'paid') {
      const { data: fund } = await supabase
        .from('welfare_fund')
        .select('balance')
        .eq('chama_id', claim.chama_id)
        .maybeSingle();

      if (fund) {
        const newBalance = Math.max(0, Number(fund.balance || 0) - Number(claim.amount || 0));
        await supabase
          .from('welfare_fund')
          .update({ balance: newBalance })
          .eq('chama_id', claim.chama_id);
      }
    }

    return NextResponse.json({ success: true, claim: updatedClaim });

  } catch (error: any) {
    console.error('Approve welfare claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
