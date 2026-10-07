import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { ADMIN_ROLES, getChamaMembership, isInternalRequest } from '@/lib/api-guard';
import { requireUser } from '@/lib/require-user';

// Without a check this route sends any text, to any number, under the
// SmartChama sender name: free phishing for anyone, billed to us.
// Allowed callers:
//  - other API routes (internal secret)
//  - a signed-in chama official messaging a member of that same chama

function formatPhone(raw: string) {
  let p = String(raw).replace(/[\s-]/g, '');
  if (p.startsWith('0')) p = '+254' + p.slice(1);
  if (!p.startsWith('+')) p = '+254' + p;
  return p;
}

export async function POST(request: Request) {
  try {
    const { phone, message, chama_id } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 });
    }
    if (String(message).length > 480) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const formattedPhone = formatPhone(phone);

    if (!isInternalRequest(request)) {
      const auth = await requireUser();
      if (auth.response) return auth.response;

      const admin = getSupabaseAdmin();
      const official = await getChamaMembership(admin, auth.user.id, chama_id, ADMIN_ROLES);
      if (!official) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: recipient } = await admin
        .from('chama_memberships')
        .select('id, profiles!inner(phone_number)')
        .eq('chama_id', chama_id)
        .eq('status', 'active')
        .eq('profiles.phone_number', formattedPhone)
        .limit(1);

      if (!recipient || recipient.length === 0) {
        return NextResponse.json({ error: 'Recipient is not a member of this group' }, { status: 403 });
      }
    }

    const apiKey = process.env.WAKALI_API_KEY;

    if (!apiKey) {
      console.warn('[DEV] Wakali not configured — SMS simulated');
      return NextResponse.json({ success: true, simulated: true });
    }

    const res = await fetch('https://api.wakalisms.com/sms/send', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        message,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Wakali SMS failed:', JSON.stringify(data));
      return NextResponse.json({ success: false, error: 'SMS failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SMS error:', error.message);
    return NextResponse.json({ success: false, error: 'SMS failed' }, { status: 500 });
  }
}
