import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  try {
    const { chama_id, profile_id } = await request.json();

    // 1. Profile Checks (Multi-chama fraud check)
    if (profile_id) {
      const { data: memberships, error: memErr } = await supabase
        .from('chama_memberships')
        .select('id')
        .eq('profile_id', profile_id)
        .eq('status', 'active');

      if (!memErr && memberships && memberships.length > 5) {
        // Check if flag already exists
        const { data: existing } = await supabase
          .from('fraud_flags')
          .select('id')
          .eq('profile_id', profile_id)
          .eq('flag_type', 'same_phone_multiple_chamas')
          .eq('resolved', false)
          .maybeSingle();

        if (!existing) {
          await supabase.from('fraud_flags').insert({
            profile_id,
            flag_type: 'same_phone_multiple_chamas',
            description: `User profile is connected to ${memberships.length} active chamas. Limit is 5.`,
            severity: 'high'
          });
        }
      }
    }

    // 2. Chama Checks (Fake chama & No real payments check)
    if (chama_id) {
      // Fake Chama: <3 members after 30 days
      const { data: chama, error: chamaErr } = await supabase
        .from('chamas_v2')
        .select('created_at')
        .eq('id', chama_id)
        .single();

      if (!chamaErr && chama) {
        const daysSinceCreation = (Date.now() - new Date(chama.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation >= 30) {
          const { data: mems } = await supabase
            .from('chama_memberships')
            .select('id')
            .eq('chama_id', chama_id)
            .eq('status', 'active');

          if (mems && mems.length < 3) {
            const { data: existing } = await supabase
              .from('fraud_flags')
              .select('id')
              .eq('chama_id', chama_id)
              .eq('flag_type', 'fake_chama')
              .eq('resolved', false)
              .maybeSingle();

            if (!existing) {
              await supabase.from('fraud_flags').insert({
                chama_id,
                flag_type: 'fake_chama',
                description: `Chama has only ${mems.length} active member(s) after 30 days.`,
                severity: 'medium'
              });
            }
          }
        }
      }

      // No Real Payments: All confirmed contributions are manual/cash
      const { data: contribs } = await supabase
        .from('contributions_v2')
        .select('payment_method, mpesa_receipt')
        .eq('chama_id', chama_id)
        .eq('status', 'confirmed');

      if (contribs && contribs.length > 0) {
        const hasRealMpesa = contribs.some(c => c.payment_method === 'mpesa' && !!c.mpesa_receipt);
        if (!hasRealMpesa) {
          const { data: existing } = await supabase
            .from('fraud_flags')
            .select('id')
            .eq('chama_id', chama_id)
            .eq('flag_type', 'no_real_payments')
            .eq('resolved', false)
            .maybeSingle();

          if (!existing) {
            await supabase.from('fraud_flags').insert({
              chama_id,
              flag_type: 'no_real_payments',
              description: `Chama has ${contribs.length} confirmed manual/cash entries but zero verified M-Pesa receipt transactions.`,
              severity: 'medium'
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Fraud check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
