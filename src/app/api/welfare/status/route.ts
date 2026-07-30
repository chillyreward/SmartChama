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

    if (!chama_id) {
      return NextResponse.json({ error: 'chama_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch Welfare Fund balance or initialize if missing
    let { data: fund } = await supabase
      .from('welfare_fund')
      .select('*')
      .eq('chama_id', chama_id)
      .maybeSingle();

    if (!fund) {
      const { data: newFund } = await supabase
        .from('welfare_fund')
        .insert({
          chama_id,
          balance: 0,
          monthly_contribution: 500,
          max_claim_amount: 50000
        })
        .select()
        .single();
      fund = newFund;
    }

    // 2. Fetch Welfare Claims list
    const { data: claims } = await supabase
      .from('welfare_claims')
      .select(`
        *,
        chama_memberships (
          id, profile_id,
          profiles (full_name, phone_number, email)
        )
      `)
      .eq('chama_id', chama_id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      fund: fund || { balance: 0, monthly_contribution: 500, max_claim_amount: 50000 },
      claims: claims || []
    });

  } catch (error: any) {
    console.error('Welfare status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
