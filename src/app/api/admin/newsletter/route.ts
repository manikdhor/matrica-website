import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('newsletter', false)
  if (auth instanceof Response) return auth
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const exportCsv = searchParams.get('export') === 'csv'

  const where: Record<string, unknown> = {}
  if (search) where.email = { contains: search }

  if (exportCsv) {
    const subs = await db.newsletter.findMany({ where, orderBy: { createdAt: 'desc' } })
    const csvString = 'Email,Source,Active,Subscribed\n' + subs.map((s) => `"${s.email}","${s.source}",${s.active},"${s.createdAt.toISOString()}"`).join('\n')
    const csv = '\uFEFF' + csvString
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=newsletter.csv' } })
  }

  const [subs, total] = await Promise.all([
    db.newsletter.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    db.newsletter.count({ where }),
  ])
  return NextResponse.json({ subscribers: subs, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('newsletter', true)
  if (auth instanceof Response) return auth
  try {
    const { email, source, active } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    const sub = await db.newsletter.create({ data: { email, source: source || 'footer', active: active ?? true } })
    return NextResponse.json({ success: true, sub }, { status: 201 })
  } catch (error) {
    console.error('Newsletter POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('newsletter', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const { email, source, active } = updates
    const sub = await db.newsletter.update({ where: { id }, data: { ...(email !== undefined && { email }), ...(source !== undefined && { source }), ...(active !== undefined && { active }) } })
    return NextResponse.json({ success: true, sub })
  } catch (error) {
    console.error('Newsletter PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePermission('newsletter', true)
  if (auth instanceof Response) return auth
  const { ids, active } = await request.json()
  const result = await db.newsletter.updateMany({ where: { id: { in: ids } }, data: { active } })
  return NextResponse.json({ success: true, updated: result.count })
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('newsletter', true)
  if (auth instanceof Response) return auth
  const { id, ids } = await request.json()
  const idList: string[] = Array.isArray(ids) ? ids : id ? [id] : []
  if (idList.length === 0) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  const result = await db.newsletter.deleteMany({ where: { id: { in: idList } } })
  return NextResponse.json({ success: true, deleted: result.count })
}