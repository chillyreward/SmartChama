import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const textBody = await req.text();
    const params = new URLSearchParams(textBody);
    
    const phoneNumber = params.get('phoneNumber') || '';
    const text = params.get('text') || '';
    
    let response = '';

    let phone = phoneNumber;
    if (!phone.startsWith('+')) {
      phone = '+' + phone.replace(/^0/, '254');
    }

    const { data: member } = await supabase
      .from('members')
      .select('*, chamas(name)')
      .eq('phone', phone)
      .single();

    if (!member) {
      response = `END Phone number not registered to any SmartChama group.`;
      return new NextResponse(response, { headers: { 'Content-Type': 'text/plain' } });
    }

    const parts = text.split('*');

    if (text === '') {
      response = `CON Welcome to SmartChama, ${member.full_name.split(' ')[0]}
1. Check Balance
2. Make Contribution
3. Request Loan
4. Approve Loan (Admin)`;
    } 
    else if (parts[0] === '1') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('chama_id', member.chama_id)
        .single();
        
      const balance = wallet?.balance || 0;
      response = `END Your group balance is KSh ${balance.toLocaleString()}.`;
    }
    else if (parts[0] === '2') {
      if (parts.length === 1) {
        response = `CON Enter contribution amount (KSh):`;
      } else {
        const amount = parts[1];
        response = `END Check your phone for the M-Pesa prompt to pay KSh ${amount} to ${member.chamas?.name}.`;
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
        
        await supabase.from('loans').insert({
          chama_id: member.chama_id,
          member_id: member.id,
          amount: Number(amount),
          duration_months: Number(duration),
          status: 'pending',
          created_at: new Date().toISOString(),
          due_date: new Date(Date.now() + Number(duration) * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        response = `END Loan request for KSh ${amount} over ${duration} months submitted for approval.`;
      }
    }
    else if (parts[0] === '4') {
      const adminRoles = ['admin', 'chairlady', 'treasurer', 'secretary'];
      if (!adminRoles.includes(member.role)) {
        response = `END You do not have permission to approve loans.`;
      } else {
        if (parts.length === 1) {
          const { data: pendingLoans } = await supabase
            .from('loans')
            .select('id, amount, members(full_name)')
            .eq('chama_id', member.chama_id)
            .eq('status', 'pending')
            .limit(3);
            
          if (!pendingLoans || pendingLoans.length === 0) {
            response = `END No pending loans.`;
          } else {
            let textRes = `CON Pending Loans:\n`;
            pendingLoans.forEach((l: any, index: number) => {
               textRes += `${index + 1}. ${l.members?.full_name} (KSh ${l.amount})\n`;
            });
            response = textRes;
          }
        } else {
          response = `END Loan approved successfully.`;
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
