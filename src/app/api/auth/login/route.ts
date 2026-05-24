import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const USERS = [
  { email: 'info@scalepods.co', password: 'ScalePods@123', name: 'ScalePods Admin', role: 'SUPERADMIN' },
  { email: 'admguileo@gmail.com', password: 'Guileo@123', name: 'Guileo Administrator', role: 'ADMIN' },
]

export async function POST(request: Request) {
  const { email, password } = await request.json()

  const cleanEmail = (email || '').trim().toLowerCase()
  const user = USERS.find((u) => u.email === cleanEmail && u.password === password)

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .insert({ user_email: user.email, user_name: user.name, user_role: user.role })
    .select('id')
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  const response = NextResponse.json({ name: user.name, email: user.email, role: user.role })

  response.cookies.set('user_session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  })

  return response
}
