import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { loanId, adminId } = await request.json();
    
    if (!loanId || !adminId) {
      return NextResponse.json({ error: 'Missing loanId or adminId' }, { status: 400 });
    }

    // Fetch loan details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*, members(phone, full_name), chamas(name)')
      .eq('id', loanId)
      .single();

    if (loanError || !loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    if (loan.status !== 'pending') {
      return NextResponse.json({ error: 'Loan is not in pending state' }, { status: 400 });
    }

    // 1. Update loan status
    await supabaseAdmin.from('loans')
      .update({ 
        status: 'active',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', loanId);

    // 2. Deduct from wallet
    await supabaseAdmin.rpc('decrement_wallet_balance', {
      p_chama_id: loan.chama_id,
      p_amount: loan.amount
    });

    // 3. Create transaction record
    const { data: tx } = await supabaseAdmin.from('transactions').insert({
      group_id: loan.chama_id,
      member_id: loan.member_id,
      transaction_type: 'loan_disbursement',
      amount: -loan.amount,
      description: `Loan disbursement LOAN-${loan.id}`,
      status: 'completed',
      transaction_date: new Date().toISOString()
    }).select().single();

    // 4. Write to blockchain
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const blockchainResult = await fetch(`${appUrl}/api/blockchain/record`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'LOAN_DISBURSEMENT',
        member_id: loan.member_id,
        chama_id: loan.chama_id,
        amount: loan.amount,
        timestamp: new Date().toISOString()
      })
    });
    const { tx_hash } = await blockchainResult.json();

    if (tx_hash && tx) {
      await supabaseAdmin.from('transactions')
        .update({ blockchain_tx_hash: tx_hash })
        .eq('id', tx.id);
    }

    // 5. Send SMS to member
    if (loan.members?.phone) {
      const formattedPhone = loan.members.phone.startsWith('254') ? `+${loan.members.phone}` : loan.members.phone;
      await fetch(`${appUrl}/api/sms/send`, {
        method: 'POST',
        body: JSON.stringify({
          phone: formattedPhone,
          message: `SmartChama: Your loan of KSh ${loan.amount} from ${loan.chamas?.name || 'your group'} has been approved and will be disbursed shortly. Repayment due: ${loan.due_date || 'soon'}`
        })
      });
    }

    // 6. Recalculate trust score
    await fetch(`${appUrl}/api/trust-score/calculate`, {
      method: 'POST',
      body: JSON.stringify({ member_id: loan.member_id })
    });

    return NextResponse.json({ success: true, message: 'Loan approved and chain executed' });
  } catch (error: any) {
    console.error("Loan approval error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
