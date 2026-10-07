import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
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
    
    // Find all active loans that are past due date
    const { data: overdueLoans, error: fetchError } = await supabase
      .from('loans_v2')
      .select('id, membership_id')
      .eq('status', 'active')
      .lt('due_date', new Date().toISOString());
      
    if (fetchError) {
      console.error("Fetch Overdue Loans Error:", fetchError);
      return NextResponse.json({ error: 'Failed to fetch overdue loans' }, { status: 500 });
    }
    
    if (!overdueLoans || overdueLoans.length === 0) {
      return NextResponse.json({ success: true, message: 'No overdue loans to process' });
    }
    
    const processedLoans = [];
    
    for (const loan of overdueLoans) {
      // 1. Mark loan as overdue
      const { error: updateLoanError } = await supabase
        .from('loans_v2')
        .update({ status: 'overdue' })
        .eq('id', loan.id);
        
      if (!updateLoanError) {
        processedLoans.push(loan.id);
        
        // 2. Deduct 20 points from borrower's trust score
        const { data: membership } = await supabase
          .from('chama_memberships')
          .select('trust_score')
          .eq('id', loan.membership_id)
          .maybeSingle();
          
        if (membership) {
          const currentScore = membership.trust_score || 100;
          const newScore = Math.max(0, currentScore - 20);
          
          await supabase
            .from('chama_memberships')
            .update({ trust_score: newScore })
            .eq('id', loan.membership_id);
        }
      }
    }
    
    return NextResponse.json({ success: true, processed: processedLoans.length });
  } catch (error: any) {
    console.error("Mark Defaulted Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
