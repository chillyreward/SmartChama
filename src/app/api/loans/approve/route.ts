import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { loanId } = await request.json();
    
    if (!loanId) {
      return NextResponse.json({ error: 'Missing required field: loanId' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch loan details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans_v2')
      .select('*, chama_memberships(membership_id:id, profile_id, profiles(phone_number, full_name)), chamas_v2(name)')
      .eq('id', loanId)
      .maybeSingle();

    if (loanError || !loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    if (loan.status !== 'pending') {
      return NextResponse.json({ error: 'Loan is not in pending state' }, { status: 400 });
    }

    // Check if authenticated user is admin/officer in this Chama
    const { data: adminMembership } = await supabaseAdmin
      .from('chama_memberships')
      .select('id, role')
      .eq('profile_id', user.id)
      .eq('chama_id', loan.chama_id)
      .eq('status', 'active')
      .in('role', ['admin', 'chairlady', 'treasurer', 'secretary'])
      .maybeSingle();

    if (!adminMembership) {
      return NextResponse.json({ error: 'Access denied. Only Chama admins can approve loans.' }, { status: 403 });
    }

    // Call postgres safe loan approval
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      'approve_loan_safe',
      {
        p_loan_id: loanId,
        p_chama_id: loan.chama_id,
        p_amount: loan.amount,
        p_admin_id: adminMembership.id
      }
    );

    if (rpcError || !result || !result.success) {
      return NextResponse.json(
        { error: rpcError?.message || result?.error || 'Could not approve loan.' },
        { status: 400 }
      );
    }

    // Queue post-approval operations in Outbox (prevents internal HTTP loopbacks)
    const phone = loan.chama_memberships?.profiles?.phone_number;
    const groupName = loan.chamas_v2?.name || 'your group';
    const membershipId = loan.chama_memberships?.membership_id || loan.membership_id;

    await supabaseAdmin.from('outbox').insert({
      event_type: 'loan_approved',
      payload: {
        membership_id: membershipId,
        chama_id: loan.chama_id,
        amount: loan.amount,
        phone,
        group_name: groupName
      }
    });

    // Send Push Notification
    try {
      const borrowerProfileId = loan.chama_memberships?.profile_id;
      if (borrowerProfileId) {
        const { notifyUserByProfileId } = await import('@/lib/push-notifications');
        await notifyUserByProfileId(
          borrowerProfileId,
          'Loan Approved! 🏦',
          `Your loan request for KSh ${loan.amount} in ${groupName} has been approved by the admin.`,
          { type: 'loan_approved', loan_id: loan.id }
        );
      }
    } catch (pushErr) {
      console.error('Push notification error on loan approval:', pushErr);
    }

    return NextResponse.json({ success: true, message: 'Loan approved successfully' });
  } catch (error: any) {
    console.error("Loan approval error:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
