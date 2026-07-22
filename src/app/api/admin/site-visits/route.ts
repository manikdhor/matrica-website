import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('siteVisits', false)
  if (auth instanceof Response) return auth
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    const bookings = await db.siteVisitBooking.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { project: { select: { name: true } } },
    })
    return NextResponse.json(bookings.map((b) => ({ ...b, projectName: b.project?.name || '—' })))
  } catch (error) {
    console.error('Site visits GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('siteVisits', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...data } = await request.json()
    const booking = await db.siteVisitBooking.update({ where: { id }, data })
    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Site visits PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('siteVisits', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await request.json()
    await db.siteVisitBooking.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Site visits DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}