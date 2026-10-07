import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { ADMIN_ROLES, getChamaMembership, isInternalRequest } from '@/lib/api-guard';
import { requireAuth } from '@/lib/api-auth';
import { formatKenyanPhone, sendSms } from '@/lib/sms';

// Without a check this route sends any text, to any number, under the
// SmartChama sender name: free phishing for anyone, billed to us.
// Allowed callers:
//  - other API routes (internal secret)
//  - a signed-in chama official messaging a member of that same chama

export async function POST(request: Request) {
  try {
    const { phone, message, chama_id } = await request.json();

    if (!phone || !message || !String(message).trim()) {
      return NextResponse.json({ error: 'phone and message are required' }, { status: 400 });
    }
    if (String(message).length > 480) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const formattedPhone = formatKenyanPhone(phone);
    if (!/^\+254\d{9}$/.test(formattedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format. Must be +254XXXXXXXXX' }, { status: 400 });
    }

    if (!isInternalRequest(request)) {
      const { user, error: authError } = await requireAuth(request);
      if (!user || authError) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const admin = getSupabaseAdmin();
      const official = await getChamaMembership(admin, user.id, chama_id, ADMIN_ROLES);
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

    const result = await sendSms(formattedPhone, String(message).trim());
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'SMS failed' }, { status: 502 });
    }
    return NextResponse.json({ success: true, simulated: result.simulated ?? false });
  } catch (error: any) {
    console.error('SMS error:', error?.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
