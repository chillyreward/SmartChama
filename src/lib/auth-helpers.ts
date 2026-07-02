import { getSupabaseBrowser } from '@/lib/supabase-browser'

export async function signOut() {
  const supabase = getSupabaseBrowser()
  
  try {
    sessionStorage.clear()
  } catch(e) {}
  
  try {
    const theme = localStorage.getItem('sc-theme')
    localStorage.clear()
    if (theme) {
      localStorage.setItem('sc-theme', theme)
    }
  } catch(e) {}

  await supabase.auth.signOut()
  
  // Hard navigation — clears all React state and prevents loops
  window.location.href = '/login'
}
