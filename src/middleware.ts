import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('user_session')
  const { pathname } = request.nextUrl

  // Protect all dashboard routes
  const isDashboardRoute = 
    pathname.startsWith('/overview') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/patients') ||
    pathname.startsWith('/calls') ||
    pathname.startsWith('/campaigns') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/audiences')

  if (isDashboardRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/overview', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
