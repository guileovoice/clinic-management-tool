import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('user_session')?.value

  if (sessionId) {
    await supabaseAdmin.from('sessions').delete().eq('id', sessionId)
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set('user_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
