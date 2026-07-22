import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  const auth = await requirePermission('activityLog', false)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const action = searchParams.get('action')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.GlobalActivityWhereInput = {}

    if (entityType) {
      where.entityType = entityType
    }

    if (action) {
      where.action = action
    }

    if (search) {
      where.description = { contains: search }
    }

    const [activities, total] = await Promise.all([
      db.globalActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.globalActivity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Activity log error:', error)
    return NextResponse.json({ error: 'Failed to load activity log' }, { status: 500 })
  }
}