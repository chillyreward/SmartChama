import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res = NextResponse.next({ request: { headers: req.headers } })
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Use getUser() — authenticates via Supabase Auth server (secure)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // Skip middleware for public routes and all API routes
  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/admin/login' ||
    pathname === '/admin/signup' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/careers') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/security')

  if (isPublic) return res

  // Protected member routes — redirect to login if no session
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/select-group')) {
    if (!user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return res
  }

  // Admin routes — require session + admin role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { data: memberships } = await supabase
      .from('chama_memberships')
      .select('role')
      .eq('profile_id', user.id)
      .in('role', ['admin', 'chairlady', 'treasurer', 'secretary'])
      .eq('status', 'active')
      .limit(1)

    if (!memberships || memberships.length === 0) {
      // Has account but no chama yet — send to admin dashboard to create one
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.svg$).*)',
  ]
}
