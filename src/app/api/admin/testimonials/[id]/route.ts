import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('testimonials', false)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const item = await db.testimonial.findUnique({
      where: { id },
      include: { project: { select: { name: true, id: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Testimonials [id] GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('testimonials', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const { name, designation, content, rating, featured, projectId, status, sortOrder, photo, videoUrl } = await req.json()
    const item = await db.testimonial.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(designation !== undefined && { designation }), ...(content !== undefined && { content }), ...(rating !== undefined && { rating }), ...(featured !== undefined && { featured }), ...(projectId !== undefined && { projectId }), ...(status !== undefined && { status }), ...(sortOrder !== undefined && { sortOrder }), ...(photo !== undefined && { photo }), ...(videoUrl !== undefined && { videoUrl }) } })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Testimonials [id] PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('testimonials', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    await db.testimonial.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Testimonials [id] DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}