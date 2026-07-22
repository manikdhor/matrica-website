import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess, findAccessibleLead } from '@/lib/admin-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 'status' capability = sales may manage follow-ups on their own leads
  const guard = await requireLeadAccess('status')
  if (guard instanceof Response) return guard
  const auth = guard.session
  const { id } = await params

  try {
    const existing = await db.leadFollowUp.findUnique({ where: { id } })
    if (!existing || !(await findAccessibleLead(existing.leadId, guard.session, guard.access))) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 })
    }

    const body = await request.json()
    const { status, note, dueDate, dueTime } = body

    const updateData: Record<string, unknown> = {}
    if (note !== undefined) updateData.note = note?.trim() || null
    if (dueDate !== undefined) updateData.dueDate = dueDate.trim()
    if (dueTime !== undefined) updateData.dueTime = dueTime?.trim() || null

    if (status !== undefined) {
      updateData.status = status
      if (status === 'completed' && !existing.completedAt) {
        updateData.completedAt = new Date()
      }
      if (status === 'pending') {
        updateData.completedAt = null
      }
    }

    const followUp = await db.leadFollowUp.update({
      where: { id },
      data: updateData,
    })

    await db.leadActivity.create({
      data: {
        leadId: existing.leadId,
        type: 'note_added',
        description:
          status === 'completed'
            ? 'Follow-up marked as completed'
            : status === 'cancelled'
            ? 'Follow-up cancelled'
            : 'Follow-up updated',
        createdBy: auth.username,
      },
    })

    return NextResponse.json({ success: true, followUp })
  } catch (error) {
    console.error('Update follow-up error:', error)
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireLeadAccess('status')
  if (guard instanceof Response) return guard
  const auth = guard.session
  const { id } = await params

  try {
    const existing = await db.leadFollowUp.findUnique({ where: { id } })
    if (!existing || !(await findAccessibleLead(existing.leadId, guard.session, guard.access))) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 })
    }

    await db.leadFollowUp.delete({ where: { id } })

    await db.leadActivity.create({
      data: {
        leadId: existing.leadId,
        type: 'note_added',
        description: 'Follow-up deleted',
        createdBy: auth.username,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete follow-up error:', error)
    return NextResponse.json({ error: 'Failed to delete follow-up' }, { status: 500 })
  }
}