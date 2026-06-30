import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { loanId, adminId } = await request.json();
    
    if (!loanId || !adminId) {
      return NextResponse.json({ error: 'Missing loanId or adminId' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch loan details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans_v2')
      .select('*, chama_memberships(membership_id:id, profiles(phone_number, full_name)), chamas_v2(name)')
      .eq('id', loanId)
      .single();

    if (loanError || !loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    if (loan.status !== 'pending') {
      return NextResponse.json({ error: 'Loan is not in pending state' }, { status: 400 });
    }

    // Call postgres safe loan approval
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      'approve_loan_safe',
      {
        p_loan_id: loanId,
        p_chama_id: loan.chama_id,
        p_amount: loan.amount,
        p_admin_id: adminId
      }
    );

    if (rpcError || !result || !result.success) {
      return NextResponse.json(
        { error: rpcError?.message || result?.error || 'Could not approve loan.' },
        { status: 400 }
      );
    }

    // Post-approval operations (Blockchain, SMS, Trust-score recalculation)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // 1. Record on Blockchain
    try {
      const blockchainResult = await fetch(`${appUrl}/api/blockchain/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOAN_DISBURSEMENT',
          member_id: loan.chama_memberships?.membership_id,
          chama_id: loan.chama_id,
          amount: loan.amount,
          timestamp: new Date().toISOString()
        })
      });
      const { tx_hash } = await blockchainResult.json();
      if (tx_hash) {
        await supabaseAdmin.from('transactions_v2')
          .update({ blockchain_tx_hash: tx_hash })
          .eq('chama_id', loan.chama_id)
          .eq('type', 'loan_disbursement')
          .order('created_at', { ascending: false })
          .limit(1);
      }
    } catch (e) {
      console.error('Blockchain log error:', e);
    }

    // 2. Send SMS
    const phone = loan.chama_memberships?.profiles?.phone_number;
    const groupName = loan.chamas_v2?.name || 'your group';
    if (phone) {
      try {
        await fetch(`${appUrl}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            message: `SmartChama: Your loan of KSh ${loan.amount} from ${groupName} has been approved and will be disbursed shortly.`
          })
        });
      } catch (e) {
        console.error('SMS sending error:', e);
      }
    }

    // 3. Recalculate trust score
    try {
      await fetch(`${appUrl}/api/trust-score/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership_id: loan.chama_memberships?.membership_id })
      });
    } catch (e) {
      console.error('Trust score calculation error:', e);
    }

    return NextResponse.json({ success: true, message: 'Loan approved successfully' });
  } catch (error: any) {
    console.error("Loan approval error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
