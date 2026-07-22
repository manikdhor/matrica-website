import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { aiChat } from '@/lib/ai'

async function callAI(userPrompt: string, maxTokens = 3000): Promise<string> {
  try {
    return await aiChat(
      [
        {
          role: 'system',
          content: `You are an expert real estate sales analyst for MATRICA REAL ESTATE LTD in Purbachal, Dhaka, Bangladesh.
Projects: Chandra Chaya and Ventura City (residential plots planned per RAJUK policy, beside RAJUK Purbachal New Town — do NOT claim "RAJUK approved").
Score each lead 0-100 based on:
- Engagement signals (has email +10, left message +15, requested site visit +20, from referral +10)
- Status progression (contacted +5, qualified +15, site_visit +20, negotiation +25)
- Recency (within 7 days +10, within 30 days +5)
- Source quality (website +5, referral +15, direct +10, social +5)
- Activity level (notes count, follow-up completions)
Return ONLY valid JSON arrays, no markdown, no code blocks.`,
        },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens, temperature: 0.3 }
    )
  } catch (e) {
    // Preserve previous behavior: empty AI content falls through to the rule-based fallback
    if (e instanceof Error && e.message.startsWith('Empty response')) return ''
    throw e
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('ai', true)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { leadIds } = body

    // Fetch leads - either specific IDs or all
    const leads = await db.lead.findMany({
      where: leadIds?.length ? { id: { in: leadIds } } : {},
      include: {
        project: { select: { name: true } },
        notes: { orderBy: { createdAt: 'desc' }, take: 5 },
        activities: { orderBy: { createdAt: 'desc' }, take: 10 },
        followUps: { orderBy: { createdAt: 'desc' }, take: 5 },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads to score' }, { status: 400 })
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Build lead data for AI
    const leadsData = leads.map((l) => {
      const createdDate = new Date(l.createdAt)
      const completedFollowUps = l.followUps.filter((f) => f.status === 'completed').length
      const overdueFollowUps = l.followUps.filter((f) => f.status === 'pending' && new Date(f.dueDate) < now).length

      return {
        id: l.id,
        name: l.name,
        hasEmail: !!l.email,
        hasMessage: !!l.message && l.message.length > 10,
        source: l.source,
        status: l.status,
        project: l.project?.name || null,
        notesCount: l.notes.length,
        activitiesCount: l.activities.length,
        completedFollowUps,
        overdueFollowUps,
        hasTags: l.tags.length > 0,
        assigned: !!l.assignedTo,
        daysSinceCreation: Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)),
        isRecent: createdDate >= weekAgo,
        isThisMonth: createdDate >= monthAgo,
        messagePreview: l.message ? l.message.substring(0, 200) : null,
      }
    })

    // Split into batches of 20 for the API call
    const batchSize = 20
    const results: Array<{
      id: string
      aiScore: number
      aiInsights: string
      aiNextAction: string
    }> = []

    for (let i = 0; i < leadsData.length; i += batchSize) {
      const batch = leadsData.slice(i, i + batchSize)

      const prompt = `Score these ${batch.length} real estate leads. Return a JSON array with objects having:
- "id": lead id (string)
- "aiScore": 0-100 integer (conversion probability)
- "aiInsights": 1-2 sentence analysis of this lead's quality and potential
- "aiNextAction": specific next action in under 15 words (e.g., "Call to schedule site visit", "Send project brochure via WhatsApp", "Follow up on negotiation offer")

Leads data:
${JSON.stringify(batch, null, 2)}

Current date: ${now.toISOString().split('T')[0]}

Return ONLY the JSON array, no markdown formatting.`

      const raw = await callAI(prompt, 4000)
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      try {
        // Try to find JSON array
        const startIdx = cleaned.indexOf('[')
        const endIdx = cleaned.lastIndexOf(']')
        if (startIdx !== -1 && endIdx !== -1) {
          const parsed = JSON.parse(cleaned.slice(startIdx, endIdx + 1))
          results.push(...parsed)
        }
      } catch {
        // Fallback: create basic scores
        for (const lead of batch) {
          let score = 30
          if (lead.hasEmail) score += 10
          if (lead.hasMessage) score += 15
          if (lead.isRecent) score += 10
          if (lead.assigned) score += 5
          if (lead.source === 'referral') score += 15
          if (lead.completedFollowUps > 0) score += 10
          score = Math.min(100, Math.max(0, score))

          results.push({
            id: lead.id,
            aiScore: score,
            aiInsights: `Lead from ${lead.source}, ${lead.status} status. ${lead.assigned ? 'Assigned to team member.' : 'Needs assignment.'}`,
            aiNextAction: lead.status === 'new' ? 'Make first contact via phone call' : 'Follow up with project details',
          })
        }
      }
    }

    // Save results to database
    const updatePromises = results.map((r) =>
      db.lead.update({
        where: { id: r.id },
        data: {
          aiScore: r.aiScore,
          aiInsights: r.aiInsights,
          aiNextAction: r.aiNextAction,
          aiAnalyzedAt: now,
        },
      })
    )

    await Promise.all(updatePromises)

    // Return summary
    const scored = results.length
    const avgScore = Math.round(results.reduce((s, r) => s + (r.aiScore || 0), 0) / scored)
    const highScore = results.filter((r) => (r.aiScore || 0) >= 70).length
    const mediumScore = results.filter((r) => (r.aiScore || 0) >= 40 && (r.aiScore || 0) < 70).length
    const lowScore = results.filter((r) => (r.aiScore || 0) < 40).length

    return NextResponse.json({
      success: true,
      scored,
      totalLeads: leads.length,
      summary: {
        avgScore,
        highScore,
        mediumScore,
        lowScore,
      },
      results,
    })
  } catch (error) {
    console.error('AI Bulk Score error:', error)
    const message = error instanceof Error ? error.message : 'Failed to score leads'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}