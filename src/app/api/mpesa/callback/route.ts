import { NextResponse } from 'next/server';
import { processMpesaCallback } from '@/lib/mpesa';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const callbackData = await req.json();
    
    console.log('M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2));

    // Process the callback
    const result = processMpesaCallback(callbackData);

    if (result.success) {
      // Payment successful - Save to database
      console.log('Payment Successful:', result);

      // Parse transaction date (format: 20260213011719 -> 2026-02-13T01:17:19)
      const dateStr = result.transactionDate.toString();
      const formattedDate = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}T${dateStr.slice(8,10)}:${dateStr.slice(10,12)}:${dateStr.slice(12,14)}`;

      // Save transaction to database
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          transaction_type: 'deposit',
          amount: result.amount,
          phone_number: result.phoneNumber.toString(),
          mpesa_receipt_number: result.mpesaReceiptNumber,
          merchant_request_id: result.merchantRequestID,
          checkout_request_id: result.checkoutRequestID,
          transaction_date: formattedDate,
          description: 'M-Pesa Deposit',
          status: 'completed',
        })
        .select()
        .single();

      if (error) {
        console.error('Database Error:', error);
      } else {
        console.log('Transaction saved to database:', transaction);
        
        // Lookup member using phone number to get chama_id
        const cleanPhone = result.phoneNumber.toString();
        const formattedPhone = cleanPhone.startsWith('254') ? `+${cleanPhone}` : cleanPhone;
        
        const { data: member } = await supabaseAdmin
          .from('members')
          .select('id, chama_id, chamas(name)')
          .eq('phone', formattedPhone)
          .single();
          
        if (member && member.chama_id) {
          try {
            // 1. UPDATE WALLET BALANCE
            await supabaseAdmin.rpc('increment_wallet_balance', {
              p_chama_id: member.chama_id,
              p_amount: result.amount
            });
            
            // 2. WRITE TO BLOCKCHAIN
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const blockchainResult = await fetch(`${appUrl}/api/blockchain/record`, {
              method: 'POST',
              body: JSON.stringify({
                type: 'CONTRIBUTION',
                member_id: member.id,
                chama_id: member.chama_id,
                amount: result.amount,
                mpesa_receipt: result.mpesaReceiptNumber,
                timestamp: new Date().toISOString()
              })
            });
            const { tx_hash } = await blockchainResult.json();
            
            // 3. SAVE TX HASH TO DATABASE
            if (tx_hash) {
              await supabaseAdmin.from('transactions')
                .update({ blockchain_tx_hash: tx_hash })
                .eq('id', transaction.id);
            }
            
            // 4. RECALCULATE TRUST SCORE
            await fetch(`${appUrl}/api/trust-score/calculate`, {
              method: 'POST',
              body: JSON.stringify({ member_id: member.id })
            });
            
            // 5. SEND SMS
            await fetch(`${appUrl}/api/sms/send`, {
              method: 'POST',
              body: JSON.stringify({
                phone: formattedPhone,
                message: `SmartChama: Your KSh ${result.amount} contribution to ${(Array.isArray(member.chamas) ? member.chamas[0]?.name : member.chamas?.name) || 'your group'} is confirmed. Receipt: ${result.mpesaReceiptNumber}.`
              })
            });
          } catch (chainErr) {
            console.error("Error executing callback chain:", chainErr);
          }
        }
      }

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Success',
      });
    } else {
      // Payment failed
      console.log('Payment Failed:', result);

      // Save failed transaction
      await supabaseAdmin
        .from('transactions')
        .insert({
          transaction_type: 'deposit',
          merchant_request_id: result.merchantRequestID,
          checkout_request_id: result.checkoutRequestID,
          description: result.resultDesc || 'Payment failed',
          status: 'failed',
        });

      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: 'Failed',
      });
    }
  } catch (error: any) {
    console.error('Callback Error:', error);
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Error processing callback' },
      { status: 500 }
    );
  }
}
