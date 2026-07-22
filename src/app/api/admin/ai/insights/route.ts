import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { aiChat } from '@/lib/ai'

async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 3000): Promise<string> {
  try {
    return await aiChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens, temperature: 0.5 }
    )
  } catch (e) {
    // Preserve previous behavior: empty AI content falls through to the data-driven fallback response
    if (e instanceof Error && e.message.startsWith('Empty response')) return ''
    throw e
  }
}

function parseJSON(text: string) {
  try { return JSON.parse(text) }
  catch {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    try {
      const startIdx = cleaned.indexOf('{')
      const endIdx = cleaned.lastIndexOf('}')
      if (startIdx !== -1 && endIdx !== -1) return JSON.parse(cleaned.slice(startIdx, endIdx + 1))
    } catch { /* ignore */ }
    return null
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('ai', true)
  if (auth instanceof NextResponse) return auth

  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // ── Gather comprehensive data ──────────────────────────────────────────
    const [
      totalLeads,
      leadsByStatus,
      leadsBySource,
      leadsByProject,
      recentLeads,
      leadsNoContact,
      leadsWithOverdue,
      wonLeads,
      lostLeads,
      totalSiteVisits,
      pendingSiteVisits,
      completedSiteVisits,
      overdueFollowUps,
      avgDaysToConvert,
      thisWeekLeads,
      lastWeekLeads,
      thisMonthLeads,
      lastMonthLeads,
      topTags,
      unassignedLeads,
    ] = await Promise.all([
      db.lead.count(),
      db.lead.groupBy({ by: ['status'], _count: true }),
      db.lead.groupBy({ by: ['source'], _count: true }),
      db.lead.groupBy({ by: ['projectId'], _count: { _all: true } }),
      db.lead.findMany({
        where: { createdAt: { gte: weekAgo } },
        include: { project: { select: { name: true } }, notes: { take: 3, select: { content: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      db.lead.count({ where: { status: 'new', createdAt: { lt: weekAgo } } }),
      db.lead.count({ where: {
        followUps: { some: { status: 'pending', dueDate: { lt: today } } },
        status: { notIn: ['won', 'lost'] },
      }}),
      db.lead.count({ where: { status: 'won' } }),
      db.lead.count({ where: { status: 'lost' } }),
      db.siteVisitBooking.count(),
      db.siteVisitBooking.count({ where: { status: 'pending' } }),
      db.siteVisitBooking.count({ where: { status: 'completed' } }),
      db.leadFollowUp.count({ where: { status: 'pending', dueDate: { lt: today } } }),
      // Average days to convert (won leads)
      db.lead.findMany({
        where: { status: 'won' },
        select: { createdAt: true, updatedAt: true },
        take: 50,
      }),
      db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
      db.lead.count({ where: { createdAt: { gte: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000), lt: weekAgo } } }),
      db.lead.count({ where: { createdAt: { gte: monthAgo } } }),
      db.lead.count({ where: { createdAt: { gte: new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000), lt: monthAgo } } }),
      db.leadTagAssignment.groupBy({ by: ['tagId'], _count: { leadId: true }, orderBy: { _count: { leadId: 'desc' } }, take: 5 }),
      db.lead.count({ where: { assignedTo: null, status: { notIn: ['won', 'lost'] } } }),
    ])

    // Calculate avg days to convert
    let avgDays = 0
    if (wonLeads > 0 && avgDaysToConvert.length > 0) {
      const totalDays = avgDaysToConvert.reduce((sum, l) => {
        const days = Math.floor((l.updatedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      avgDays = Math.round(totalDays / avgDaysToConvert.length)
    }

    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0'
    const weekOverWeek = lastWeekLeads > 0 ? (((thisWeekLeads - lastWeekLeads) / lastWeekLeads) * 100).toFixed(0) : null
    const monthOverMonth = lastMonthLeads > 0 ? (((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100).toFixed(0) : null

    // Get project names
    const projects = await db.project.findMany({ select: { id: true, name: true } })
    const projectNameMap: Record<string, string> = {}
    for (const p of projects) projectNameMap[p.id] = p.name

    const leadsByProjectNamed = leadsByProject.map((lbp) => ({
      project: (lbp.projectId && projectNameMap[lbp.projectId]) || 'Unknown',
      count: lbp._count,
    }))

    // Get recent lead details for AI
    const recentLeadsSummary = recentLeads.map((l) => ({
      name: l.name,
      source: l.source,
      status: l.status,
      project: l.project?.name || 'none',
      daysOld: Math.floor((now.getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      hasNotes: l.notes.length > 0,
    }))

    // Build the comprehensive prompt
    const dataContext = `
BUSINESS DATA (as of ${today}):
=== OVERVIEW ===
Total Leads: ${totalLeads}
Won: ${wonLeads} | Lost: ${lostLeads}
Conversion Rate: ${conversionRate}%
Avg Days to Convert: ${avgDays || 'N/A'}
Total Site Visits: ${totalSiteVisits} (Pending: ${pendingSiteVisits}, Completed: ${completedSiteVisits})

=== LEADS BY STATUS ===
${leadsByStatus.map((s) => `${s.status}: ${s._count}`).join(', ')}

=== LEADS BY SOURCE ===
${leadsBySource.map((s) => `${s.source}: ${s._count}`).join(', ')}

=== LEADS BY PROJECT ===
${leadsByProjectNamed.map((p) => `${p.project}: ${p.count}`).join(', ')}

=== TRENDS ===
This Week: ${thisWeekLeads} leads | Last Week: ${lastWeekLeads} leads | WoW Change: ${weekOverWeek ? weekOverWeek + '%' : 'N/A'}
This Month: ${thisMonthLeads} leads | Last Month: ${lastMonthLeads} leads | MoM Change: ${monthOverMonth ? monthOverMonth + '%' : 'N/A'}

=== RISK INDICATORS ===
Leads not contacted for 7+ days (still "new"): ${leadsNoContact}
Leads with overdue follow-ups: ${leadsWithOverdue}
Total overdue follow-up tasks: ${overdueFollowUps}
Unassigned active leads: ${unassignedLeads}

=== RECENT LEADS (last 7 days) ===
${recentLeadsSummary.map((l) => `- ${l.name} (${l.source}, ${l.status}, ${l.project}, ${l.daysOld}d old${l.hasNotes ? ', has notes' : ''})`).join('\n')}
`

    // ── Call AI for comprehensive insights ─────────────────────────────────
    const insightsPrompt = `${dataContext}

Generate a comprehensive AI business analysis. Return ONLY valid JSON (no markdown):
{
  "pipelineHealth": {
    "score": 0-100,
    "label": "one of: Critical, Poor, Fair, Good, Excellent",
    "summary": "2-3 sentence overall health assessment"
  },
  "riskAlerts": [
    {"severity": "critical|high|medium|low", "title": "short title", "description": "1-2 sentence explanation", "action": "specific action to take", "affectedCount": number}
  ],
  "predictions": {
    "nextWeekLeads": number,
    "nextWeekConversions": number,
    "pipelineVelocity": "improving|stable|declining",
    "bestDayToContact": "Monday|Tuesday|Wednesday|Thursday|Saturday",
    "peakHours": "e.g., 10AM-12PM, 4PM-6PM",
    "estimatedMonthlyRevenue": "string estimate based on pipeline",
    "conversionProbability": "percentage"
  },
  "recommendations": [
    {"priority": "high|medium|low", "category": "leads|followups|content|team|process", "title": "short title", "description": "2-3 sentence actionable recommendation", "expectedImpact": "brief impact description"}
  ],
  "weeklyBrief": {
    "headline": "one-line summary of the week",
    "highlights": ["2-3 key achievements or positive trends"],
    "concerns": ["1-3 areas needing attention"],
    "topOpportunity": "the single biggest opportunity right now",
    "focusAreas": ["2-3 things to focus on this week"]
  },
  "bottleneckAnalysis": {
    "stages": [{"stage": "status name", "entryRate": "how many entered", "exitRate": "how many exited", "avgTimeDays": number, "isBottleneck": boolean}],
    "biggestBottleneck": "which stage has the biggest bottleneck",
    "recommendation": "how to fix it"
  }
}`

    const raw = await callAI(
      `You are a senior real estate business analyst AI for MATRICA REAL ESTATE LTD in Purbachal, Dhaka, Bangladesh.
Analyze sales pipeline data and provide actionable insights. Be data-driven, specific, and practical.
For predictions, be realistic and based on the actual trends shown in the data.
Use Bangladesh real estate market context. Projects are residential plots planned per RAJUK policy, beside RAJUK Purbachal New Town (do NOT claim "RAJUK approved").
Return ONLY valid JSON, no markdown.`,
      insightsPrompt,
      4000
    )

    const aiResult = parseJSON(raw)

    // If AI parsing failed, build a basic response from data
    if (!aiResult) {
      const healthScore = Math.min(100, Math.max(0,
        (conversionRate !== '0.0' ? 30 : 0) +
        (leadsNoContact === 0 ? 20 : Math.max(0, 20 - leadsNoContact * 5)) +
        (overdueFollowUps === 0 ? 15 : Math.max(0, 15 - overdueFollowUps * 3)) +
        (thisWeekLeads > 0 ? 20 : 5) +
        (unassignedLeads === 0 ? 15 : Math.max(0, 15 - unassignedLeads * 3))
      ))

      return NextResponse.json({
        success: true,
        generatedAt: now.toISOString(),
        pipelineHealth: {
          score: healthScore,
          label: healthScore >= 80 ? 'Good' : healthScore >= 60 ? 'Fair' : healthScore >= 40 ? 'Poor' : 'Critical',
          summary: `Pipeline health score: ${healthScore}/100. ${leadsNoContact > 0 ? `${leadsNoContact} leads need attention.` : ''} ${unassignedLeads > 0 ? `${unassignedLeads} leads are unassigned.` : ''}`,
        },
        riskAlerts: [
          ...(leadsNoContact > 0 ? [{ severity: 'high', title: 'Stale New Leads', description: `${leadsNoContact} leads in "new" status for 7+ days`, action: 'Contact these leads immediately', affectedCount: leadsNoContact }] : []),
          ...(overdueFollowUps > 0 ? [{ severity: 'high', title: 'Overdue Follow-ups', description: `${overdueFollowUps} overdue follow-up tasks`, action: 'Prioritize completing overdue tasks', affectedCount: overdueFollowUps }] : []),
          ...(unassignedLeads > 0 ? [{ severity: 'medium', title: 'Unassigned Leads', description: `${unassignedLeads} active leads without an owner`, action: 'Assign leads to team members', affectedCount: unassignedLeads }] : []),
        ],
        predictions: {
          nextWeekLeads: Math.round(thisWeekLeads * 1.1),
          nextWeekConversions: Math.max(0, Math.round(wonLeads * 0.15)),
          pipelineVelocity: weekOverWeek ? (parseInt(weekOverWeek) > 0 ? 'improving' : 'declining') : 'stable',
          bestDayToContact: 'Tuesday',
          peakHours: '10AM-12PM, 4PM-6PM',
          estimatedMonthlyRevenue: 'Based on current pipeline',
          conversionProbability: `${conversionRate}%`,
        },
        recommendations: [
          { priority: 'high', category: 'followups', title: 'Clear Overdue Tasks', description: `Complete ${overdueFollowUps} overdue follow-up tasks to prevent leads from going cold.`, expectedImpact: 'Improved lead engagement' },
          { priority: 'medium', category: 'leads', title: 'Contact Stale Leads', description: `Reach out to ${leadsNoContact} leads that haven't been contacted in 7+ days.`, expectedImpact: 'Recovery of potential conversions' },
        ],
        weeklyBrief: {
          headline: `${thisWeekLeads} new leads this week with ${conversionRate}% conversion rate`,
          highlights: [thisWeekLeads > 0 ? `${thisWeekLeads} new leads generated` : 'Focus on lead generation', `${completedSiteVisits} site visits completed`],
          concerns: leadsNoContact > 0 ? [`${leadsNoContact} leads not contacted for 7+ days`] : [],
          topOpportunity: 'Convert qualified leads through follow-up',
          focusAreas: ['Contact new leads', 'Schedule site visits'],
        },
        bottleneckAnalysis: {
          stages: leadsByStatus.map((s) => ({ stage: s.status, entryRate: s._count.toString(), exitRate: 'N/A', avgTimeDays: 0, isBottleneck: s.status === 'new' && s._count > 5 })),
          biggestBottleneck: (leadsByStatus.find((s) => s.status === 'new')?._count ?? 0) > 5 ? 'new' : 'none',
          recommendation: 'Focus on moving leads from "new" to "contacted" status',
        },
        rawData: {
          totalLeads, wonLeads, lostLeads, conversionRate,
          thisWeekLeads, lastWeekLeads, weekOverWeek,
          leadsNoContact, overdueFollowUps, unassignedLeads,
          totalSiteVisits, pendingSiteVisits, completedSiteVisits,
          avgDays,
        },
      })
    }

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      ...aiResult,
      rawData: {
        totalLeads, wonLeads, lostLeads, conversionRate,
        thisWeekLeads, lastWeekLeads, weekOverWeek,
        leadsNoContact, overdueFollowUps, unassignedLeads,
        totalSiteVisits, pendingSiteVisits, completedSiteVisits,
        avgDays,
      },
    })
  } catch (error) {
    console.error('AI Insights error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate insights'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}