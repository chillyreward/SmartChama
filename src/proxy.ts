import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  const publicPaths = [
    '/', '/login', '/signup',
    '/about', '/contact', '/terms',
    '/privacy', '/cookies', '/security',
    '/careers', '/blog',
    '/auth/callback',
    '/api/mpesa/callback',
    '/api/ussd',
    '/api/auth/send-otp',
    '/api/auth/verify-otp'
  ]

  const isPublic = publicPaths.some(p => pathname === p) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/admin/login' ||
    pathname === '/admin/signup'

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/select-group')

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup'

  if (!session && isProtected) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/signup') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { data: memberships } = await supabase
      .from('chama_memberships')
      .select('role')
      .eq('profile_id', session.user.id)
      .in('role', ['admin', 'chairlady', 'treasurer', 'secretary'])
      .eq('status', 'active')
      .limit(1)

    if (!memberships || memberships.length === 0) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.svg$).*)',
  ]
}
