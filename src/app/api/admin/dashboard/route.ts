import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: Request) {
  const auth = await requirePermission('dashboard', false)
  if (auth instanceof Response) return auth

  // Badge counts mode (lightweight, no charts) - check first before heavy queries
  const { searchParams } = new URL(request.url)
  if (searchParams.get('badgeCounts') === 'true') {
    try {
      const [newLeadsCount, pendingVisitsCount] = await Promise.all([
        db.lead.count({ where: { status: 'new' } }),
        db.siteVisitBooking.count({ where: { status: 'pending' } }),
      ])
      return NextResponse.json({
        badgeCounts: { newLeads: newLeadsCount, pendingVisits: pendingVisitsCount },
      })
    } catch (error) {
      console.error('Badge counts error:', error)
      return NextResponse.json({ badgeCounts: { newLeads: 0, pendingVisits: 0 } })
    }
  }

  try {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    // Build date filter for stats/charts
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

    const [
      totalLeads,
      newLeads,
      allLeads,
      totalSiteVisits,
      pendingSiteVisits,
      wonLeads,
      recentLeads,
      recentSiteVisits,
      leadsBySourceRaw,
      leadsByStatusRaw,
      leadsTrendRaw,
      upcomingVisits,
    ] = await Promise.all([
      db.lead.count({ where: dateFilter }),
      db.lead.count({ where: { ...dateFilter, status: 'new' } }),
      db.lead.findMany({
        where: dateFilter,
        select: { status: true, source: true, createdAt: true },
      }),
      db.siteVisitBooking.count({
        where: dateFilter.createdAt
          ? { createdAt: dateFilter.createdAt }
          : undefined,
      }),
      db.siteVisitBooking.count({
        where: {
          status: 'pending',
          ...(dateFilter.createdAt
            ? { createdAt: dateFilter.createdAt }
            : {}),
        },
      }),
      db.lead.count({
        where: { ...dateFilter, status: 'won' },
      }),
      db.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { name: true } } },
      }),
      db.siteVisitBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { name: true } } },
      }),
      db.lead.groupBy({
        by: ['source'],
        where: dateFilter.createdAt ? dateFilter : undefined,
        _count: { source: true },
      }),
      db.lead.groupBy({
        by: ['status'],
        where: dateFilter.createdAt ? dateFilter : undefined,
        _count: { status: true },
      }),
      db.lead.findMany({
        where: dateFilter.createdAt
          ? { createdAt: dateFilter.createdAt }
          : undefined,
        select: { createdAt: true },
      }),
      // Upcoming site visits: next 5 pending or confirmed, ordered by preferredDate ASC
      db.siteVisitBooking.findMany({
        where: {
          status: { in: ['pending', 'confirmed'] },
          preferredDate: { gte: todayStart.toISOString().split('T')[0] },
        },
        orderBy: { preferredDate: 'asc' },
        take: 5,
        include: { project: { select: { name: true } } },
      }),
    ])

    const todayLeads = allLeads.filter((l) => l.createdAt >= todayStart).length
    const weekLeads = allLeads.filter((l) => l.createdAt >= weekStart).length

    // Leads by source
    const leadsBySource = leadsBySourceRaw.map((s) => ({
      source: s.source || 'unknown',
      count: s._count.source,
    }))

    // Leads by status (for funnel)
    const leadsByStatus = leadsByStatusRaw.map((s) => ({
      status: s.status || 'unknown',
      count: s._count.status,
    }))

    // Funnel data: ordered by pipeline stages
    const funnelOrder = ['new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'won']
    const funnelData = funnelOrder
      .map((status) => {
        const found = leadsByStatusRaw.find((s) => s.status === status)
        return { status, count: found ? found._count.status : 0 }
      })
      .filter((d) => d.count > 0 || true) // always include all stages

    // Leads trend (last 30 days grouped by date)
    const trendDays = fromParam && toParam
      ? Math.min(90, Math.max(7, Math.ceil((new Date(toParam).getTime() - new Date(fromParam).getTime()) / 86400000)))
      : 30

    const trendMap = new Map<string, number>()
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      trendMap.set(d.toISOString().split('T')[0], 0)
    }
    leadsTrendRaw.forEach((l) => {
      const key = l.createdAt.toISOString().split('T')[0]
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) || 0) + 1)
    })
    const leadsTrend = Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    }))

    return NextResponse.json({
      stats: {
        totalLeads,
        newLeads,
        todayLeads,
        weekLeads,
        totalSiteVisits,
        pendingSiteVisits,
        conversionRate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
      },
      leadsBySource,
      leadsByStatus,
      leadsTrend,
      funnelData,
      recentLeads: recentLeads.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        source: l.source,
        status: l.status,
        projectName: l.project?.name || '—',
        createdAt: l.createdAt,
      })),
      recentSiteVisits: recentSiteVisits.map((v) => ({
        id: v.id,
        name: v.name,
        phone: v.phone,
        preferredDate: v.preferredDate,
        status: v.status,
        projectName: v.project?.name || '—',
        createdAt: v.createdAt,
      })),
      upcomingVisits: upcomingVisits.map((v) => ({
        id: v.id,
        name: v.name,
        phone: v.phone,
        preferredDate: v.preferredDate,
        preferredTime: v.preferredTime,
        status: v.status,
        projectName: v.project?.name || '—',
      })),
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}