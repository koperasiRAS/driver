import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Try to get current user first
  const { data: { user } } = await supabase.auth.getUser()

  // If no user, attempt to refresh session (handles expired tokens)
  let currentUser = user
  if (!user) {
    const { data: refreshData } = await supabase.auth.refreshSession()
    currentUser = refreshData?.user ?? null
  }

  // Public routes
  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password']
  const { pathname } = request.nextUrl
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  )

  if (isPublicRoute) {
    if (currentUser) {
      // Get user role and redirect to appropriate dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profile?.role === 'owner') {
        return NextResponse.redirect(new URL('/owner', request.url))
      } else {
        return NextResponse.redirect(new URL('/driver', request.url))
      }
    }
    return supabaseResponse
  }

  // Protected routes — redirect to login if not authenticated
  if (!currentUser) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Get user profile for role-based access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .maybeSingle()

  // Owner routes
  if (pathname.startsWith('/owner')) {
    if (profile?.role !== 'owner') {
      return NextResponse.redirect(new URL('/driver', request.url))
    }
  }

  // Driver routes
  if (pathname.startsWith('/driver')) {
    if (profile?.role !== 'driver') {
      return NextResponse.redirect(new URL('/owner', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
