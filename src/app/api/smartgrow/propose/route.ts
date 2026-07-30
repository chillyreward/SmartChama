import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chama_id, product_id } = await request.json();

    if (!chama_id || !product_id) {
      return NextResponse.json({ error: 'Missing required fields: chama_id, product_id' }, { status: 400 });
    }

    const proposed_by = user.id;
    const supabase = getSupabaseAdmin();
    
    // Check if there is already an active vote for this product in this chama
    const { data: existing } = await supabase
      .from('smartgrow_votes')
      .select('id')
      .eq('chama_id', chama_id)
      .eq('smartgrow_product_id', product_id)
      .eq('status', 'active')
      .maybeSingle();
      
    if (existing) {
      return NextResponse.json({ error: 'An active vote for this product already exists' }, { status: 400 });
    }
    
    // Create new vote, expiring in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('smartgrow_votes')
      .insert({
        chama_id,
        smartgrow_product_id: product_id,
        proposed_by,
        yes_votes: [],
        no_votes: [],
        expires_at: expiresAt,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error("Propose Error:", error);
      return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, proposal: data });
  } catch (error: any) {
    console.error("Propose Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
