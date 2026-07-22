import { requireLeadAccess, leadScopeWhere } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard
  const scope = leadScopeWhere(guard.session, guard.access)

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    const dow = (todayStart.getDay() + 6) % 7 // 0=Mon … 6=Sun
    weekStart.setDate(todayStart.getDate() - dow) // Monday-based week start

    const [
      total,
      byStatus,
      bySource,
      byPriority,
      todayCount,
      weekCount,
    ] = await Promise.all([
      db.lead.count({ where: scope }),
      db.lead.groupBy({ by: ['status'], _count: { status: true }, where: scope }),
      db.lead.groupBy({ by: ['source'], _count: { source: true }, where: scope }),
      db.lead.groupBy({ by: ['priority'], _count: { priority: true }, where: scope }),
      db.lead.count({ where: { ...scope, createdAt: { gte: todayStart } } }),
      db.lead.count({ where: { ...scope, createdAt: { gte: weekStart } } }),
    ])

    const statusMap: Record<string, number> = {}
    byStatus.forEach((s) => { statusMap[s.status] = s._count.status })

    const sourceMap: Record<string, number> = {}
    bySource.forEach((s) => { sourceMap[s.source] = s._count.source })

    const priorityMap: Record<string, number> = {}
    byPriority.forEach((p) => { priorityMap[p.priority] = p._count.priority })

    return NextResponse.json({
      total,
      byStatus: statusMap,
      bySource: sourceMap,
      byPriority: priorityMap,
      todayCount,
      weekCount,
    })
  } catch (error) {
    console.error('Failed to fetch lead stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}