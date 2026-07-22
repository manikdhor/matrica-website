import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('leads', true)
  if (auth instanceof Response) return auth
  const { id } = await params

  try {
    const body = await request.json()
    const { name, color } = body

    const existing = await db.leadTag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    const data: Record<string, string> = {}
    if (name !== undefined) {
      const trimmed = name.trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'Tag name cannot be empty' }, { status: 400 })
      }
      if (trimmed !== existing.name) {
        const duplicate = await db.leadTag.findUnique({ where: { name: trimmed } })
        if (duplicate) {
          return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 409 })
        }
        data.name = trimmed
      }
    }
    if (color !== undefined) data.color = color

    const tag = await db.leadTag.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, tag })
  } catch (error) {
    console.error('Update tag error:', error)
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('leads', true)
  if (auth instanceof Response) return auth
  const { id } = await params

  try {
    const existing = await db.leadTag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    await db.leadTag.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete tag error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}