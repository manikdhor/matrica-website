import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess, findAccessibleLead } from '@/lib/admin-auth'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard
  const { id } = await params

  try {
    if (!(await findAccessibleLead(id, guard.session, guard.access))) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    const followUps = await db.leadFollowUp.findMany({
      where: { leadId: id },
      orderBy: { dueDate: 'asc' },
    })

    const today = new Date().toISOString().split('T')[0]

    const result = followUps.map((fu) => ({
      ...fu,
      isOverdue: fu.status === 'pending' && fu.dueDate < today,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get follow-ups error:', error)
    return NextResponse.json({ error: 'Failed to load follow-ups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 'status' capability = sales may schedule follow-ups on their own leads
  const guard = await requireLeadAccess('status')
  if (guard instanceof Response) return guard
  const auth = guard.session
  const { id } = await params

  try {
    if (!(await findAccessibleLead(id, guard.session, guard.access))) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    const body = await request.json()
    const { type, dueDate, dueTime, note } = body

    if (!dueDate?.trim()) {
      return NextResponse.json({ error: 'dueDate is required' }, { status: 400 })
    }

    const validTypes = ['call', 'email', 'meeting', 'whatsapp', 'other']
    const followUpType = type && validTypes.includes(type) ? type : 'call'

    const followUp = await db.leadFollowUp.create({
      data: {
        leadId: id,
        type: followUpType,
        dueDate: dueDate.trim(),
        dueTime: dueTime?.trim() || null,
        note: note?.trim() || null,
        createdBy: auth.username,
      },
    })

    await db.leadActivity.create({
      data: {
        leadId: id,
        type: 'note_added',
        description: `Follow-up scheduled: ${followUpType} on ${dueDate}`,
        createdBy: auth.username,
      },
    })

    return NextResponse.json({ success: true, followUp }, { status: 201 })
  } catch (error) {
    console.error('Create follow-up error:', error)
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 })
  }
}