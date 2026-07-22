import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess, canAccessLead } from '@/lib/admin-auth'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard
  const { id } = await params

  try {
    const lead = await db.lead.findUnique({ where: { id } })
    if (!lead || !canAccessLead(guard.session, guard.access, lead)) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const assignments = await db.leadTagAssignment.findMany({
      where: { leadId: id },
      include: { tag: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      assignments.map((a) => ({
        id: a.id,
        tagId: a.tag.id,
        tagName: a.tag.name,
        tagColor: a.tag.color,
        assignedAt: a.createdAt,
      }))
    )
  } catch (error) {
    console.error('Get lead tags error:', error)
    return NextResponse.json({ error: 'Failed to load tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireLeadAccess('edit')
  if (guard instanceof Response) return guard
  const auth = guard.session
  const { id } = await params

  try {
    const body = await request.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    const lead = await db.lead.findUnique({ where: { id } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const tag = await db.leadTag.findUnique({ where: { id: tagId } })
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    const existing = await db.leadTagAssignment.findUnique({
      where: { leadId_tagId: { leadId: id, tagId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Tag already assigned to this lead' }, { status: 409 })
    }

    const assignment = await db.leadTagAssignment.create({
      data: { leadId: id, tagId },
      include: { tag: true },
    })

    await db.leadActivity.create({
      data: {
        leadId: id,
        type: 'updated',
        description: `Tag "${tag.name}" assigned`,
        createdBy: auth.username,
      },
    })

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        tagId: assignment.tag.id,
        tagName: assignment.tag.name,
        tagColor: assignment.tag.color,
      },
    })
  } catch (error) {
    console.error('Assign tag error:', error)
    return NextResponse.json({ error: 'Failed to assign tag' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireLeadAccess('edit')
  if (guard instanceof Response) return guard
  const auth = guard.session
  const { id } = await params

  try {
    const body = await request.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    }

    const assignment = await db.leadTagAssignment.findUnique({
      where: { leadId_tagId: { leadId: id, tagId } },
    })
    if (!assignment) {
      return NextResponse.json({ error: 'Tag not assigned to this lead' }, { status: 404 })
    }

    const tag = await db.leadTag.findUnique({ where: { id: tagId } })

    await db.leadTagAssignment.delete({
      where: { leadId_tagId: { leadId: id, tagId } },
    })

    await db.leadActivity.create({
      data: {
        leadId: id,
        type: 'updated',
        description: `Tag "${tag?.name || tagId}" removed`,
        createdBy: auth.username,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove tag error:', error)
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
  }
}