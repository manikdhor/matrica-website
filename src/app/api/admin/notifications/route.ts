import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

// GET - list notifications (supports ?unread=true&limit=20)
export async function GET(request: NextRequest) {
  const auth = await requirePermission('dashboard', false)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (unreadOnly) where.read = false

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await db.notification.count({ where: { read: false } })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Notifications list error:', error)
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}

// POST - create a notification
export async function POST(request: NextRequest) {
  const auth = await requirePermission('dashboard', true)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { type, title, message, link } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'type, title, and message are required' }, { status: 400 })
    }

    const notification = await db.notification.create({
      data: {
        type,
        title,
        message,
        link: link || null,
        createdBy: auth.username,
      },
    })

    return NextResponse.json({ success: true, notification }, { status: 201 })
  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

// PUT - mark all as read (?all=true) or create bulk read
export async function PUT(request: NextRequest) {
  const auth = await requirePermission('dashboard', true)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const markAll = searchParams.get('all') === 'true'

    if (markAll) {
      await db.notification.updateMany({
        where: { read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Missing ?all=true parameter' }, { status: 400 })
  } catch (error) {
    console.error('Mark all read error:', error)
    return NextResponse.json({ error: 'Failed to mark notifications' }, { status: 500 })
  }
}