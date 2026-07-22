import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { DEFAULT_HEADER_MENU, DEFAULT_FOOTER_MENU } from '@/lib/menu-defaults'

/** Allowed menu locations. Anything else falls back to 'header'. */
function normalizeLocation(location: unknown): string {
  return location === 'footer' || location === 'mobile' ? location : 'header'
}

export async function GET() {
  const auth = await requirePermission('menu', false)
  if (auth instanceof Response) return auth
  try {
    const items = await db.menuItem.findMany({
      orderBy: [{ location: 'asc' }, { sortOrder: 'asc' }],
    })
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Menu GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('menu', true)
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()

    // Special action: seed default menu items (only when table is empty)
    if (body.seedDefaults === true) {
      const count = await db.menuItem.count()
      if (count > 0) {
        return NextResponse.json({ error: 'Menu is not empty — defaults can only be loaded into an empty menu' }, { status: 400 })
      }
      const data = [
        ...DEFAULT_HEADER_MENU.map((item, i) => ({ ...item, location: 'header', sortOrder: i, enabled: true })),
        ...DEFAULT_FOOTER_MENU.map((item, i) => ({ ...item, location: 'footer', sortOrder: i, enabled: true })),
      ]
      const result = await db.menuItem.createMany({ data })
      return NextResponse.json({ success: true, seeded: result.count }, { status: 201 })
    }

    const { label, href, icon, location, target, enabled, sortOrder } = body
    if (!label || !href) return NextResponse.json({ error: 'Label and href are required' }, { status: 400 })
    const item = await db.menuItem.create({
      data: {
        label,
        href,
        icon: icon || null,
        location: normalizeLocation(location),
        target: target === '_blank' ? '_blank' : '_self',
        enabled: enabled ?? true,
        sortOrder: sortOrder ?? 0,
      },
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('Menu POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('menu', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const { label, href, icon, location, target, enabled, sortOrder } = updates
    const item = await db.menuItem.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(href !== undefined && { href }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(location !== undefined && { location: normalizeLocation(location) }),
        ...(target !== undefined && { target: target === '_blank' ? '_blank' : '_self' }),
        ...(enabled !== undefined && { enabled }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })
    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Menu PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('menu', true)
  if (auth instanceof Response) return auth
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.menuItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Menu DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
