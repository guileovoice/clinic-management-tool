import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value

  if (!sessionId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('id, user_email, user_name, user_role, created_at')
    .eq('id', sessionId)
    .single()

  if (!session) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.cookies.set('user_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    return response
  }

  const elapsed = Date.now() - new Date(session.created_at).getTime()
  const oneHour = 60 * 60 * 1000

  if (elapsed > oneHour) {
    await supabaseAdmin.from('sessions').delete().eq('id', sessionId)
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.cookies.set('user_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    return response
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
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.cookies.set('user_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    return response
  }

  return NextResponse.json({
    authenticated: true,
    email: session.user_email,
    name: session.user_name,
    role: session.user_role,
  })
}
