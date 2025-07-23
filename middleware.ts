import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Always allow access to setup routes, API routes, and static files
  if (
    pathname.startsWith('/setup') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/login')
  ) {
    return NextResponse.next()
  }

  // For protected routes, check authentication
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check admin routes
  if (pathname.startsWith('/admin') && token?.role !== 'admin') {
    return NextResponse.redirect(new URL('/search', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}