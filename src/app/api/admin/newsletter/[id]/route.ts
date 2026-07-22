import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('newsletter', true)
  if (auth instanceof Response) return auth

  const { id } = await params
  await db.newsletter.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('newsletter', true)
  if (auth instanceof Response) return auth

  const { id } = await params
  const subscriber = await db.newsletter.findUnique({ where: { id } })
  if (!subscriber) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.newsletter.update({
    where: { id },
    data: { active: !subscriber.active },
  })

  return NextResponse.json(updated)
}