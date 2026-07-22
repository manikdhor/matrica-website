import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess, leadScopeWhere } from '@/lib/admin-auth'
import { dhakaToday } from '@/lib/dhaka-date'

export async function GET() {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard
  const { session, access } = guard

  try {
    const today = dhakaToday()
    const scope = leadScopeWhere(session, access)

    const overdueFollowUps = await db.leadFollowUp.findMany({
      where: {
        status: 'pending',
        dueDate: { lt: today },
        ...(access.scope === 'own' ? { lead: scope } : {}),
      },
      include: {
        lead: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    const result = overdueFollowUps.map((fu) => ({
      id: fu.id,
      type: fu.type,
      dueDate: fu.dueDate,
      dueTime: fu.dueTime,
      note: fu.note,
      status: fu.status,
      createdAt: fu.createdAt,
      leadId: fu.leadId,
      leadName: fu.lead.name,
      leadPhone: fu.lead.phone,
    }))

    return NextResponse.json({
      count: result.length,
      followUps: result,
    })
  } catch (error) {
    console.error('Get overdue follow-ups error:', error)
    return NextResponse.json({ error: 'Failed to load overdue follow-ups' }, { status: 500 })
  }
}