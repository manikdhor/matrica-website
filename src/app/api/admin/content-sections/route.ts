import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('content', false)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const section = await db.contentSection.findUnique({
        where: { sectionKey: key },
      })
      return NextResponse.json(section || null)
    }

    const sections = await db.contentSection.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(sections)
  } catch (error) {
    console.error('Content sections GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('content', true)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { sectionKey, title, subtitle, content, image, icon, config, status } = body

    if (!sectionKey) {
      return NextResponse.json({ error: 'sectionKey is required' }, { status: 400 })
    }

    const whitelistedData = { ...(title !== undefined && { title }), ...(subtitle !== undefined && { subtitle }), ...(content !== undefined && { content }), ...(image !== undefined && { image }), ...(icon !== undefined && { icon }), ...(config !== undefined && { config }), ...(status !== undefined && { status }) }

    // Upsert: if sectionKey exists, update; otherwise create
    const section = await db.contentSection.upsert({
      where: { sectionKey },
      update: whitelistedData,
      create: { sectionKey, ...whitelistedData },
    })

    return NextResponse.json({ success: true, section })
  } catch (error) {
    console.error('Content sections POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('content', true)
  if (auth instanceof Response) return auth

  try {
    const { id, title, subtitle, content, image, icon, config, status } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const section = await db.contentSection.update({
      where: { id },
      data: { ...(title !== undefined && { title }), ...(subtitle !== undefined && { subtitle }), ...(content !== undefined && { content }), ...(image !== undefined && { image }), ...(icon !== undefined && { icon }), ...(config !== undefined && { config }), ...(status !== undefined && { status }) },
    })

    return NextResponse.json({ success: true, section })
  } catch (error) {
    console.error('Content sections PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('content', true)
  if (auth instanceof Response) return auth

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.contentSection.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content sections DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}