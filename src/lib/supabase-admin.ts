/**
 * DATA RESIDENCY NOTE:
 * Kenya's Data Protection Act 
 * requires personal data to be 
 * stored locally or in a 
 * jurisdiction with equivalent 
 * protections. Current Supabase 
 * project region should be 
 * verified and, when scaling 
 * past early stage, migrated to 
 * the AWS Cape Town (af-south-1) 
 * region or equivalent if not 
 * already there. Check current 
 * region in Supabase Dashboard 
 * → Settings → General.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return adminClient
}
