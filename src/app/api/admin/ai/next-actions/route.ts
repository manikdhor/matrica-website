import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { aiChat } from '@/lib/ai'

async function callAI(userPrompt: string, maxTokens = 2000): Promise<string> {
  try {
    return await aiChat(
      [
        {
          role: 'system',
          content: `You are an AI sales coach for MATRICA REAL ESTATE LTD in Purbachal, Dhaka, Bangladesh.
Projects: Chandra Chaya and Ventura City (residential plots planned per RAJUK policy, beside RAJUK Purbachal New Town — do NOT claim "RAJUK approved").
For each lead, suggest the single best next action. Be specific and actionable.
Keep suggestions under 12 words. Use verbs like Call, Send, Schedule, Follow up, Share.
Return ONLY valid JSON, no markdown.`,
        },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens, temperature: 0.4 }
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

    if (!leadIds?.length || leadIds.length > 30) {
      return NextResponse.json({ error: 'Provide 1-30 lead IDs' }, { status: 400 })
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const leads = await db.lead.findMany({
      where: { id: { in: leadIds } },
      include: {
        project: { select: { name: true } },
        notes: { orderBy: { createdAt: 'desc' }, take: 3 },
        activities: { orderBy: { createdAt: 'desc' }, take: 5 },
        followUps: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    })

    // Check which leads already have AI data
    const leadsNeedingUpdate = leads.filter(
      (l) => !l.aiNextAction || !l.aiAnalyzedAt || new Date(l.aiAnalyzedAt).getTime() < now.getTime() - 4 * 60 * 60 * 1000
    )

    // Return cached data for recent ones
    const cached: Record<string, { aiNextAction: string; aiScore: number | null }> = {}
    for (const l of leads) {
      if (l.aiNextAction && l.aiAnalyzedAt && new Date(l.aiAnalyzedAt).getTime() >= now.getTime() - 4 * 60 * 60 * 1000) {
        cached[l.id] = { aiNextAction: l.aiNextAction, aiScore: l.aiScore }
      }
    }

    if (leadsNeedingUpdate.length === 0) {
      return NextResponse.json({ success: true, actions: cached })
    }

    // Build data for AI
    const leadsForAI = leadsNeedingUpdate.map((l) => {
      const daysOld = Math.floor((now.getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const overdueFollowUps = l.followUps.filter((f) => f.status === 'pending' && f.dueDate < today).length
      return {
        id: l.id,
        name: l.name,
        status: l.status,
        source: l.source,
        project: l.project?.name || null,
        daysOld,
        hasEmail: !!l.email,
        hasMessage: !!l.message,
        notesCount: l.notes.length,
        overdueFollowUps,
        lastActivity: l.activities[0]?.type || 'none',
        lastActivityDate: l.activities[0]?.createdAt || null,
      }
    })

    const prompt = `Suggest the BEST next action for each lead. Return a JSON array:
[{"id":"lead_id","nextAction":"specific action under 12 words","urgency":"high|medium|low"}]

Leads:
${JSON.stringify(leadsForAI, null, 2)}

Rules:
- "new" leads: suggest first contact method
- "contacted" without progression: suggest follow-up or site visit
- "qualified": suggest site visit scheduling
- "negotiation": suggest specific negotiation action
- High urgency for overdue follow-ups or stale leads
- Always reference specific project name when available`

    const raw = await callAI(prompt, 1500)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const startIdx = cleaned.indexOf('[')
      const endIdx = cleaned.lastIndexOf(']')
      if (startIdx !== -1 && endIdx !== -1) {
        const parsed = JSON.parse(cleaned.slice(startIdx, endIdx + 1))
        const actions: Record<string, { aiNextAction: string; aiScore: number | null; urgency: string }> = Object.fromEntries(Object.entries(cached).map(([k, v]) => [k, { ...v, urgency: 'medium' }]))

        for (const item of parsed) {
          if (item.id && item.nextAction) {
            actions[item.id] = {
              aiNextAction: item.nextAction,
              aiScore: null,
              urgency: item.urgency || 'medium',
            }
            // Update cached data in DB
            await db.lead.update({
              where: { id: item.id },
              data: { aiNextAction: item.nextAction, aiAnalyzedAt: now },
            }).catch(() => { /* ignore */ })
          }
        }

        // Add cached entries
        for (const [id, data] of Object.entries(cached)) {
          if (!actions[id]) {
            actions[id] = { aiNextAction: data.aiNextAction, aiScore: data.aiScore, urgency: 'medium' }
          }
        }

        return NextResponse.json({ success: true, actions })
      }
    } catch {
      // Fallback
    }

    // Simple fallback for each lead
    const fallbackActions: Record<string, { aiNextAction: string; aiScore: number | null; urgency: string }> = Object.fromEntries(Object.entries(cached).map(([k, v]) => [k, { ...v, urgency: 'medium' }]))
    for (const l of leadsNeedingUpdate) {
      const daysOld = Math.floor((now.getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      let action = 'Follow up with a phone call'
      let urgency = 'medium'
      if (l.status === 'new') { action = 'Make first contact via phone'; urgency = 'high' }
      else if (l.status === 'contacted') { action = 'Schedule a site visit'; urgency = 'medium' }
      else if (l.status === 'qualified') { action = `Schedule ${l.project?.name || 'project'} site visit`; urgency = 'high' }
      else if (l.status === 'negotiation') { action = 'Discuss pricing and payment terms'; urgency = 'high' }
      if (daysOld > 7) urgency = 'high'
      fallbackActions[l.id] = { aiNextAction: action, aiScore: null, urgency }
    }

    return NextResponse.json({ success: true, actions: fallbackActions })
  } catch (error) {
    console.error('AI Next Actions error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get next actions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}