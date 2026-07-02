import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { supabase as clientSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Server is missing Supabase credentials in env!");
      return NextResponse.json({ error: 'Server configuration error: Missing Supabase credentials' }, { status: 500 });
    }

    const body = await request.json();
    console.log("Create Chama API Payload:", body);
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
    } = body;

    const supabase = getSupabaseAdmin(); // Admin bypasses RLS

    let finalPhone = phone;
    let finalFullName = full_name;

    // Fallback: If full_name or phone is missing, fetch them from the profiles table
    if (user_id && (!finalPhone || !finalFullName)) {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', user_id)
        .single();

      if (dbProfile) {
        if (!finalPhone) finalPhone = dbProfile.phone_number;
        if (!finalFullName) finalFullName = dbProfile.full_name;
      }
    }

    // Default fallbacks to prevent "Missing required fields" errors
    if (!finalPhone) {
      finalPhone = '+254700000000';
    }
    if (!finalFullName) {
      finalFullName = email ? email.split('@')[0] : 'Chama Member';
    }

    if (!user_id || !chama_name || !finalFullName || !finalPhone) {
      console.log("Validation failed. Missing required fields:", { user_id, chama_name, finalFullName, finalPhone });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Upsert Profile
    let formattedPhone = finalPhone.replace(/\s/g, '');
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
        full_name: finalFullName,
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

    // Run setup insertions in PARALLEL
    const [walletRes, configRes, membershipRes, activityRes] = await Promise.all([
      supabase.from('wallets').insert({
        chama_id: chamaData.id,
        balance: 0
      }),
      supabase.from('chama_payment_config').insert({
        chama_id: chamaData.id,
        payment_type: payment_type || 'till',
        till_number: till_number || null,
        paybill_number: paybill_number || null,
        account_number: account_number || null,
        phone_number: phone_number || null,
        account_name: account_name || null,
        is_verified: false
      }),
      supabase.from('chama_memberships').insert({
        profile_id: user_id,
        chama_id: chamaData.id,
        role: 'chairlady',
        trust_score: 100,
        status: 'active'
      }),
      supabase.from('group_activity').insert({
        chama_id: chamaData.id,
        event_type: 'group_created',
        description: 'Group created'
      })
    ]);

    if (membershipRes.error) {
      console.error("Membership Error:", membershipRes.error);
      return NextResponse.json({ error: `Error creating membership: ${membershipRes.error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, chama_id: chamaData.id });
  } catch (error: any) {
    console.error("Create Chama Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
