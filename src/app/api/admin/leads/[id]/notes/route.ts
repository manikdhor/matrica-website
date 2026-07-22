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
    const notes = await db.leadNote.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 'status' capability = sales may add remarks/notes on their own leads
  const guard = await requireLeadAccess('status')
  if (guard instanceof Response) return guard
  const auth = guard.session
  const { id } = await params

  try {
    if (!(await findAccessibleLead(id, guard.session, guard.access))) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    const { content } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const note = await db.leadNote.create({
      data: { content: content.trim(), createdBy: auth.username, leadId: id },
    })

    await db.leadActivity.create({
      data: {
        leadId: id,
        type: 'note_added',
        description: 'Note added',
        createdBy: auth.username,
      },
    })

    return NextResponse.json({ success: true, note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}