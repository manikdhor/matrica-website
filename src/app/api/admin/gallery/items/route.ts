import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const auth = await requirePermission('gallery', true)
  if (auth instanceof Response) return auth

  try {
    const body = await req.json()
    const { title, caption, mediaType, fileUrl, videoUrl, categoryId, sortOrder, enabled } = body

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const item = await db.galleryItem.create({
      data: {
        title: title || null,
        caption: caption || null,
        mediaType: mediaType || 'image',
        fileUrl: fileUrl || null,
        videoUrl: videoUrl || null,
        categoryId,
        sortOrder: sortOrder ?? 0,
        enabled: enabled !== false,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Gallery items POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}