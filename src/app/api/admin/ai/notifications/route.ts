import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('ai', false)
  if (auth instanceof Response) return auth

  try {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const notifications: Array<{
      id: string
      type: string
      severity: 'high' | 'medium' | 'low'
      title: string
      message: string
      link: string
      leadId: string
      leadName: string
      createdAt: Date
    }> = []

    // 1. New leads older than 3 days without contact (status still 'new')
    const staleNewLeads = await db.lead.findMany({
      where: {
        status: 'new',
        createdAt: { lt: threeDaysAgo },
      },
      select: { id: true, name: true, phone: true, createdAt: true, source: true },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    for (const lead of staleNewLeads) {
      const daysOld = Math.floor(
        (now.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      notifications.push({
        id: `stale-${lead.id}`,
        type: 'stale_lead',
        severity: 'medium',
        title: `⏰ Uncontacted lead: ${lead.name}`,
        message: `${lead.name} (${lead.source}) has been waiting ${daysOld} days with no contact made.`,
        link: `/admin/leads?id=${lead.id}`,
        leadId: lead.id,
        leadName: lead.name,
        createdAt: lead.createdAt,
      })
    }

    // 2. Hot leads (aiScore >= 70) that haven't been contacted (status still 'new')
    const hotLeads = await db.lead.findMany({
      where: {
        aiScore: { gte: 70 },
        status: 'new',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        aiScore: true,
        aiNextAction: true,
        createdAt: true,
        source: true,
      },
      orderBy: { aiScore: 'desc' },
      take: 15,
    })

    for (const lead of hotLeads) {
      notifications.push({
        id: `hot-${lead.id}`,
        type: 'hot_lead_untouched',
        severity: 'high',
        title: `🔥 Hot lead uncontacted: ${lead.name}`,
        message: `${lead.name} scored ${lead.aiScore}/100 but is still in 'new' status. Suggested: ${lead.aiNextAction || 'Contact immediately'}.`,
        link: `/admin/leads?id=${lead.id}`,
        leadId: lead.id,
        leadName: lead.name,
        createdAt: lead.createdAt,
      })
    }

    // 3. Leads going cold (no activity in 7+ days, not closed/lost)
    const leadsWithRecentActivity = await db.leadActivity.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: { leadId: true },
      distinct: ['leadId'],
    })
    const activeLeadIds = new Set(leadsWithRecentActivity.map((a) => a.leadId))

    // Also exclude leads with recent follow-ups
    const recentFollowUps = await db.leadFollowUp.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: { leadId: true },
      distinct: ['leadId'],
    })
    for (const f of recentFollowUps) activeLeadIds.add(f.leadId)

    // Also exclude leads with recent notes
    const recentNotes = await db.leadNote.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: { leadId: true },
      distinct: ['leadId'],
    })
    for (const n of recentNotes) activeLeadIds.add(n.leadId)

    const coldLeads = await db.lead.findMany({
      where: {
        id: { notIn: Array.from(activeLeadIds) },
        status: { notIn: ['won', 'lost'] },
        createdAt: { lt: sevenDaysAgo },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        aiScore: true,
        createdAt: true,
        source: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'asc' },
      take: 15,
    })

    for (const lead of coldLeads) {
      const daysInactive = Math.floor(
        (now.getTime() - lead.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      notifications.push({
        id: `cold-${lead.id}`,
        type: 'cold_lead',
        severity: lead.aiScore && lead.aiScore >= 50 ? 'high' : 'low',
        title: `❄️ Lead going cold: ${lead.name}`,
        message: `No activity for ${daysInactive} days. Status: ${lead.status}${lead.aiScore ? `, AI score: ${lead.aiScore}` : ''}.`,
        link: `/admin/leads?id=${lead.id}`,
        leadId: lead.id,
        leadName: lead.name,
        createdAt: lead.updatedAt,
      })
    }

    // Sort by severity priority: high first, then medium, then low
    const severityOrder = { high: 0, medium: 1, low: 2 }
    notifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return NextResponse.json({
      notifications,
      summary: {
        total: notifications.length,
        high: notifications.filter((n) => n.severity === 'high').length,
        medium: notifications.filter((n) => n.severity === 'medium').length,
        low: notifications.filter((n) => n.severity === 'low').length,
      },
    })
  } catch (error) {
    console.error('AI Notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart notifications' },
      { status: 500 }
    )
  }
}