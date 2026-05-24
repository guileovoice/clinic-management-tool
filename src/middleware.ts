import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function isValidSession(sessionId: string): Promise<boolean> {
  if (!supabaseUrl || !serviceRoleKey) return false

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('id, user_email, created_at')
    .eq('id', sessionId)
    .single()

  if (!session) return false

  const elapsed = Date.now() - new Date(session.created_at).getTime()
  if (elapsed > 60 * 60 * 1000) {
    await supabaseAdmin.from('sessions').delete().eq('id', sessionId)
    return false
  }

  const { data: latestSession } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('user_email', session.user_email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!latestSession || latestSession.id !== sessionId) {
    await supabaseAdmin.from('sessions').delete().eq('id', sessionId)
    return false
  }

  return true
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session')
  const { pathname } = request.nextUrl

  const isDashboardRoute =
    pathname.startsWith('/overview') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/patients') ||
    pathname.startsWith('/calls') ||
    pathname.startsWith('/campaigns') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/audiences')

  if (isDashboardRoute) {
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const valid = await isValidSession(sessionCookie.value)
    if (!valid) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.set('user_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return response
    }
  }

  if (pathname === '/login') {
    if (sessionCookie?.value) {
      const valid = await isValidSession(sessionCookie.value)
      if (valid) {
        return NextResponse.redirect(new URL('/overview', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
