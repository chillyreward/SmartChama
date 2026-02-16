import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Africa's Talking sends these parameters
    const sessionId = formData.get("sessionId")?.toString() || "";
    const serviceCode = formData.get("serviceCode")?.toString() || "";
    const phoneNumber = formData.get("phoneNumber")?.toString() || "";
    const text = formData.get("text")?.toString().trim() || "";

    console.log("📱 USSD Request:", { sessionId, serviceCode, phoneNumber, text });

    let response = "";

    // Normalize phone number (remove + if present)
    const normalizedPhone = phoneNumber.replace(/^\+/, '');

    // Main Menu (first interaction)
    if (text === "") {
      response = `CON Welcome to SmartChama 🏦
1. Check Balance
2. Deposit Money
3. Request Loan
4. My Group Status
5. Transaction History
0. Exit`;
    }
    
    // Check Balance
    else if (text === "1") {
      try {
        // Find member by phone number
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('*, chamas(*)')
          .eq('phone_number', normalizedPhone)
          .single();

        if (memberError || !member) {
          response = `END Phone not registered.
Please sign up on our app first.

Visit: smartchama.co.ke`;
        } else {
          // Get member's transactions to calculate balance
          const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('phone_number', normalizedPhone)
            .eq('status', 'completed');

          let balance = 0;
          if (transactions) {
            balance = transactions.reduce((sum, txn) => {
              const amount = parseFloat(txn.amount) || 0;
              if (txn.transaction_type === 'deposit' || txn.transaction_type === 'dividend' || txn.transaction_type === 'repayment') {
                return sum + amount;
              } else if (txn.transaction_type === 'withdrawal' || txn.transaction_type === 'loan' || txn.transaction_type === 'penalty') {
                return sum - amount;
              }
              return sum;
            }, 0);
          }

          const chamaBalance = parseFloat(member.chamas?.total_balance || '0');

          response = `END Your Balance 💰
Personal: KES ${balance.toLocaleString()}
Group: ${member.chamas?.name || 'N/A'}
Total: KES ${chamaBalance.toLocaleString()}

Thank you!`;
        }
      } catch (error) {
        console.error("Balance check error:", error);
        response = `END System error.
Please try again later.`;
      }
    }
    
    // Deposit Money - Step 1
    else if (text === "2") {
      response = `CON Enter amount to deposit:
(Min: KES 100)

Example: 500`;
    }
    
    // Deposit Money - Step 2 (amount entered)
    else if (text.startsWith("2*")) {
      const amount = text.split("*")[1];
      const numAmount = parseFloat(amount);

      if (isNaN(numAmount) || numAmount < 100) {
        response = `END Invalid amount.
Minimum deposit: KES 100

Please try again.`;
      } else {
        // Trigger M-Pesa STK Push
        try {
          const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL;
          const mpesaResponse = await fetch(`${webhookUrl}/api/mpesa/stk-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: normalizedPhone,
              amount: numAmount,
              accountReference: 'SmartChama',
              transactionDesc: 'USSD Deposit'
            })
          });

          const mpesaResult = await mpesaResponse.json();

          if (mpesaResult.success) {
            response = `END Deposit Request Sent! 📲
Amount: KES ${numAmount.toLocaleString()}

Check your phone for M-Pesa prompt.
Enter PIN to complete.`;
          } else {
            response = `END Payment request failed.
${mpesaResult.error || 'Please try again.'}`;
          }
        } catch (error) {
          console.error("M-Pesa STK Push error:", error);
          response = `END System error.
Please try again later.`;
        }
      }
    }
    
    // Request Loan - Step 1
    else if (text === "3") {
      try {
        const { data: member } = await supabase
          .from('members')
          .select('*, chamas(*)')
          .eq('phone_number', normalizedPhone)
          .single();

        if (!member) {
          response = `END Phone not registered.
Please sign up first.`;
        } else {
          // Calculate loan limit (example: 3x contributions)
          const loanLimit = 15000; // Simplified for now
          
          response = `CON Request Loan 💳
Your Limit: KES ${loanLimit.toLocaleString()}

Enter amount to borrow:`;
        }
      } catch (error) {
        response = `END System error.
Please try again.`;
      }
    }
    
    // Request Loan - Step 2 (amount entered)
    else if (text.startsWith("3*")) {
      const amount = text.split("*")[1];
      const numAmount = parseFloat(amount);

      if (isNaN(numAmount) || numAmount < 500) {
        response = `END Invalid amount.
Minimum loan: KES 500`;
      } else if (numAmount > 15000) {
        response = `END Amount exceeds limit.
Maximum: KES 15,000`;
      } else {
        // Save loan request to database
        try {
          const { data: member } = await supabase
            .from('members')
            .select('id, chama_id')
            .eq('phone_number', normalizedPhone)
            .single();

          if (member) {
            // Create a loan transaction record
            const { error: loanError } = await supabase
              .from('transactions')
              .insert({
                transaction_type: 'loan',
                amount: numAmount.toString(),
                phone_number: normalizedPhone,
                description: `USSD Loan Request - KES ${numAmount}`,
                status: 'pending',
                mpesa_receipt_number: `LOAN-${Date.now()}`
              });

            if (loanError) {
              console.error("Loan request error:", loanError);
              response = `END Failed to submit request.
Please try again.`;
            } else {
              // Send SMS notification (optional)
              try {
                const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL;
                await fetch(`${webhookUrl}/api/sms/send`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    phoneNumber: normalizedPhone,
                    message: `Your loan request of KES ${numAmount.toLocaleString()} has been received. Processing time: 24-48 hours. You'll receive an SMS notification once approved.`
                  })
                });
              } catch (smsError) {
                console.error("SMS notification error:", smsError);
              }

              response = `END Loan Request Submitted! ✅
Amount: KES ${numAmount.toLocaleString()}

Processing time: 24-48 hours
You'll receive SMS notification.`;
            }
          } else {
            response = `END Phone not registered.
Please sign up first.`;
          }
        } catch (error) {
          console.error("Loan request error:", error);
          response = `END System error.
Please try again.`;
        }
      }
    }
    
    // My Group Status
    else if (text === "4") {
      try {
        const { data: member } = await supabase
          .from('members')
          .select('*, chamas(*)')
          .eq('phone_number', normalizedPhone)
          .single();

        if (!member) {
          response = `END Phone not registered.`;
        } else {
          // Get member count
          const { count } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('chama_id', member.chama_id);

          response = `END Your Group Info 👥
Group: ${member.chamas?.name || 'N/A'}
Members: ${count || 0}
Balance: KES ${parseFloat(member.chamas?.total_balance || '0').toLocaleString()}

Status: Active ✅`;
        }
      } catch (error) {
        response = `END System error.
Please try again.`;
      }
    }
    
    // Transaction History
    else if (text === "5") {
      try {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('phone_number', normalizedPhone)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!transactions || transactions.length === 0) {
          response = `END No transactions yet.

Make your first deposit!`;
        } else {
          let txnList = "Recent Transactions 📊\n";
          transactions.forEach((txn, idx) => {
            const sign = ['deposit', 'dividend', 'repayment'].includes(txn.transaction_type) ? '+' : '-';
            const amount = parseFloat(txn.amount);
            txnList += `${idx + 1}. ${sign}KES ${amount.toLocaleString()}\n`;
          });
          
          response = `END ${txnList}
View more on app.`;
        }
      } catch (error) {
        response = `END System error.
Please try again.`;
      }
    }
    
    // Exit
    else if (text === "0") {
      response = `END Thank you for using SmartChama! 🙏

For support: 0700123456
Visit: smartchama.co.ke`;
    }
    
    // Invalid Input
    else {
      response = `END Invalid option.

Please dial ${serviceCode} again.`;
    }

    console.log("📤 USSD Response:", response.substring(0, 100) + "...");

    // Return response in plain text
    return new NextResponse(response, {
      headers: { "Content-Type": "text/plain" },
    });

  } catch (error) {
    console.error("❌ USSD Error:", error);
    return new NextResponse("END System Error. Please try again.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
