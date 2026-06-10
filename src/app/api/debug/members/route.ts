import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get('adminEmail');

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 400 });
    }

    // Get admin ID
    const { data: admin, error: adminError } = await supabase
      .from('chama_admins')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ 
        error: 'Admin not found',
        adminError: adminError?.message 
      }, { status: 404 });
    }

    // Get admin's chamas
    const { data: chamas, error: chamasError } = await supabase
      .from('chamas')
      .select('*')
      .eq('admin_id', admin.id);

    if (chamasError) {
      return NextResponse.json({ 
        error: 'Error fetching chamas',
        chamasError: chamasError.message 
      }, { status: 500 });
    }

    const chamaIds = (chamas || []).map(c => c.id);

    // Get all members
    const { data: allMembers, error: allMembersError } = await supabase
      .from('members')
      .select('*');

    // Get members in admin's chamas
    const { data: chamaMembers, error: chamaMembersError } = await supabase
      .from('members')
      .select('*, chamas(name)')
      .in('chama_id', chamaIds.length > 0 ? chamaIds : ['00000000-0000-0000-0000-000000000000']);

    // Get unassigned members
    const { data: unassignedMembers, error: unassignedError } = await supabase
      .from('members')
      .select('*')
      .is('chama_id', null);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.full_name
      },
      chamas: chamas || [],
      chamaIds,
      stats: {
        totalMembers: allMembers?.length || 0,
        chamaMembersCount: chamaMembers?.length || 0,
        unassignedCount: unassignedMembers?.length || 0
      },
      allMembers: allMembers || [],
      chamaMembers: chamaMembers || [],
      unassignedMembers: unassignedMembers || [],
      errors: {
        allMembersError: allMembersError?.message,
        chamaMembersError: chamaMembersError?.message,
        unassignedError: unassignedError?.message
      }
    });

  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}
