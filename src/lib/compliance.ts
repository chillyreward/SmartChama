import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function getComplianceConfig(
  key: string, 
  market = 'KE'
) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('compliance_config')
    .select('config_value')
    .eq('market', market)
    .eq('config_key', key)
    .single();
  
  return data?.config_value;
}
