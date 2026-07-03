import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Find all active loans that are past due date
    const { data: overdueLoans, error: fetchError } = await supabase
      .from('loans')
      .select('id, borrower_id')
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
        .from('loans')
        .update({ status: 'overdue' })
        .eq('id', loan.id);
        
      if (!updateLoanError) {
        processedLoans.push(loan.id);
        
        // 2. Deduct 20 points from borrower's CREDIT SCORE
        const { data: profile } = await supabase
          .from('profiles')
          .select('trust_score')
          .eq('id', loan.borrower_id)
          .single();
          
        if (profile) {
          const currentScore = profile.trust_score || 100; // Assuming starting score is 100
          const newScore = Math.max(0, currentScore - 20); // Floor at 0
          
          await supabase
            .from('profiles')
            .update({ trust_score: newScore })
            .eq('id', loan.borrower_id);
            
          // If we are still using members table as source of truth for legacy UI
          // also update the members table (borrower_id links to user_id or id depending on schema, usually we'd update members.trust_score where id = borrower_id if it's the old schema)
          await supabase
            .from('members')
            .update({ trust_score: newScore })
            .eq('id', loan.borrower_id) // This assumes borrower_id maps to member.id in old schema
            .or(`user_id.eq.${loan.borrower_id}`); // fallback just in case
        }
      }
    }
    
    return NextResponse.json({ success: true, processed: processedLoans.length });
  } catch (error: any) {
    console.error("Mark Defaulted Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
