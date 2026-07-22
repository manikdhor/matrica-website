import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { aiChat } from '@/lib/ai'

const MAX_HISTORY = 20

export async function POST(request: NextRequest) {
  const auth = await requirePermission('ai', true)
  if (auth instanceof NextResponse) return auth

  try {
    const { message, history = [] } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // ── Fetch business data from DB ──────────────────────────────────────────
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalLeads,
      newLeads,
      convertedLeads,
      leadsByStatus,
      leadsBySource,
      pendingVisits,
      recentLeads,
      projects,
      totalTestimonials,
      totalBlogPosts,
    ] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
      db.lead.count({ where: { status: { in: ['won', 'booked'] } } }),
      db.lead.groupBy({ by: ['status'], _count: true }),
      db.lead.groupBy({ by: ['source'], _count: true }),
      db.siteVisitBooking.count({ where: { status: 'pending' } }),
      db.lead.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { name: true, status: true, project: { select: { name: true } }, createdAt: true },
      }),
      db.project.findMany({ select: { name: true, status: true }, orderBy: { createdAt: 'asc' } }),
      db.testimonial.count(),
      db.blogPost.count(),
    ])

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0'

    const statusCounts = leadsByStatus.map((s) => `${s.status}: ${s._count}`).join(', ')
    const sourceCounts = leadsBySource.map((s) => `${s.source}: ${s._count}`).join(', ')
    const projectNames = projects.map((p) => `${p.name} (${p.status})`).join(', ')
    const recentLeadsStr = recentLeads
      .map((l) => `${l.name} (${l.status}, ${l.project?.name || 'no project'})`)
      .join(', ')

    // ── Build system prompt ──────────────────────────────────────────────────
    const systemPrompt = `You are an AI business assistant for MATRICA REAL ESTATE LTD admin panel. You have access to the following LIVE business data:

CURRENT STATS:
- Total Leads: ${totalLeads}
- New Leads (last 7 days): ${newLeads}
- Conversion Rate: ${conversionRate}%
- Leads by Status: ${statusCounts || 'none'}
- Leads by Source: ${sourceCounts || 'none'}
- Pending Site Visits: ${pendingVisits}
- Total Projects: ${projects.length} — ${projectNames || 'none'}
- Recent Leads (last 10): ${recentLeadsStr || 'none'}
- Total Testimonials: ${totalTestimonials}
- Total Blog Posts: ${totalBlogPosts}

GUIDELINES:
- Answer questions about the business data accurately
- Provide actionable sales insights and recommendations
- Suggest follow-up strategies for leads
- Help with content ideas, marketing strategies
- Be concise and professional
- If you don't have specific data, say so honestly
- Format responses with bullet points when listing items`

    // ── Build messages array with history ────────────────────────────────────
    const trimmedHistory = history.slice(-MAX_HISTORY)

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory,
      { role: 'user', content: message },
    ]

    // ── Call AI ──────────────────────────────────────────────────────────────
    let reply: string
    try {
      reply = await aiChat(messages, { maxTokens: 1024, temperature: 0.7 })
    } catch (e) {
      // Preserve previous behavior: empty AI content returns a friendly reply instead of a 500
      if (e instanceof Error && e.message.startsWith('Empty response')) {
        reply = 'Sorry, I could not process that. Please try again.'
      } else {
        throw e
      }
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Admin AI Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    )
  }
}