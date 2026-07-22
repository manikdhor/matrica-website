import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('settings', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    const { platform, url, icon, label, enabled, sortOrder } = await request.json()
    const link = await db.socialLink.update({
      where: { id },
      data: {
        ...(platform !== undefined && { platform }),
        ...(url !== undefined && { url }),
        ...(icon !== undefined && { icon }),
        ...(label !== undefined && { label }),
        ...(enabled !== undefined && { enabled }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })
    return NextResponse.json({ success: true, link })
  } catch (error) {
    console.error('social-links PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('settings', true)
  if (auth instanceof Response) return auth
  try {
    const { id } = await params
    await db.socialLink.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('social-links DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
