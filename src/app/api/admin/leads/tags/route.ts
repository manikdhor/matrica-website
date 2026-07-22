import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('leads', false)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const where = q ? { name: { contains: q } } : {}

    const tags = await db.leadTag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { leads: true } },
      },
    })

    return NextResponse.json(
      tags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        leadCount: t._count.leads,
        createdAt: t.createdAt,
      }))
    )
  } catch (error) {
    console.error('List tags error:', error)
    return NextResponse.json({ error: 'Failed to load tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('leads', true)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    const trimmed = name.trim()

    const existing = await db.leadTag.findUnique({ where: { name: trimmed } })
    if (existing) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 409 })
    }

    const tag = await db.leadTag.create({
      data: {
        name: trimmed,
        color: color || '#6366F1',
      },
    })

    return NextResponse.json({ success: true, tag }, { status: 201 })
  } catch (error) {
    console.error('Create tag error:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}