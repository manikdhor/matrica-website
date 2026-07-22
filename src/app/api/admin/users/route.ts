import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { normalizeRole, ROLE_PRESETS } from '@/lib/permissions'
import bcrypt from 'bcryptjs'

const USER_SELECT = {
  id: true,
  username: true,
  name: true,
  role: true,
  permissions: true,
  active: true,
  lastLogin: true,
  createdAt: true,
} as const

const VALID_ROLES = [...Object.keys(ROLE_PRESETS), 'custom']

function isSuperAdmin(role: string): boolean {
  return normalizeRole(role) === 'super_admin'
}

/** Serialize + validate the permissions payload; returns undefined if not provided. */
function serializePermissions(permissions: unknown): string | null | undefined {
  if (permissions === undefined) return undefined
  if (permissions === null || permissions === '') return null
  let obj = permissions
  if (typeof permissions === 'string') {
    try {
      obj = JSON.parse(permissions)
    } catch {
      return undefined
    }
  }
  const p = obj as { modules?: unknown; readOnly?: unknown }
  if (p && typeof p === 'object' && (p.modules === '*' || Array.isArray(p.modules))) {
    return JSON.stringify({ modules: p.modules, readOnly: !!p.readOnly })
  }
  return undefined
}

/** True if `userId` is the last remaining active super admin. */
async function isLastActiveSuperAdmin(userId: string): Promise<boolean> {
  const target = await db.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, active: true },
  })
  if (!target || !target.active || !isSuperAdmin(target.role)) return false
  const admins = await db.adminUser.findMany({
    where: { active: true },
    select: { id: true, role: true },
  })
  const supers = admins.filter((a) => isSuperAdmin(a.role))
  return supers.length <= 1 && supers.some((a) => a.id === userId)
}

export async function GET() {
  const auth = await requirePermission('users', false)
  if (auth instanceof NextResponse) return auth
  try {
    const users = await db.adminUser.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('users', true)
  if (auth instanceof NextResponse) return auth
  try {
    const { username, name, password, role, permissions } = await request.json()

    if (!username || !name || !password) {
      return NextResponse.json(
        { error: 'Username, name and password are required' },
        { status: 400 }
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    const roleValue = role && VALID_ROLES.includes(role) ? role : 'manager'

    // Only a super admin may mint another super admin.
    if (isSuperAdmin(roleValue) && !isSuperAdmin(auth.role)) {
      return NextResponse.json(
        { error: 'Only a super admin can create super admin accounts' },
        { status: 403 }
      )
    }

    const existing = await db.adminUser.findUnique({ where: { username: String(username).trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await db.adminUser.create({
      data: {
        username: username.trim(),
        name: name.trim(),
        password: hashed,
        role: roleValue,
        permissions: serializePermissions(permissions) ?? null,
        active: true,
      },
      select: USER_SELECT,
    })
    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('users', true)
  if (auth instanceof NextResponse) return auth
  try {
    const { id, name, role, permissions, active, password } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const target = await db.adminUser.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const isSelf = id === auth.userId

    // Only a super admin may touch super admin accounts or grant the role.
    if (!isSuperAdmin(auth.role)) {
      if (isSuperAdmin(target.role)) {
        return NextResponse.json(
          { error: 'Only a super admin can modify a super admin account' },
          { status: 403 }
        )
      }
      if (role !== undefined && isSuperAdmin(role)) {
        return NextResponse.json(
          { error: 'Only a super admin can grant the super admin role' },
          { status: 403 }
        )
      }
    }

    // Guard rails: cannot deactivate or demote yourself.
    if (isSelf && active === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      )
    }
    if (isSelf && role !== undefined && isSuperAdmin(target.role) && !isSuperAdmin(role)) {
      return NextResponse.json(
        { error: 'You cannot demote your own account' },
        { status: 400 }
      )
    }

    // Guard rails: keep at least one active super admin.
    const losesSuperAdmin =
      active === false || (role !== undefined && isSuperAdmin(target.role) && !isSuperAdmin(role))
    if (losesSuperAdmin && (await isLastActiveSuperAdmin(id))) {
      return NextResponse.json(
        { error: 'Cannot remove the last active super admin' },
        { status: 400 }
      )
    }

    if (role !== undefined && !VALID_ROLES.includes(role) && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    if (password !== undefined && password !== '' && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const permValue = serializePermissions(permissions)
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined
    // Transaction re-checks the last-super-admin invariant so concurrent
    // demotions can't leave zero active super admins.
    const user = await db.$transaction(async (tx) => {
      const updated = await tx.adminUser.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(role !== undefined && { role }),
          ...(permValue !== undefined && { permissions: permValue }),
          ...(active !== undefined && { active: !!active }),
          ...(hashedPassword ? { password: hashedPassword } : {}),
        },
        select: USER_SELECT,
      })
      const admins = await tx.adminUser.findMany({
        where: { active: true },
        select: { role: true },
      })
      if (!admins.some((a) => isSuperAdmin(a.role))) {
        throw new Error('LAST_SUPER_ADMIN')
      }
      return updated
    })

    // Deactivation kills existing sessions immediately.
    if (active === false) {
      await db.adminSession.deleteMany({ where: { userId: id } }).catch(() => {})
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot remove the last active super admin' },
        { status: 400 }
      )
    }
    console.error('Users PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('users', true)
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (id === auth.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }
    const target = await db.adminUser.findUnique({ where: { id }, select: { role: true } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (isSuperAdmin(target.role) && !isSuperAdmin(auth.role)) {
      return NextResponse.json(
        { error: 'Only a super admin can delete a super admin account' },
        { status: 403 }
      )
    }
    if (await isLastActiveSuperAdmin(id)) {
      return NextResponse.json(
        { error: 'Cannot delete the last active super admin' },
        { status: 400 }
      )
    }

    await db.$transaction(async (tx) => {
      await tx.adminUser.delete({ where: { id } })
      const admins = await tx.adminUser.findMany({
        where: { active: true },
        select: { role: true },
      })
      if (!admins.some((a) => isSuperAdmin(a.role))) {
        throw new Error('LAST_SUPER_ADMIN')
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete the last active super admin' },
        { status: 400 }
      )
    }
    console.error('Users DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
