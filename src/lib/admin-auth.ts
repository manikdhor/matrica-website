import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hasPermission, resolveLeadAccess, type LeadAccess } from '@/lib/permissions'
import { bumpContentVersion } from '@/lib/content-version'

export const SESSION_COOKIE = 'matrica_admin_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 // 24h in seconds

export interface AdminSessionUser {
  userId: string
  username: string
  name: string
  role: string
  permissions: string | null
}

function genToken() {
  return crypto.randomUUID() + '-' + crypto.randomUUID()
}

export async function createSession(userId: string, username: string): Promise<string> {
  const token = genToken()
  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  await db.adminSession.create({ data: { token, userId, username, expires } })
  // Sweep expired rows on login. Dead tokens are otherwise immortal: the cookie
  // max-age equals the session lifetime, so the browser stops presenting a token
  // once it expires and the lazy per-token delete in getSession never runs.
  // Fire-and-forget; uses the existing @@index([expires]).
  db.adminSession
    .deleteMany({ where: { expires: { lt: new Date() } } })
    .catch(() => {})
  return token
}

export async function deleteSession(token: string): Promise<void> {
  sessionCache.delete(token)
  await db.adminSession.deleteMany({ where: { token } })
}

/**
 * Short-TTL in-process session cache. Every admin API request validates the
 * session, which otherwise costs 2 DB queries (session + user) before the
 * route's own query — with a remote Postgres (Supabase, Singapore region)
 * that alone adds ~0.5-1s per request. 30s TTL keeps role/permission changes
 * and deactivation near-immediate while removing the tax from bursts of
 * requests (page loads fire several admin calls at once).
 */
const SESSION_CACHE_TTL = 30_000
const sessionCache = new Map<string, { user: AdminSessionUser; expires: number }>()

export async function getSession(): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const cached = sessionCache.get(token)
  if (cached && cached.expires > Date.now()) return cached.user

  const session = await db.adminSession.findUnique({ where: { token } })
  if (!session) return null

  if (session.expires.getTime() < Date.now()) {
    await db.adminSession.deleteMany({ where: { token } }).catch(() => {})
    return null
  }

  // Load the backing user so role/permission changes and deactivation
  // take effect immediately (single extra query).
  const user = await db.adminUser.findUnique({
    where: { id: session.userId },
    select: { name: true, role: true, permissions: true, active: true },
  })
  if (!user || !user.active) return null

  const sessionUser: AdminSessionUser = {
    userId: session.userId,
    username: session.username,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  }
  // Cap the cache entry at the session's own expiry
  sessionCache.set(token, {
    user: sessionUser,
    expires: Math.min(Date.now() + SESSION_CACHE_TTL, session.expires.getTime()),
  })
  // Opportunistic sweep so dead tokens don't accumulate
  if (sessionCache.size > 500) {
    const now = Date.now()
    for (const [k, v] of sessionCache) {
      if (v.expires <= now) sessionCache.delete(k)
    }
  }
  return sessionUser
}

export async function requireAuth(): Promise<AdminSessionUser | NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

/**
 * Require an authenticated session that has access to `module`.
 * @param write true (default) = mutation access, false = read access
 * Returns the session, or a 401/403 NextResponse.
 */
export async function requirePermission(
  module: string,
  write = true
): Promise<AdminSessionUser | NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasPermission(session, module, write)) {
    return NextResponse.json(
      { error: 'Forbidden: insufficient permissions' },
      { status: 403 }
    )
  }
  // Any authorized write invalidates the public content caches so the change
  // is visible on the very next public request instead of after the 60s TTL.
  if (write) bumpContentVersion()
  return session
}

export type LeadNeed = 'read' | 'status' | 'assign' | 'edit'

/**
 * Guard for lead endpoints. Resolves the caller's LeadAccess and rejects when
 * the needed capability is missing. Routes must additionally scope queries
 * with leadScopeWhere() / canAccessLead() so own-scope users (sales role)
 * never see or touch leads that aren't assigned to them.
 */
export async function requireLeadAccess(need: LeadNeed = 'read'): Promise<
  { session: AdminSessionUser; access: LeadAccess } | NextResponse
> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const access = resolveLeadAccess(session)
  const allowed =
    !!access &&
    (need === 'read' ||
      (need === 'status' && access.canStatus) ||
      (need === 'assign' && access.canAssign) ||
      (need === 'edit' && access.canEdit))
  if (!allowed) {
    return NextResponse.json(
      { error: 'Forbidden: insufficient permissions' },
      { status: 403 }
    )
  }
  if (need !== 'read') bumpContentVersion()
  return { session, access }
}

/** Prisma where fragment restricting a lead query to what the caller may see. */
export function leadScopeWhere(
  session: AdminSessionUser,
  access: LeadAccess
): Record<string, unknown> {
  // assignedTo stores the AdminUser display name (see db/assigned-to-fk.sql
  // for the planned FK migration), so own-scope matches on session name.
  return access.scope === 'own' ? { assignedTo: session.name } : {}
}

/** Whether the caller may see/touch this specific lead. */
export function canAccessLead(
  session: AdminSessionUser,
  access: LeadAccess,
  lead: { assignedTo: string | null }
): boolean {
  return access.scope === 'all' || lead.assignedTo === session.name
}

/**
 * Load a lead's ownership row and check scope in one step. Returns null when
 * the lead doesn't exist OR is outside the caller's scope — sub-resource
 * routes (notes, follow-ups, tags) should answer 404 in both cases so
 * own-scope users can't confirm the existence of other agents' leads.
 */
export async function findAccessibleLead(
  id: string,
  session: AdminSessionUser,
  access: LeadAccess
): Promise<{ id: string; assignedTo: string | null } | null> {
  const lead = await db.lead.findUnique({
    where: { id },
    select: { id: true, assignedTo: true },
  })
  if (!lead || !canAccessLead(session, access, lead)) return null
  return lead
}
