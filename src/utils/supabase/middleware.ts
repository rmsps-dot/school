import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT use getSession(). Use getUser() to validate the token on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that should not be protected
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/manifest.webmanifest']
  
  // Exclude the cron route exactly — do not use startsWith to avoid accidentally
  // bypassing auth for any future /api/cron-* routes.
  if (pathname === '/api/cron/cleanup-attendance') {
    return supabaseResponse
  }

  // If the user is NOT authenticated and trying to access a protected route
  // We consider any route that is not in publicRoutes as protected (e.g. /admin, /teacher, /api, etc)
  // Exact match for '/' or prefix match for '/login' etc.
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Prevent browser from caching protected pages
  // This stops the back-button-after-logout bypass
  const isPublicPath = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/manifest.webmanifest']
    .some(p => pathname === p || pathname.startsWith(p + '/'))

  if (!isPublicPath) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    supabaseResponse.headers.set('Pragma', 'no-cache')
    supabaseResponse.headers.set('Expires', '0')
  }

  return supabaseResponse
}
