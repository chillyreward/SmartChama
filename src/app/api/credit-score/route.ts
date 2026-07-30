import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';
import { calculateMemberCreditScore, calculateChamaCreditScore } from '@/lib/credit-scoring';

export async function GET(req: Request) {
  try {
    const { user, error: authError } = await requireAuth(req);
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'member' or 'chama'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: 'Type and ID are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (type === 'member') {
      const { data: member, error: memberError } = await supabase
        .from('chama_memberships')
        .select('*, profiles(full_name, created_at)')
        .eq('id', id)
        .maybeSingle();

      if (memberError || !member) {
        return NextResponse.json(
          { success: false, error: 'Member not found' },
          { status: 404 }
        );
      }

      const { data: transactions } = await supabase
        .from('transactions_v2')
        .select('*')
        .eq('membership_id', id)
        .order('created_at', { ascending: false });

      const totalContributions = (transactions || [])
        .filter(t => t.type === 'contribution' && t.status === 'confirmed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const loans = (transactions || []).filter(t => t.type === 'loan');
      const missedPayments = (transactions || []).filter(t => t.status === 'failed').length;

      const joinedDate = new Date(member.created_at || Date.now());
      const monthsSinceJoining = Math.floor(
        (Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const expectedPayments = Math.max(1, monthsSinceJoining);

      const creditScore = calculateMemberCreditScore({
        memberId: member.id,
        memberName: (member.profiles as any)?.full_name || 'Member',
        joinedDate: member.created_at,
        transactions: transactions || [],
        loans,
        totalContributions,
        missedPayments,
        expectedPayments
      });

      return NextResponse.json({
        success: true,
        creditScore
      });

    } else if (type === 'chama') {
      const { data: chama, error: chamaError } = await supabase
        .from('chamas_v2')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (chamaError || !chama) {
        return NextResponse.json(
          { success: false, error: 'Chama not found' },
          { status: 404 }
        );
      }

      const { data: members } = await supabase
        .from('chama_memberships')
        .select('*')
        .eq('chama_id', id);

      const { data: transactions } = await supabase
        .from('transactions_v2')
        .select('*')
        .eq('chama_id', id)
        .order('created_at', { ascending: false });

      const totalSavings = (transactions || [])
        .filter(t => t.status === 'confirmed')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const activeMemberIds = new Set(
        (transactions || [])
          .filter(t => new Date(t.created_at) > threeMonthsAgo)
          .map(t => t.membership_id)
      );

      const activeMembers = activeMemberIds.size;
      const totalMembers = (members || []).length;

      const membersWithScores = (members || []).map(m => ({
        ...m,
        creditScore: m.trust_score || 650
      }));

      const creditScore = calculateChamaCreditScore({
        chamaId: chama.id,
        chamaName: chama.name,
        createdDate: chama.created_at,
        members: membersWithScores,
        transactions: transactions || [],
        totalSavings,
        activeMembers,
        totalMembers
      });

      return NextResponse.json({
        success: true,
        creditScore
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Use "member" or "chama"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Credit score calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
