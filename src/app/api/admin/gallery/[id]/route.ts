import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('gallery', false)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const category = await db.galleryCategory.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(category)
  } catch (error) {
    console.error('Gallery [id] GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('gallery', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const { name, slug, cover, sortOrder, enabled, projectId } = await req.json()
    const category = await db.galleryCategory.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(slug !== undefined && { slug }), ...(cover !== undefined && { cover }), ...(sortOrder !== undefined && { sortOrder }), ...(enabled !== undefined && { enabled }), ...(projectId !== undefined && { projectId }) } })
    return NextResponse.json(category)
  } catch (error) {
    console.error('Gallery [id] PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('gallery', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    await db.galleryCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gallery [id] DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}