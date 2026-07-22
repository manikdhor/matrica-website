import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requirePermission('settings', false)
  if (auth instanceof Response) return auth
  try {
    const links = await db.socialLink.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(links)
  } catch (error) {
    console.error('social-links GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('settings', true)
  if (auth instanceof Response) return auth
  try {
    const { platform, url, icon, label, enabled, sortOrder } = await request.json()
    if (!platform || !url) return NextResponse.json({ error: 'platform and url are required' }, { status: 400 })
    const link = await db.socialLink.create({
      data: {
        platform, url, icon: icon || 'Globe', label: label ?? null,
        enabled: enabled !== false, sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    })
    return NextResponse.json({ success: true, link })
  } catch (error) {
    console.error('social-links POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
