import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  deleteSession,
} from '@/lib/admin-auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const isProd = process.env.NODE_ENV === 'production'

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    // Throttle login attempts: 5 per 15 min per IP.
    const limited = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      )
    }

    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const user = await db.adminUser.findUnique({ where: { username } })
    // Always run a bcrypt compare to avoid user-enumeration via timing.
    const hash = user?.password ?? '$2b$10$OopfnvpSeoBjDhaqEuZ76.pozlTm33H/iKM2.sdIYfSz4aPSyp/by'
    const valid = await bcrypt.compare(password, hash)

    if (!user || !valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Contact an administrator.' },
        { status: 403 }
      )
    }

    const token = await createSession(user.id, user.username)
    await db.adminUser.update({ where: { id: user.id }, data: { lastLogin: new Date() } })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, cookieOpts(SESSION_MAX_AGE))

    return NextResponse.json({
      success: true,
      user: { name: user.name, role: user.role, permissions: user.permissions },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) await deleteSession(token)
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.json({ success: true })
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ authenticated: false })

  const session = await db.adminSession.findUnique({ where: { token } })
  if (!session || session.expires.getTime() < Date.now()) {
    if (session) await deleteSession(token)
    cookieStore.delete(SESSION_COOKIE)
    return NextResponse.json({ authenticated: false })
  }

  const user = await db.adminUser.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, role: true, permissions: true, active: true },
  })
  if (!user || !user.active) {
    await deleteSession(token)
    cookieStore.delete(SESSION_COOKIE)
    return NextResponse.json({ authenticated: false })
  }
  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, name: user.name, role: user.role, permissions: user.permissions },
  })
}
