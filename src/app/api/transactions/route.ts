import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';
import { recordTransactionOnBlockchain } from '@/lib/blockchain';

export async function GET(req: Request) {
  try {
    const { user, error: authError } = await requireAuth(req);
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Get user's memberships to ensure they can only query transactions for chamas they belong to
    const { data: memberships } = await supabaseAdmin
      .from('chama_memberships')
      .select('id, chama_id')
      .eq('profile_id', user.id)
      .eq('status', 'active');

    const chamaIds = memberships?.map(m => m.chama_id) || [];
    const membershipIds = memberships?.map(m => m.id) || [];

    if (chamaIds.length === 0 && membershipIds.length === 0) {
      return NextResponse.json({ success: true, transactions: [] });
    }

    // Query transactions for user's chamas
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions_v2')
      .select('*')
      .in('chama_id', chamaIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
    });
  } catch (error: any) {
    console.error('Transactions GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireAuth(req);
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { chamaId, memberId, amount, type, description } = body;

    if (!chamaId || !amount || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: chamaId, amount, type' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify user belongs to this Chama
    const { data: membership } = await supabaseAdmin
      .from('chama_memberships')
      .select('id, role')
      .eq('profile_id', user.id)
      .eq('chama_id', chamaId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ success: false, error: 'You are not a member of this Chama' }, { status: 403 });
    }

    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('transactions_v2')
      .insert({
        chama_id: chamaId,
        membership_id: membership.id,
        amount: Number(amount),
        type,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction created successfully',
    });
  } catch (error: any) {
    console.error('Transactions POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
