// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  const isAuthPage = request.nextUrl.pathname === '/login'
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/add-person') ||
    request.nextUrl.pathname.startsWith('/edit-profile') ||
    request.nextUrl.pathname.startsWith('/search')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // For now, we'll do basic session presence check in middleware
  // Actual validation happens in server components/API routes
  const hasSession = !!sessionCookie?.value

  if (!hasSession && (isProtectedRoute || isAdminRoute)) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/search', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/logout',
    '/profile/:path*',
    '/add-person/:path*',
    '/edit-profile/:path*',
    '/search/:path*',
    '/admin/:path*'
  ]
};