import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';
import { ADMIN_ROLES, getChamaMembership } from '@/lib/api-guard';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chama_id, membership_id, amount, reason, description } = body;

    if (!chama_id || !membership_id || !amount || !reason) {
      return NextResponse.json({ error: 'Missing required fields: chama_id, membership_id, amount, reason' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // A member claims for themselves; an official may file on a member's behalf
    const { data: claimant } = await supabase
      .from('chama_memberships')
      .select('id, profile_id')
      .eq('id', membership_id)
      .eq('chama_id', chama_id)
      .eq('status', 'active')
      .maybeSingle();
    if (!claimant) {
      return NextResponse.json({ error: 'Member is not in this chama' }, { status: 400 });
    }
    if (claimant.profile_id !== user.id && !(await getChamaMembership(supabase, user.id, chama_id, ADMIN_ROLES))) {
      return NextResponse.json({ error: 'You can only claim for yourself' }, { status: 403 });
    }

    const claimAmount = Number(amount);
    const { data: fund } = await supabase
      .from('welfare_fund')
      .select('max_claim_amount')
      .eq('chama_id', chama_id)
      .maybeSingle();
    const maxClaim = Number(fund?.max_claim_amount ?? 50000);
    if (!(claimAmount > 0) || claimAmount > maxClaim) {
      return NextResponse.json({ error: `Claims must be between KSh 1 and KSh ${maxClaim.toLocaleString()}` }, { status: 400 });
    }

    const { data: claim, error } = await supabase
      .from('welfare_claims')
      .insert({
        chama_id,
        membership_id,
        amount: claimAmount,
        reason,
        description: description ? String(description).slice(0, 1000) : null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Submit welfare claim error:', error);
      return NextResponse.json({ error: 'Could not submit claim' }, { status: 500 });
    }

    return NextResponse.json({ success: true, claim });

  } catch (error: any) {
    console.error('Submit welfare claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
