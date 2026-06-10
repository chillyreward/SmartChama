import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { member_id } = await request.json();
    
    // Fetch all member data
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('*, chamas(*)')
      .eq('id', member_id)
      .single();
      
    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    const { data: contributions } = await supabaseAdmin
      .from('contributions')
      .select('amount, status, created_at')
      .eq('member_id', member_id) || { data: [] };
    
    const { data: loans } = await supabaseAdmin
      .from('loans')
      .select('amount, status, due_date')
      .eq('member_id', member_id) || { data: [] };
    
    // Calculate months active
    const joinDate = new Date(member.created_at || new Date());
    const now = new Date();
    const monthsActive = Math.max(1,
      (now.getFullYear() - joinDate.getFullYear()) * 12 +
      (now.getMonth() - joinDate.getMonth())
    );
    
    // Contribution score (40%)
    const confirmed = (contributions || []).filter(c => c.status === 'confirmed').length;
    const onTimeRate = confirmed / monthsActive;
    const contributionScore = Math.min(onTimeRate, 1) * 40;
    
    // Repayment score (30%)
    const totalLoans = (loans || []).length;
    const repaidLoans = (loans || []).filter(l => l.status === 'repaid').length;
    const repaymentRate = totalLoans > 0 ? repaidLoans / totalLoans : 1;
    const repaymentScore = repaymentRate * 30;
    
    // Tenure score (20%)
    const tenureScore = Math.min(monthsActive / 24, 1) * 20;
    
    // Participation score (10%)
    const participationScore = Math.min(confirmed / monthsActive, 1) * 10;
    
    // Final score
    const trustScore = Math.round(
      contributionScore + 
      repaymentScore + 
      tenureScore + 
      participationScore
    );
    
    // Calculate streak
    let streak = 0;
    const sortedContributions = (contributions || [])
      .filter(c => c.status === 'confirmed')
      .sort((a, b) => 
        new Date(b.created_at).getTime() - 
        new Date(a.created_at).getTime()
      );
    
    for (let i = 0; i < sortedContributions.length; i++) {
      const contribMonth = new Date(sortedContributions[i].created_at).getMonth();
      const expectedMonth = (now.getMonth() - i + 12) % 12;
      if (contribMonth === expectedMonth) {
        streak++;
      } else break;
    }
    
    // Save to database
    await supabaseAdmin.from('members')
      .update({ 
        trust_score: trustScore,
        contribution_streak: streak,
        last_score_update: new Date().toISOString()
      })
      .eq('id', member_id);
    
    return NextResponse.json({ 
      trust_score: trustScore,
      streak,
      breakdown: {
        contribution: contributionScore,
        repayment: repaymentScore,
        tenure: tenureScore,
        participation: participationScore
      }
    });
  } catch (err: any) {
    console.error("Trust score calculation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
