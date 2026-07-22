import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('gallery', false)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const item = await db.galleryItem.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Gallery items [id] GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('gallery', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const { title, caption, mediaType, fileUrl, videoUrl, sortOrder, enabled, categoryId } = await req.json()
    const item = await db.galleryItem.update({ where: { id }, data: { ...(title !== undefined && { title }), ...(caption !== undefined && { caption }), ...(mediaType !== undefined && { mediaType }), ...(fileUrl !== undefined && { fileUrl }), ...(videoUrl !== undefined && { videoUrl }), ...(sortOrder !== undefined && { sortOrder }), ...(enabled !== undefined && { enabled }), ...(categoryId !== undefined && { categoryId }) } })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Gallery items [id] PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('gallery', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    await db.galleryItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gallery items [id] DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}