import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requirePermission('testimonials', false)
  if (auth instanceof Response) return auth
  try {
    const [testimonials, projects] = await Promise.all([
      db.testimonial.findMany({ orderBy: { sortOrder: 'asc' }, include: { project: { select: { name: true } } } }),
      db.project.findMany({ select: { id: true, name: true } }),
    ])
    return NextResponse.json({ testimonials, projects })
  } catch (error) {
    console.error('Testimonials GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('testimonials', true)
  if (auth instanceof Response) return auth
  try {
    const { name, designation, content, rating, featured, projectId, status, sortOrder, photo, videoUrl } = await request.json()
    if (!name || !content) return NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
    const testimonial = await db.testimonial.create({ data: { name, designation, content, rating: rating ?? 5, featured: featured ?? false, projectId: projectId || null, status: status || 'active', sortOrder: sortOrder ?? 0, photo, videoUrl } })
    return NextResponse.json({ success: true, testimonial }, { status: 201 })
  } catch (error) {
    console.error('Testimonials POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('testimonials', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const { name, designation, content, rating, featured, projectId, status, sortOrder, photo, videoUrl } = updates
    const testimonial = await db.testimonial.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(designation !== undefined && { designation }), ...(content !== undefined && { content }), ...(rating !== undefined && { rating }), ...(featured !== undefined && { featured }), ...(projectId !== undefined && { projectId }), ...(status !== undefined && { status }), ...(sortOrder !== undefined && { sortOrder }), ...(photo !== undefined && { photo }), ...(videoUrl !== undefined && { videoUrl }) } })
    return NextResponse.json({ success: true, testimonial })
  } catch (error) {
    console.error('Testimonials PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('testimonials', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await request.json()
    await db.testimonial.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Testimonials DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}