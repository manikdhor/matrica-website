import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { UI_REGISTRY, UI_GROUPS, UI_DEFAULTS } from '@/lib/ui-strings'

/**
 * GET  → grouped registry with current (DB-overridden) values, for the editor.
 * PUT  → save one or many overrides { updates: [{key, value}] }.
 * DELETE → reset a key to its bundled default { key }.
 */
export async function GET() {
  const auth = await requirePermission('content', false)
  if (auth instanceof Response) return auth
  try {
    const rows = await db.uiString.findMany({ select: { key: true, value: true } })
    const overrides = new Map(rows.map((r) => [r.key, r.value]))
    const groups = Object.entries(UI_GROUPS).map(([name, g]) => ({
      name,
      label: g.label,
      items: g.keys.map((key) => ({
        key,
        value: overrides.get(key) ?? UI_DEFAULTS[key] ?? '',
        default: UI_DEFAULTS[key] ?? '',
        overridden: overrides.has(key) && overrides.get(key) !== UI_DEFAULTS[key],
      })),
    }))
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('ui-strings admin GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

function groupOf(key: string): string {
  for (const [name, g] of Object.entries(UI_REGISTRY)) if (key in g.strings) return name
  return 'general'
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('content', true)
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    const updates: { key: string; value: string }[] = Array.isArray(body.updates)
      ? body.updates
      : body.key !== undefined
        ? [{ key: body.key, value: body.value }]
        : []
    if (updates.length === 0) return NextResponse.json({ error: 'no updates' }, { status: 400 })

    await db.$transaction(
      updates.map((u) =>
        db.uiString.upsert({
          where: { key: u.key },
          update: { value: String(u.value ?? '') },
          create: { key: u.key, value: String(u.value ?? ''), groupName: groupOf(u.key) },
        }),
      ),
    )
    return NextResponse.json({ success: true, count: updates.length })
  } catch (error) {
    console.error('ui-strings admin PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('content', true)
  if (auth instanceof Response) return auth
  try {
    const { key } = await request.json()
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })
    await db.uiString.deleteMany({ where: { key } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ui-strings admin DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
