import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateMemberCreditScore, calculateChamaCreditScore } from '@/lib/credit-scoring';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'member' or 'chama'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: 'Type and ID are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (type === 'member') {
      // Fetch member data
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (memberError || !member) {
        return NextResponse.json(
          { success: false, error: 'Member not found' },
          { status: 404 }
        );
      }

      // Fetch member transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', id)
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error fetching transactions:', txError);
      }

      // Calculate total contributions
      const totalContributions = (transactions || [])
        .filter(t => t.transaction_type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Get loans
      const loans = (transactions || []).filter(t => t.transaction_type === 'loan');

      // Calculate missed payments (simplified - you may want to enhance this)
      const missedPayments = (transactions || [])
        .filter(t => t.status === 'failed' || t.status === 'defaulted')
        .length;

      // Expected payments (simplified - based on months since joining)
      const joinedDate = new Date(member.created_at);
      const now = new Date();
      const monthsSinceJoining = Math.floor(
        (now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const expectedPayments = Math.max(1, monthsSinceJoining);

      const creditScore = calculateMemberCreditScore({
        memberId: member.id,
        memberName: member.full_name,
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
      // Fetch chama data
      const { data: chama, error: chamaError } = await supabase
        .from('chamas')
        .select('*')
        .eq('id', id)
        .single();

      if (chamaError || !chama) {
        return NextResponse.json(
          { success: false, error: 'Chama not found' },
          { status: 404 }
        );
      }

      // Fetch all members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('chama_id', id);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }

      // Fetch all transactions for this chama
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('chama_id', id)
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error fetching transactions:', txError);
      }

      // Calculate total savings
      const totalSavings = (transactions || [])
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => {
          const amount = parseFloat(t.amount);
          if (t.transaction_type === 'deposit' || t.transaction_type === 'repayment') {
            return sum + amount;
          } else if (t.transaction_type === 'withdrawal' || t.transaction_type === 'loan') {
            return sum - amount;
          }
          return sum;
        }, 0);

      // Count active members (members with transactions in last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const activeMemberIds = new Set(
        (transactions || [])
          .filter(t => new Date(t.created_at) > threeMonthsAgo)
          .map(t => t.member_id)
      );

      const activeMembers = activeMemberIds.size;
      const totalMembers = (members || []).length;

      // Calculate member credit scores (simplified - just use a default for now)
      const membersWithScores = (members || []).map(m => ({
        ...m,
        creditScore: 650 // Default score - in production, calculate for each member
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
