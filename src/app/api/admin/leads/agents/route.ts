import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess } from '@/lib/admin-auth'

/**
 * Active admin users that a lead can be assigned to.
 * Read access is gated on the `leads` module (not `users`) so lead managers
 * can populate the assignee dropdown without full user-management rights.
 * Own-scope (sales) users can't assign, so they only get their own entry —
 * no reason to hand them the full staff roster.
 */
export async function GET() {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard
  try {
    const users = await db.adminUser.findMany({
      where:
        guard.access.scope === 'own'
          ? { active: true, id: guard.session.userId }
          : { active: true },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ agents: users })
  } catch (error) {
    console.error('Lead agents error:', error)
    return NextResponse.json({ error: 'Failed to load agents' }, { status: 500 })
  }
}
