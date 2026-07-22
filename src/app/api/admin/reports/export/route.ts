import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

function escapeCsvField(value: string | null | undefined): string {
  const str = value ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission('reports', false)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from') || ''
    const toParam = searchParams.get('to') || ''

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

    const leads = await db.lead.findMany({
      where: dateFilter.createdAt ? dateFilter : undefined,
      include: { project: { select: { id: true, name: true } } },
    })

    const totalLeads = leads.length
    const wonLeads = leads.filter((l) => l.status === 'won').length
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    // ── Section 1: Lead Source Breakdown ──
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

    // ── Section 2: Status Distribution ──
    const statusMap = new Map<string, number>()
    leads.forEach((l) => {
      statusMap.set(l.status, (statusMap.get(l.status) || 0) + 1)
    })
    const statusDistribution = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // ── Section 3: Project Performance ──
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

    const projectPerformance = Array.from(projectMap.entries())
      .map(([, v]) => {
        const pLeads = v.leads
        const pWon = pLeads.filter((l) => l.status === 'won').length
        const avgScore = v.scores.length > 0
          ? (v.scores.reduce((a, b) => a + b, 0) / v.scores.length).toFixed(1)
          : '0'
        return {
          project: v.name,
          leadCount: pLeads.length,
          wonCount: pWon,
          conversionRate: pLeads.length > 0 ? Number(((pWon / pLeads.length) * 100).toFixed(1)) : 0,
          avgScore: Number(avgScore),
        }
      })
      .sort((a, b) => b.leadCount - a.leadCount)

    // ── Build CSV ──
    const lines: string[] = []

    // Summary header
    lines.push(`Report Date,${new Date().toISOString().split('T')[0]}`)
    lines.push(`Date Range,${fromParam || 'All'} to ${toParam || 'All'}`)
    lines.push('')
    lines.push(`Total Leads,${totalLeads}`)
    lines.push(`Won Leads,${wonLeads}`)
    lines.push(`Conversion Rate,${conversionRate}%`)
    lines.push('')

    // Lead Source Breakdown
    lines.push('LEAD SOURCE BREAKDOWN')
    lines.push('Source,Count,Percentage')
    for (const item of leadSourceBreakdown) {
      lines.push(`${escapeCsvField(item.source)},${item.count},${item.percentage}%`)
    }
    lines.push('')

    // Status Distribution
    lines.push('STATUS DISTRIBUTION')
    lines.push('Status,Count,Percentage')
    for (const item of statusDistribution) {
      lines.push(`${escapeCsvField(item.status)},${item.count},${item.percentage}%`)
    }
    lines.push('')

    // Project Performance
    lines.push('PROJECT PERFORMANCE')
    lines.push('Project,Leads,Won,Conversion Rate,Avg Score')
    for (const item of projectPerformance) {
      lines.push(
        `${escapeCsvField(item.project)},${item.leadCount},${item.wonCount},${item.conversionRate}%,${item.avgScore}`
      )
    }

    const bom = '\uFEFF'
    const csv = bom + lines.join('\n')
    const dateStr = new Date().toISOString().split('T')[0]

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reports-export-${dateStr}.csv"`,
      },
    })
  } catch (error) {
    console.error('Reports CSV export error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}