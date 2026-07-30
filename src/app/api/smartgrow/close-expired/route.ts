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
    
    // Find all expired active votes
    const { data: expiredVotes, error: fetchError } = await supabase
      .from('smartgrow_votes')
      .select('*')
      .eq('status', 'active')
      .lte('expires_at', new Date().toISOString());
      
    if (fetchError) {
      console.error("Fetch Expired Votes Error:", fetchError);
      return NextResponse.json({ error: 'Failed to fetch expired votes' }, { status: 500 });
    }
    
    if (!expiredVotes || expiredVotes.length === 0) {
      return NextResponse.json({ success: true, message: 'No expired votes to process' });
    }
    
    const processed = [];
    
    for (const vote of expiredVotes) {
      const yesCount = vote.yes_votes ? vote.yes_votes.length : 0;
      const noCount = vote.no_votes ? vote.no_votes.length : 0;
      
      const newStatus = yesCount > noCount ? 'approved' : 'rejected';
      
      const { error: updateError } = await supabase
        .from('smartgrow_votes')
        .update({ status: newStatus })
        .eq('id', vote.id);
        
      if (!updateError) {
        processed.push({ id: vote.id, status: newStatus });
      }
    }
    
    return NextResponse.json({ success: true, processed });
  } catch (error: any) {
    console.error("Close Expired Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
