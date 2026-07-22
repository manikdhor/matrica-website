import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requirePermission('gallery', false)
  if (auth instanceof Response) return auth
  try {
    const categories = await db.galleryCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Gallery GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('gallery', true)
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    const cat = await db.galleryCategory.create({ data: body })
    return NextResponse.json({ success: true, category: cat }, { status: 201 })
  } catch (error) {
    console.error('Gallery POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('gallery', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...data } = await request.json()
    const cat = await db.galleryCategory.update({ where: { id }, data })
    return NextResponse.json({ success: true, category: cat })
  } catch (error) {
    console.error('Gallery PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('gallery', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await request.json()
    await db.galleryCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gallery DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}