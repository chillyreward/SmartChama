import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordTransactionOnBlockchain } from '@/lib/blockchain';

// Use service role key to bypass RLS for fetching all transactions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`Fetched ${transactions?.length || 0} transactions`);

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chamaId, memberId, amount, type, description } = body;

    if (!chamaId || !memberId || !amount || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transaction in database
    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        chama_id: chamaId,
        member_id: memberId,
        amount,
        type,
        description: description || `${type} transaction`,
        status: 'completed',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: dbError.message },
        { status: 500 }
      );
    }

    // Record on blockchain (async, don't wait)
    recordTransactionOnBlockchain({
      chamaId,
      memberId,
      amount,
      type,
      timestamp: Date.now(),
    })
      .then(async (blockchainData) => {
        if (blockchainData) {
          // Update transaction with blockchain data
          await supabaseAdmin
            .from('transactions')
            .update({
              blockchain_hash: blockchainData.hash,
              blockchain_explorer_url: blockchainData.explorerUrl,
              blockchain_qr_code: blockchainData.qrCode,
              blockchain_verified: true,
            })
            .eq('id', transaction.id);

          console.log('Transaction recorded on blockchain:', blockchainData.hash);
        }
      })
      .catch((error) => {
        console.error('Blockchain recording failed:', error);
        // Don't fail the transaction if blockchain fails
      });

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction created successfully',
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
