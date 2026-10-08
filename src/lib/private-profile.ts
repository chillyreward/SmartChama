import type { SupabaseClient } from '@supabase/supabase-js'

// National ID and the push token live in `profile_private`, readable only by
// the owner (RLS). They used to be on `profiles`, where every fellow chama
// member could read them.

export async function loadNationalId(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('profile_private')
    .select('national_id')
    .eq('profile_id', userId)
    .maybeSingle()
  return data?.national_id ?? ''
}

export async function saveNationalId(supabase: SupabaseClient, userId: string, nationalId: string | null) {
  return supabase
    .from('profile_private')
    .upsert({ profile_id: userId, national_id: nationalId || null, updated_at: new Date().toISOString() }, { onConflict: 'profile_id' })
}
