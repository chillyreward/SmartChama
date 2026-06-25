import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { vote_id, profile_id, vote } = await request.json();

    if (!vote_id || !profile_id || (vote !== 'yes' && vote !== 'no')) {
      return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 400 });
    }
    
    const supabase = getSupabaseAdmin();
    
    // Fetch current vote
    const { data: proposal, error: fetchError } = await supabase
      .from('smartgrow_votes')
      .select('*')
      .eq('id', vote_id)
      .single();
      
    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    
    if (proposal.status !== 'active') {
      return NextResponse.json({ error: 'This proposal is no longer active' }, { status: 400 });
    }
    
    if (new Date(proposal.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Voting period has expired' }, { status: 400 });
    }
    
    // Check if user already voted
    const yesVotes = proposal.yes_votes || [];
    const noVotes = proposal.no_votes || [];
    
    if (yesVotes.includes(profile_id) || noVotes.includes(profile_id)) {
      return NextResponse.json({ error: 'You have already voted' }, { status: 400 });
    }
    
    // Append vote
    let updateData = {};
    if (vote === 'yes') {
      updateData = { yes_votes: [...yesVotes, profile_id] };
    } else {
      updateData = { no_votes: [...noVotes, profile_id] };
    }
    
    const { data, error } = await supabase
      .from('smartgrow_votes')
      .update(updateData)
      .eq('id', vote_id)
      .select()
      .single();

    if (error) {
      console.error("Vote Error:", error);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, proposal: data });
  } catch (error: any) {
    console.error("Vote Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
