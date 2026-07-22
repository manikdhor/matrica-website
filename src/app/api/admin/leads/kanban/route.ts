import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess, leadScopeWhere } from '@/lib/admin-auth'
import { dhakaToday } from '@/lib/dhaka-date'

const STATUSES = [
  'new',
  'contacted',
  'qualified',
  'site_visit',
  'negotiation',
  'won',
  'lost',
] as const

export async function GET() {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard

  try {
    const today = dhakaToday()

    const leads = await db.lead.findMany({
      where: leadScopeWhere(guard.session, guard.access),
      include: {
        project: { select: { name: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        followUps: {
          where: { status: 'pending', dueDate: { lt: today } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const grouped: Record<string, {
      status: string
      label: string
      count: number
      leads: Array<{
        id: string
        name: string
        phone: string
        email: string | null
        source: string
        projectName: string
        priority: string
        score: number
        aiScore: number | null
        aiNextAction: string | null
        tags: Array<{ id: string; name: string; color: string }>
        assignedTo: string | null
        createdAt: string
        overdueFollowUps: number
      }>
    }> = {}

    for (const s of STATUSES) {
      grouped[s] = {
        status: s,
        label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        count: 0,
        leads: [],
      }
    }

    for (const lead of leads) {
      const status = lead.status as string
      if (!grouped[status]) continue

      grouped[status].count++
      grouped[status].leads.push({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        projectName: lead.project?.name || '',
        priority: lead.priority,
        score: lead.score,
        aiScore: lead.aiScore,
        aiNextAction: lead.aiNextAction,
        tags: lead.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
        assignedTo: lead.assignedTo,
        createdAt: lead.createdAt.toISOString(),
        overdueFollowUps: lead.followUps.length,
      })
    }

    return NextResponse.json({ columns: Object.values(grouped) })
  } catch (error) {
    console.error('Kanban data error:', error)
    return NextResponse.json({ error: 'Failed to load kanban data' }, { status: 500 })
  }
}