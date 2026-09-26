import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'

const intlMiddleware = createMiddleware(routing)

// Routes that require the user to be logged IN
const protectedRoutes = ['/dashboard']

// Routes that require the user to be logged OUT
const authRoutes = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  // Run next-intl first to handle locale prefix
  const response = intlMiddleware(request)

  // Create a Supabase server client that reads/writes cookies
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
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required to keep Server Components up-to-date
  const { data: { user } } = await supabase.auth.getUser()

  // Strip the locale prefix to get the clean pathname for matching
  // e.g. "/ar/dashboard/expenses" → "/dashboard/expenses"
  const { pathname } = request.nextUrl
  const pathnameWithoutLocale = pathname.replace(/^\/(ar|en)/, '') || '/'

  const isProtected = protectedRoutes.some((route) =>
    pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(route + '/')
  )

  const isAuthRoute = authRoutes.some((route) =>
    pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(route + '/')
  )

  // 🔒 Visiting a protected page while NOT logged in → redirect to /login
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    // Preserve the locale
    const locale = pathname.match(/^\/(ar|en)/)?.[1] ?? 'ar'
    loginUrl.pathname = `/${locale}/login`
    return NextResponse.redirect(loginUrl)
  }

  // ✅ Visiting login/signup while ALREADY logged in → redirect to /dashboard
  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone()
    const locale = pathname.match(/^\/(ar|en)/)?.[1] ?? 'ar'
    dashboardUrl.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(dashboardUrl)
  }

  // 🚀 Visiting landing page (root) while ALREADY logged in → redirect to /dashboard
  if (pathnameWithoutLocale === '/' && user) {
    const dashboardUrl = request.nextUrl.clone()
    const locale = pathname.match(/^\/(ar|en)/)?.[1] ?? 'ar'
    dashboardUrl.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
}
