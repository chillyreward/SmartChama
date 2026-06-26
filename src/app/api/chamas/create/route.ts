import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { supabase as clientSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { 
      user_id, 
      email, 
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
    } = await request.json();

    if (!user_id || !chama_name || !full_name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin(); // Admin bypasses RLS for these creations

    // 1. Upsert Profile
    let formattedPhone = phone.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.slice(1);
    }
    if (!formattedPhone.startsWith('+254')) {
      formattedPhone = '+254' + formattedPhone;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user_id,
        full_name,
        phone_number: formattedPhone,
        email
      });

    if (profileError) {
      console.error("Profile Error:", profileError);
      return NextResponse.json({ error: `Error creating profile: ${profileError.message}` }, { status: 500 });
    }

    // 2. Create the Chama
    const { data: chamaData, error: chamaError } = await supabase
      .from('chamas_v2')
      .insert({
        name: chama_name,
        contribution_amount: parseInt(contribution_amount) || 0,
        contribution_frequency,
        created_by: user_id,
        status: 'active'
      })
      .select()
      .single();

    if (chamaError) {
      console.error("Chama Error:", chamaError);
      return NextResponse.json({ error: chamaError.message }, { status: 500 });
    }

    // 3. Create the Wallet
    const { error: walletError } = await supabase.from('wallets').insert({
      chama_id: chamaData.id,
      balance: 0
    });
    
    if (walletError) {
      console.error("Wallet Error:", walletError);
    }

    // 4. Create Chama Payment Config
    const { error: configError } = await supabase
      .from('chama_payment_config')
      .insert({
        chama_id: chamaData.id,
        payment_type: payment_type || 'till',
        till_number: till_number || null,
        paybill_number: paybill_number || null,
        account_number: account_number || null,
        phone_number: phone_number || null,
        account_name: account_name || null,
        is_verified: false
      });

    if (configError) {
      console.error("Payment Config Error:", configError);
    }

    // 5. Create the Admin Membership
    const { error: membershipError } = await supabase
      .from('chama_memberships')
      .insert({
        profile_id: user_id,
        chama_id: chamaData.id,
        role: 'admin',
        trust_score: 100,
        status: 'active'
      });

    if (membershipError) {
      console.error("Membership Error:", membershipError);
      return NextResponse.json({ error: `Error creating membership: ${membershipError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, chama_id: chamaData.id });
  } catch (error: any) {
    console.error("Create Chama Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
