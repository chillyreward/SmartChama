import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { internalHeaders } from '@/lib/api-guard';

// Africa's Talking doesn't sign USSD requests, and phoneNumber comes from the
// POST body, so without this anyone could claim a member's number and
// read their group's balance. Register the callback as /api/ussd?secret=USSD_WEBHOOK_SECRET.
function ussdSecretOk(req: Request): boolean {
  const expected = process.env.USSD_WEBHOOK_SECRET;
  if (!expected) return process.env.NODE_ENV !== 'production';
  const given = new URL(req.url).searchParams.get('secret') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!ussdSecretOk(req)) {
    return new NextResponse('END Service unavailable.', { status: 403, headers: { 'Content-Type': 'text/plain' } });
  }

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
2. Make Contribution`;
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
        if (!/^\d{1,6}$/.test(amount) || Number(amount) < 1) {
          return new NextResponse('END Invalid amount.', { headers: { 'Content-Type': 'text/plain' } });
        }
        response = `END Check your phone for the M-Pesa prompt to pay KSh ${amount} to ${summary.chama_name}.`;
        
        // Trigger STK push asynchronously
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        fetch(`${appUrl}/api/mpesa/stk-push`, {
          method: 'POST',
          headers: internalHeaders(),
          body: JSON.stringify({
            phone: phone,
            amount: Number(amount),
            membership_id: summary.membership_id,
            chama_id: summary.chama_id
          })
        }).catch(err => console.error('USSD STK Trigger error:', err));
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
