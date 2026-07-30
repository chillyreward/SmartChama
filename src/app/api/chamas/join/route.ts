import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { group_code } = body;

    if (!group_code) {
      return NextResponse.json({ error: 'Group Code is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const cleanCode = String(group_code).toUpperCase().trim();

    // 1. Find the Chama by Group Code
    const { data: chama, error: chamaError } = await supabase
      .from('chamas_v2')
      .select('id, name, status')
      .eq('group_code', cleanCode)
      .single();

    if (chamaError || !chama) {
      return NextResponse.json({ error: 'Invalid group code. Please double-check with your Chama admin.' }, { status: 404 });
    }

    if (chama.status !== 'active') {
      return NextResponse.json({ error: 'This Chama group is currently inactive.' }, { status: 400 });
    }

    // 2. Check if the user is already a member
    const { data: existingMembership } = await supabase
      .from('chama_memberships')
      .select('id, status')
      .eq('profile_id', user.id)
      .eq('chama_id', chama.id)
      .maybeSingle();

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return NextResponse.json({ error: 'You are already an active member of this Chama.' }, { status: 409 });
      } else {
        // Re-activate membership if previously inactive
        await supabase
          .from('chama_memberships')
          .update({ status: 'active' })
          .eq('id', existingMembership.id);
        
        return NextResponse.json({ success: true, chama_id: chama.id, chama_name: chama.name });
      }
    }

    // 3. Create pending membership for member awaiting admin approval
    const { error: joinError } = await supabase
      .from('chama_memberships')
      .insert({
        profile_id: user.id,
        chama_id: chama.id,
        role: 'member',
        trust_score: 100,
        status: 'pending',
        contribution_streak: 0
      });

    if (joinError) {
      console.error('Error joining Chama:', joinError);
      return NextResponse.json({ error: 'Failed to request joining group. Please try again.' }, { status: 500 });
    }

    // 4. Send notification to Chama admins
    const { data: admins } = await supabase
      .from('chama_memberships')
      .select('profile_id')
      .eq('chama_id', chama.id)
      .in('role', ['admin', 'chairlady'])
      .eq('status', 'active');

    if (admins && admins.length > 0) {
      const userProfileName = user.user_metadata?.full_name || user.email || 'A new user';
      const notificationRows = admins.map(admin => ({
        chama_id: chama.id,
        profile_id: admin.profile_id,
        type: 'member_request',
        title: 'New Member Request',
        message: `${userProfileName} wants to join your chama`
      }));
      await supabase.from('notifications').insert(notificationRows);

      // Send Push Notifications to Admins
      try {
        const { notifyUserByProfileId } = await import('@/lib/push-notifications');
        for (const admin of admins) {
          await notifyUserByProfileId(
            admin.profile_id,
            'New Member Request 🤝',
            `${userProfileName} requested to join your chama group.`,
            { type: 'member_request', chama_id: chama.id }
          );
        }
      } catch (pushErr) {
        console.error('Error sending push notification to admins:', pushErr);
      }
    }

    // 5. Log group activity
    await supabase.from('group_activity').insert({
      chama_id: chama.id,
      event_type: 'member_request',
      description: 'A new member requested to join using the group code.'
    });

    return NextResponse.json({ 
      success: true, 
      status: 'pending',
      chama_id: chama.id, 
      chama_name: chama.name,
      message: 'Your request to join has been sent to the admin for approval.'
    });

  } catch (err: any) {
    console.error('Join Chama API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
