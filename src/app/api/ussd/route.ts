import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const textBody = await req.text();
    const params = new URLSearchParams(textBody);
    
    const phoneNumber = params.get('phoneNumber') || '';
    const text = params.get('text') || '';
    
    let response = '';

    // Standardize phone format (e.g. +254XXXXXXXXX)
    let phone = phoneNumber.replace(/\s/g, '');
    if (!phone.startsWith('+')) {
      if (phone.startsWith('0')) {
        phone = '+254' + phone.slice(1);
      } else {
        phone = '+254' + phone;
      }
    }

    // Fast Materialized View indexed lookup
    const { data: summary } = await supabase
      .from('ussd_member_summary')
      .select('*')
      .eq('phone_number', phone)
      .single();

    if (!summary) {
      response = `END Phone number not registered to any active SmartChama group.`;
      return new NextResponse(response, { headers: { 'Content-Type': 'text/plain' } });
    }

    // Fetch profile_id to support admin actions and name parsing
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('phone_number', phone)
      .single();

    const firstName = profile?.full_name?.split(' ')[0] || 'Member';
    const parts = text.split('*');

    if (text === '') {
      response = `CON Welcome to SmartChama, ${firstName}
1. Check Balance
2. Make Contribution
3. Request Loan
4. Approve Loan (Admin)`;
    } 
    else if (parts[0] === '1') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('chama_id', summary.chama_id)
        .single();
        
      const balance = wallet?.balance || 0;
      response = `END Your group balance is KSh ${balance.toLocaleString()}.`;
    }
    else if (parts[0] === '2') {
      if (parts.length === 1) {
        response = `CON Enter contribution amount (KSh):`;
      } else {
        const amount = parts[1];
        response = `END Check your phone for the M-Pesa prompt to pay KSh ${amount} to ${summary.chama_name}.`;
        
        // Direct M-Pesa STK push trigger (asynchronous)
        (async () => {
          try {
            const numericAmount = Number(amount);
            if (isNaN(numericAmount) || numericAmount < 1) return;

            let formattedPhone = phone.replace(/\s/g, '');
            if (formattedPhone.startsWith('+254')) formattedPhone = '254' + formattedPhone.slice(4);
            else if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
            else if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

            const { data: pendingContribution } = await supabase
              .from('contributions_v2')
              .insert({
                membership_id: summary.membership_id,
                chama_id: summary.chama_id,
                amount: numericAmount,
                status: 'pending',
                payment_method: 'mpesa'
              })
              .select()
              .single();

            if (!pendingContribution) return;

            const auth = Buffer.from(
              `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
            ).toString('base64');
            const isSandbox = (process.env.MPESA_BUSINESS_SHORT_CODE === '174379');
            const safaricomBaseUrl = isSandbox ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';

            const tokenRes = await fetch(
              `${safaricomBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
              { headers: { 'Authorization': `Basic ${auth}` } }
            );
            const { access_token } = await tokenRes.json();
            if (!access_token) return;

            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
            const password = Buffer.from(
              `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
            ).toString('base64');

            const stkRes = await fetch(
              `${safaricomBaseUrl}/mpesa/stkpush/v1/processrequest`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
                  Password: password,
                  Timestamp: timestamp,
                  TransactionType: 'CustomerPayBillOnline',
                  Amount: numericAmount,
                  PartyA: formattedPhone,
                  PartyB: process.env.MPESA_BUSINESS_SHORT_CODE,
                  PhoneNumber: formattedPhone,
                  CallBackURL: process.env.MPESA_CALLBACK_URL,
                  AccountReference: summary.chama_name || 'SmartChama',
                  TransactionDesc: 'Chama Contribution'
                })
              }
            );

            const stkData = await stkRes.json();
            if (stkData.CheckoutRequestID) {
              await supabase
                .from('contributions_v2')
                .update({
                  mpesa_checkout_request_id: stkData.CheckoutRequestID,
                  mpesa_merchant_request_id: stkData.MerchantRequestID
                })
                .eq('id', pendingContribution.id);
            }
          } catch (stkErr) {
            console.error('USSD STK Trigger error:', stkErr);
          }
        })();
      }
    }
    else if (parts[0] === '3') {
      if (parts.length === 1) {
        response = `CON Enter amount to borrow (KSh):`;
      } else if (parts.length === 2) {
        response = `CON Enter duration in months:`;
      } else if (parts.length === 3) {
        const amount = parts[1];
        const duration = parts[2];
        
        await supabase.from('loans_v2').insert({
          chama_id: summary.chama_id,
          membership_id: summary.membership_id,
          amount: Number(amount),
          interest_rate: 1.0, // Default interest rate
          repayment_months: Number(duration),
          status: 'pending',
          due_date: new Date(Date.now() + Number(duration) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        
        response = `END Loan request for KSh ${amount} over ${duration} months submitted for approval.`;
      }
    }
    else if (parts[0] === '4') {
      // Check admin status
      const { data: membership } = await supabase
        .from('chama_memberships')
        .select('role')
        .eq('id', summary.membership_id)
        .single();

      const adminRoles = ['admin', 'chairlady', 'treasurer', 'secretary'];
      if (!membership || !adminRoles.includes(membership.role)) {
        response = `END You do not have permission to approve loans.`;
      } else {
        if (parts.length === 1) {
          const { data: pendingLoans } = await supabase
            .from('loans_v2')
            .select(`
              id, amount, 
              chama_memberships (
                profiles (
                  full_name
                )
              )
            `)
            .eq('chama_id', summary.chama_id)
            .eq('status', 'pending')
            .limit(3);
            
          if (!pendingLoans || pendingLoans.length === 0) {
            response = `END No pending loans.`;
          } else {
            let textRes = `CON Pending Loans:\n`;
            pendingLoans.forEach((l: any, index: number) => {
               const borrowerName = l.chama_memberships?.profiles?.full_name || 'Member';
               textRes += `${index + 1}. ${borrowerName} (KSh ${l.amount})\n`;
            });
            response = textRes;
          }
        } else {
          const loanIndex = Number(parts[1]) - 1;
          const { data: pendingLoans } = await supabase
            .from('loans_v2')
            .select('id, amount')
            .eq('chama_id', summary.chama_id)
            .eq('status', 'pending')
            .limit(3);
            
          if (pendingLoans && pendingLoans[loanIndex]) {
            const loanToApprove = pendingLoans[loanIndex];

            // Direct loan approval RPC call
            const { data: approveResult, error: approveErr } = await supabase.rpc('approve_loan_safe', {
              p_loan_id: loanToApprove.id,
              p_approved_by: profile?.id
            });

            if (!approveErr && approveResult?.success !== false) {
              response = `END Loan approved successfully.`;
            } else {
              response = `END Approval failed: ${approveResult?.error || approveErr?.message || 'Check balance'}`;
            }
          } else {
            response = `END Invalid loan selection.`;
          }
        }
      }
    }
    else {
      response = `END Invalid choice.`;
    }

    return new NextResponse(response, { headers: { 'Content-Type': 'text/plain' } });
  } catch (error) {
    console.error('USSD Error:', error);
    return new NextResponse('END System error. Please try again.', { headers: { 'Content-Type': 'text/plain' } });
  }
}
