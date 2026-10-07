import { getSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Only allow same-site relative paths, so ?next=https://evil.com or
// ?next=//evil.com can't bounce a freshly signed-in user to another site.
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/dashboard'
  }
  return next
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNextPath(url.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=oauth', url.origin))
  }

  const user = data.user

  // The handle_new_user trigger normally creates the profile. This is a fallback
  // for users created before the trigger existed, and runs as the user (RLS
  // allows inserting your own profile), so it doesn't need the service role key.
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User',
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url || null,
    })
    if (insertError) console.error('Profile fallback insert failed:', insertError)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
