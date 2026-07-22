import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess, canAccessLead } from '@/lib/admin-auth'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard
  const { session, access } = guard
  const { id } = await params

  try {
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        project: { select: { name: true } },
        notes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
        tags: {
          include: { tag: { select: { id: true, name: true, color: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    // 404 (not 403) for out-of-scope leads so own-scope users can't confirm existence
    if (!lead || !canAccessLead(session, access, lead)) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json(lead)
  } catch (error) {
    console.error('Lead detail error:', error)
    return NextResponse.json({ error: 'Failed to load lead' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireLeadAccess('status')
  if (guard instanceof Response) return guard
  const { session: auth, access } = guard
  const { id } = await params

  try {
    const body = await request.json()
    const { name, phone, email, status, priority, score, assignedTo, message } = body

    const existing = await db.lead.findUnique({ where: { id } })
    if (!existing || !canAccessLead(auth, access, existing)) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    // Capability-gated field whitelist: sales (own-scope) lands ONLY status;
    // every other field is ignored regardless of what the payload contains.
    if (access.canEdit) {
      if (name !== undefined) data.name = name
      if (phone !== undefined) data.phone = phone
      if (email !== undefined) data.email = email || null
      if (priority !== undefined) data.priority = priority
      if (score !== undefined) data.score = score
      if (message !== undefined) data.message = message || null
    }
    if (access.canAssign && assignedTo !== undefined) {
      data.assignedTo = assignedTo || null
    }
    if (access.canStatus && status !== undefined && status !== existing.status) {
      data.status = status
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No permitted fields to update' }, { status: 400 })
    }

    const lead = await db.lead.update({ where: { id }, data })

    // Log status change (only when status was actually written)
    if (data.status && status !== existing.status) {
      await db.leadActivity.create({
        data: {
          leadId: id,
          type: 'status_change',
          description: `Status changed from ${existing.status} to ${status}`,
          oldStatus: existing.status,
          newStatus: status,
          createdBy: auth.username,
        },
      })
    }

    // Log field updates
    const updates = Object.keys(data).filter((k) => k !== 'status')
    if (updates.length > 0) {
      await db.leadActivity.create({
        data: {
          leadId: id,
          type: 'updated',
          description: `Updated: ${updates.join(', ')}`,
          createdBy: auth.username,
        },
      })
    }

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Update lead error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireLeadAccess('edit')
  if (guard instanceof Response) return guard
  const { id } = await params

  try {
    await db.lead.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete lead error:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}