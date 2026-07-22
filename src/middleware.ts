import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'matrica_admin_session'

// Server-side gate for the admin panel. This only checks for the presence of a
// session cookie (Edge runtime can't reach Prisma); full validation still
// happens in every /api/admin route and server component via requireAuth().
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow the login page and the auth API through.
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next()
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)
  if (!hasSession) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Guard all admin pages. API routes keep their own DB-backed checks.
  matcher: ['/admin', '/admin/:path*'],
}
