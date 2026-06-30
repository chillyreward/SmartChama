import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Get or create admin user in Auth
    let adminUser;
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    adminUser = usersList?.users?.find(u => u.email === 'admin@smartchama.test');

    if (!adminUser) {
      const { data: newAdmin, error: createAdminErr } = await supabase.auth.admin.createUser({
        email: 'admin@smartchama.test',
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: 'Test Admin', phone: '+254700000001' }
      });
      if (createAdminErr) throw createAdminErr;
      adminUser = newAdmin.user;
    }

    // 2. Get or create member user in Auth
    let memberUser;
    memberUser = usersList?.users?.find(u => u.email === 'member@smartchama.test');

    if (!memberUser) {
      const { data: newMember, error: createMemberErr } = await supabase.auth.admin.createUser({
        email: 'member@smartchama.test',
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: 'Test Member', phone: '+254700000002' }
      });
      if (createMemberErr) throw createMemberErr;
      memberUser = newMember.user;
    }

    // 3. Upsert profiles
    const { error: p1Err } = await supabase.from('profiles').upsert({
      id: adminUser.id,
      full_name: 'Test Admin',
      phone_number: '+254700000001',
      email: 'admin@smartchama.test'
    });
    if (p1Err) throw p1Err;

    const { error: p2Err } = await supabase.from('profiles').upsert({
      id: memberUser.id,
      full_name: 'Test Member',
      phone_number: '+254700000002',
      email: 'member@smartchama.test'
    });
    if (p2Err) throw p2Err;

    // 4. Create Chama
    const { error: chamaErr } = await supabase.from('chamas_v2').upsert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Chama',
      contribution_amount: 5000,
      contribution_frequency: 'monthly',
      status: 'active',
      created_by: adminUser.id
    });
    if (chamaErr) throw chamaErr;

    // 5. Create Wallet
    const { error: walletErr } = await supabase.from('wallets').upsert({
      chama_id: '00000000-0000-0000-0000-000000000001',
      balance: 50000,
      savings_pool: 50000
    });
    if (walletErr) throw walletErr;

    // 6. Link Admin as chairlady
    const { data: adminMembership, error: m1Err } = await supabase.from('chama_memberships').upsert({
      profile_id: adminUser.id,
      chama_id: '00000000-0000-0000-0000-000000000001',
      role: 'chairlady',
      trust_score: 100,
      status: 'active'
    }).select().single();
    if (m1Err) throw m1Err;

    // 7. Link Member as member
    const { data: memberMembership, error: m2Err } = await supabase.from('chama_memberships').upsert({
      profile_id: memberUser.id,
      chama_id: '00000000-0000-0000-0000-000000000001',
      role: 'member',
      trust_score: 72,
      contribution_streak: 4,
      status: 'active'
    }).select().single();
    if (m2Err) throw m2Err;

    // 8. Populate contributions
    for (let i = 1; i <= 4; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      await supabase.from('contributions_v2').upsert({
        id: `00000000-0000-0000-0000-000000000${10 + i}`,
        membership_id: memberMembership.id,
        chama_id: '00000000-0000-0000-0000-000000000001',
        amount: 5000,
        payment_method: 'mpesa',
        status: 'confirmed',
        mpesa_receipt: `TXT${i}MEMBER`,
        created_at: date.toISOString(),
        confirmed_at: date.toISOString()
      });

      await supabase.from('contributions_v2').upsert({
        id: `00000000-0000-0000-0000-000000000${20 + i}`,
        membership_id: adminMembership.id,
        chama_id: '00000000-0000-0000-0000-000000000001',
        amount: 5000,
        payment_method: 'mpesa',
        status: 'confirmed',
        mpesa_receipt: `TXT${i}ADMIN`,
        created_at: date.toISOString(),
        confirmed_at: date.toISOString()
      });
    }

    // 9. Add pending loan
    const { error: loanErr } = await supabase.from('loans_v2').upsert({
      id: '00000000-0000-0000-0000-000000000002',
      chama_id: '00000000-0000-0000-0000-000000000001',
      membership_id: memberMembership.id,
      amount: 15000,
      interest_rate: 10,
      repayment_months: 3,
      purpose: 'Emergency school fees payment',
      status: 'pending',
      due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    if (loanErr) throw loanErr;

    return NextResponse.json({
      success: true,
      message: 'Demo accounts and Test Chama initialized successfully.',
      admin: {
        email: 'admin@smartchama.test',
        password: 'password123',
        role: 'chairlady (admin)'
      },
      member: {
        email: 'member@smartchama.test',
        password: 'password123',
        role: 'member'
      }
    });

  } catch (error: any) {
    console.error('Setup Demo Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
