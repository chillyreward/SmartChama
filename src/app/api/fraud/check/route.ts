import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getComplianceConfig } from '@/lib/compliance';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { profile_id, chama_id } = await request.json();

    if (!profile_id || !chama_id) {
      return Response.json({ error: 'Missing profile_id or chama_id' }, { status: 400 });
    }

    const flags = [];

    // Check 1: Too many chamas for one person
    const maxChamas = await getComplianceConfig('max_chamas_per_person');
    const { count: chamaCount } = await supabase
      .from('chama_memberships')
      .select('*', { count: 'exact' })
      .eq('profile_id', profile_id)
      .eq('status', 'active');

    if (maxChamas && (chamaCount || 0) > maxChamas.count) {
      flags.push({
        flag_type: 'same_phone_multiple_chamas',
        description: `Member belongs to ${chamaCount} groups, above threshold of ${maxChamas.count}`,
        severity: 'medium'
      });
    }

    // Check 2: Chama with too few members after 30 days
    const minMembers = await getComplianceConfig('min_group_members_legitimate');
    const { data: chama } = await supabase
      .from('chamas_v2')
      .select('created_at')
      .eq('id', chama_id)
      .single();

    if (chama) {
      const daysSinceCreation = (Date.now() - new Date(chama.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const { count: memberCount } = await supabase
        .from('chama_memberships')
        .select('*', { count: 'exact' })
        .eq('chama_id', chama_id)
        .eq('status', 'active');

      if (minMembers && daysSinceCreation > 30 && (memberCount || 0) < minMembers.count) {
        flags.push({
          flag_type: 'fake_chama',
          description: `Group has only ${memberCount} members after 30+ days`,
          severity: 'low'
        });
      }
    }

    // Check 3: Round-number repeated contributions (laundering pattern)
    const { data: membership } = await supabase
      .from('chama_memberships')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('chama_id', chama_id)
      .single();

    if (membership) {
      const { data: recentContribs } = await supabase
        .from('contributions_v2')
        .select('amount')
        .eq('membership_id', membership.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const roundAmounts = recentContribs?.filter(c => c.amount % 10000 === 0).length || 0;

      if (roundAmounts >= 4) {
        flags.push({
          flag_type: 'suspicious_pattern',
          description: 'Multiple identical round-number contributions',
          severity: 'medium'
        });
      }
    }

    // Save any flags found
    for (const flag of flags) {
      await supabase
        .from('fraud_flags')
        .insert({
          chama_id,
          profile_id,
          ...flag
        });
    }

    return Response.json({
      flagged: flags.length > 0,
      flags
    });
  } catch (error: any) {
    console.error('Fraud Check Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
