import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('siteVisits', false)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const booking = await db.siteVisitBooking.findUnique({
      where: { id },
      include: { project: { select: { name: true, slug: true } } },
    })
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(booking)
  } catch (error) {
    console.error('Site visits [id] GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('siteVisits', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const { name, phone, email, projectId, preferredDate, preferredTime, peopleCount, freeTransport, message, status, notes } = await req.json()
    const booking = await db.siteVisitBooking.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(phone !== undefined && { phone }), ...(email !== undefined && { email }), ...(projectId !== undefined && { projectId }), ...(preferredDate !== undefined && { preferredDate }), ...(preferredTime !== undefined && { preferredTime }), ...(peopleCount !== undefined && { peopleCount }), ...(freeTransport !== undefined && { freeTransport }), ...(message !== undefined && { message }), ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) } })
    return NextResponse.json(booking)
  } catch (error) {
    console.error('Site visits [id] PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('siteVisits', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    await db.siteVisitBooking.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Site visits [id] DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}