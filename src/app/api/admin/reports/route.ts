import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: Request) {
  const auth = await requirePermission('reports', false)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Build date filter
    let dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {}
    if (fromParam || toParam) {
      dateFilter.createdAt = {}
      if (fromParam) dateFilter.createdAt.gte = new Date(fromParam)
      if (toParam) {
        const to = new Date(toParam)
        to.setHours(23, 59, 59, 999)
        dateFilter.createdAt.lte = to
      }
    }

    // Fetch leads with project and site visit data
    const leads = await db.lead.findMany({
      where: dateFilter.createdAt ? dateFilter : undefined,
      include: { project: { select: { id: true, name: true } } },
    })

    const totalLeads = leads.length
    const wonLeads = leads.filter((l) => l.status === 'won').length
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    // ── Lead Source Breakdown ──
    const sourceMap = new Map<string, number>()
    leads.forEach((l) => {
      const src = l.source || 'unknown'
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
    })
    const leadSourceBreakdown = Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // ── Lead Performance by Project ──
    const projectMap = new Map<string, { name: string; leads: typeof leads; scores: number[] }>()
    leads.forEach((l) => {
      const pKey = l.projectId || '__none__'
      const pName = l.project?.name || 'No Project'
      if (!projectMap.has(pKey)) {
        projectMap.set(pKey, { name: pName, leads: [], scores: [] })
      }
      const entry = projectMap.get(pKey)!
      entry.leads.push(l)
      entry.scores.push(l.score)
    })

    const leadPerformanceByProject = Array.from(projectMap.entries())
      .map(([, v]) => {
        const pLeads = v.leads
        const pWon = pLeads.filter((l) => l.status === 'won').length
        const avgScore = v.scores.length > 0
          ? (v.scores.reduce((a, b) => a + b, 0) / v.scores.length).toFixed(1)
          : '0'
        return {
          project: v.name,
          leadCount: pLeads.length,
          conversionRate: pLeads.length > 0 ? Number(((pWon / pLeads.length) * 100).toFixed(1)) : 0,
          avgScore: Number(avgScore),
        }
      })
      .sort((a, b) => b.leadCount - a.leadCount)

    // ── Status Distribution Over Time (last 4 weeks) ──
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const statusOrder = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won', 'lost']

    const weeks: { week: string; statuses: Record<string, number> }[] = []
    for (let w = 3; w >= 0; w--) {
      // Half-open week window [weekStart, weekEndExclusive). weekStart is a midnight
      // and weekEndExclusive is the next week's midnight, so the four contiguous
      // windows tile the last 28 days without gaps or overlaps — every lead in range
      // is counted exactly once, including all of today for w=0.
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - w * 7 - 6)
      const weekEndExclusive = new Date(weekStart)
      weekEndExclusive.setDate(weekEndExclusive.getDate() + 7)
      const weekLabelEnd = new Date(weekStart)
      weekLabelEnd.setDate(weekLabelEnd.getDate() + 6)

      const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekLabelEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

      const weekLeads = leads.filter((l) => {
        const created = new Date(l.createdAt)
        return created >= weekStart && created < weekEndExclusive
      })

      const statuses: Record<string, number> = {}
      statusOrder.forEach((s) => { statuses[s] = 0 })
      weekLeads.forEach((l) => {
        statuses[l.status] = (statuses[l.status] || 0) + 1
      })

      const entry: { week: string; statuses: Record<string, number> } = { week: weekLabel, statuses }
      weeks.push(entry)
    }

    const statusDistributionOverTime = weeks

    // ── Top Performers (by assignedTo) ──
    const agentMap = new Map<string, { leads: typeof leads }>()
    leads.forEach((l) => {
      if (l.assignedTo) {
        if (!agentMap.has(l.assignedTo)) {
          agentMap.set(l.assignedTo, { leads: [] })
        }
        agentMap.get(l.assignedTo)!.leads.push(l)
      }
    })

    const topPerformers = Array.from(agentMap.entries())
      .map(([agent, v]) => {
        const aLeads = v.leads
        const aWon = aLeads.filter((l) => l.status === 'won').length
        return {
          agent,
          leadCount: aLeads.length,
          wonCount: aWon,
          conversionRate: aLeads.length > 0 ? Number(((aWon / aLeads.length) * 100).toFixed(1)) : 0,
        }
      })
      .sort((a, b) => b.leadCount - a.leadCount)

    // ── Site Visit Analytics ──
    const siteVisits = await db.siteVisitBooking.findMany({
      where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : undefined,
    })

    const totalBookings = siteVisits.length
    const completedVisits = siteVisits.filter((v) => v.status === 'completed').length
    const siteVisitConversionRate = totalBookings > 0
      ? Number(((completedVisits / totalBookings) * 100).toFixed(1))
      : 0

    const groupSizes = siteVisits.map((v) => v.peopleCount).filter((n) => n > 0)
    const avgGroupSize = groupSizes.length > 0
      ? Number((groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length).toFixed(1))
      : 0

    // Avg Response Time (time from lead created to first non-'new' status)
    const leadActivities = await db.leadActivity.findMany({
      where: {
        type: 'status_change',
        newStatus: { not: 'new' },
      },
      include: { lead: { select: { createdAt: true } } },
      orderBy: { createdAt: 'asc' },
    })

    // Group by lead, take earliest activity per lead
    const leadResponseMap = new Map<string, { leadCreated: Date; firstResponse: Date }>()
    leadActivities.forEach((a) => {
      if (!leadResponseMap.has(a.leadId) && a.lead) {
        leadResponseMap.set(a.leadId, {
          leadCreated: a.lead.createdAt,
          firstResponse: a.createdAt,
        })
      }
    })

    const responseTimes = Array.from(leadResponseMap.values())
      .filter((r) => r.firstResponse > r.leadCreated)
      .map((r) => r.firstResponse.getTime() - r.leadCreated.getTime())

    const avgResponseTimeMs = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    // Format as hours or minutes
    let avgResponseTime: string
    if (avgResponseTimeMs === 0) {
      avgResponseTime = 'N/A'
    } else if (avgResponseTimeMs < 3600000) {
      avgResponseTime = `${Math.round(avgResponseTimeMs / 60000)}m`
    } else {
      avgResponseTime = `${(avgResponseTimeMs / 3600000).toFixed(1)}h`
    }

    return NextResponse.json({
      summary: {
        totalLeads,
        conversionRate,
        avgResponseTime,
        totalBookings,
      },
      leadSourceBreakdown,
      leadPerformanceByProject,
      statusDistributionOverTime,
      topPerformers,
      siteVisitAnalytics: {
        totalBookings,
        completedVisits,
        conversionRate: siteVisitConversionRate,
        avgGroupSize,
      },
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}