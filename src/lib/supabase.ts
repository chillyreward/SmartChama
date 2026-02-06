import { createClient } from '@supabase/supabase-js'

// --- BYPASS MODE: Hardcoded Keys ---
// We are putting the keys directly here to stop the "Missing Variables" error.
const supabaseUrl = "https://stfjghudefipojpcdxtn.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZmpnaHVkZWZpcG9qcGNkeHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTIzOTYsImV4cCI6MjA4NTg4ODM5Nn0.7lWo_gUi3zA5GF7wsGPdlStWwGLWI66QI4nRf0WjG_A"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)