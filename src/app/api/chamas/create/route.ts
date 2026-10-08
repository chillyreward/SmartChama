import { NextResponse } from 'next/server';
import { requireUser, formatKenyanPhone } from '@/lib/require-user';

const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly'];

export async function POST(request: Request) {
  try {
    // Creator is always the signed-in user; any user_id in the body is ignored.
    // The session client is enough under RLS: creators may insert the chama,
    // their own first membership and the wallet.
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { user, supabase } = auth;

    const body = await request.json();
    const {
      full_name,
      phone,
      chama_name,
      contribution_amount,
      contribution_frequency,
      payment_type,
      till_number,
      paybill_number,
      account_number,
      phone_number,
      account_name
    } = body;

    if (!chama_name || !String(chama_name).trim()) {
      return NextResponse.json({ error: 'Please enter a group name.' }, { status: 400 });
    }

    // The auth trigger creates the profile at sign-up; this only fills in gaps.
    // Never write a placeholder phone: phone_number is unique, so a shared
    // default makes every sign-up after the first fail.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('id', user.id)
      .maybeSingle();

    const profilePatch: Record<string, unknown> = { id: user.id, email: user.email ?? null };
    if (!profile?.full_name) {
      profilePatch.full_name =
        full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    }
    // Phone numbers are added only through SMS verification (/api/phone/*)

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePatch, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile Error:', profileError);
      const msg = profileError.code === '23505'
        ? 'That phone number is already linked to another account.'
        : `Error saving profile: ${profileError.message}`;
      return NextResponse.json({ error: msg }, { status: profileError.code === '23505' ? 409 : 500 });
    }

    // 2. Create the Chama (trigger fills group_code)
    const { data: chamaData, error: chamaError } = await supabase
      .from('chamas_v2')
      .insert({
        name: String(chama_name).trim(),
        contribution_amount: Number(contribution_amount) || 0,
        contribution_frequency: FREQUENCIES.includes(contribution_frequency) ? contribution_frequency : 'monthly',
        created_by: user.id,
        status: 'active'
      })
      .select('id, name, group_code')
      .single();

    if (chamaError || !chamaData) {
      console.error('Chama Error:', chamaError);
      return NextResponse.json({ error: chamaError?.message || 'Could not create group' }, { status: 500 });
    }

    // Membership must exist before anything else that checks "is admin of chama"
    const { error: membershipError } = await supabase.from('chama_memberships').insert({
      profile_id: user.id,
      chama_id: chamaData.id,
      role: 'chairlady',
      trust_score: 100,
      status: 'active'
    });

    if (membershipError) {
      console.error('Membership Error:', membershipError);
      return NextResponse.json({ error: `Error creating membership: ${membershipError.message}` }, { status: 500 });
    }

    const [walletRes, activityRes] = await Promise.all([
      supabase.from('wallets').insert({ chama_id: chamaData.id, balance: 0 }),
      supabase.from('group_activity').insert({
        chama_id: chamaData.id,
        event_type: 'group_created',
        description: 'Group created'
      })
    ]);
    if (walletRes.error) console.error('Wallet Error:', walletRes.error);
    if (activityRes.error) console.error('Activity Error:', activityRes.error);

    // Payment config is optional; a failure here shouldn't undo the group
    if (payment_type && (till_number || paybill_number || phone_number)) {
      const { error: configError } = await supabase.from('chama_payment_config').insert({
        chama_id: chamaData.id,
        payment_type,
        till_number: till_number || null,
        paybill_number: paybill_number || null,
        account_number: account_number || null,
        phone_number: phone_number || null,
        account_name: account_name || null,
        is_verified: false
      });
      if (configError) console.error('Payment config Error:', configError);
    }

    return NextResponse.json({
      success: true,
      chama_id: chamaData.id,
      group_code: chamaData.group_code
    });
  } catch (error: any) {
    console.error('Create Chama Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
