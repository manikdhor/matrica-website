import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { aiChat } from '@/lib/ai'

const SYSTEM_PROMPT = `You are an AI sales assistant for MATRICA REAL ESTATE LTD, a premium land developer in Purbachal, Dhaka, Bangladesh.
Projects: Chandra Chaya and Ventura City.
- Be concise, practical, and Bangladesh-market aware
- Use professional but warm tone
- Suggest realistic follow-up strategies
- For WhatsApp: keep messages short, conversational, under 100 words
- For Email: professional with clear call-to-action
- Always suggest booking a site visit when appropriate`

async function callAI(userPrompt: string): Promise<string> {
  try {
    return await aiChat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 1200, temperature: 0.7 }
    )
  } catch (e) {
    // Preserve previous behavior: empty AI content falls through to each handler's parse fallback
    if (e instanceof Error && e.message.startsWith('Empty response')) return ''
    throw e
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('ai', true)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { leadId, type, context } = body

    if (!leadId || !type) {
      return NextResponse.json({ error: 'leadId and type are required' }, { status: 400 })
    }

    if (!['suggestion', 'analysis', 'summary', 'email'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use: suggestion, analysis, summary, email' }, { status: 400 })
    }

    // Fetch lead with all related data
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        project: true,
        notes: { orderBy: { createdAt: 'desc' }, take: 20 },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        followUps: { orderBy: { createdAt: 'desc' }, take: 10 },
        tags: { include: { tag: true } },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Build lead context string
    const recentActivities = lead.activities
      .slice(0, 10)
      .map((a) => `[${a.type}] ${a.description} (${new Date(a.createdAt).toLocaleDateString()})`)
      .join('\n')

    const recentNotes = lead.notes
      .slice(0, 10)
      .map((n) => `- ${n.content} (${new Date(n.createdAt).toLocaleDateString()})`)
      .join('\n')

    const leadContext = `Lead Information:
- Name: ${lead.name}
- Phone: ${lead.phone}
- Email: ${lead.email || 'N/A'}
- Source: ${lead.source}
- Status: ${lead.status}
- Priority: ${lead.priority}
- Score: ${lead.score}/100
- Project: ${lead.project?.name || 'Not specified'}
- Assigned To: ${lead.assignedTo || 'Unassigned'}
- Created: ${new Date(lead.createdAt).toLocaleDateString()}
- Original Message: ${lead.message || 'N/A'}
- Tags: ${lead.tags.map((t) => t.tag.name).join(', ') || 'None'}

Recent Activities:
${recentActivities || 'No activities yet'}

Notes:
${recentNotes || 'No notes yet'}`

    if (type === 'suggestion') {
      const prompt = `${leadContext}

Generate exactly 3 follow-up message suggestions for this lead. Each suggestion should be a different channel.
Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"suggestions":[{"title":"Short title","message":"The full message text","channel":"whatsapp"},{"title":"Short title","message":"The full message text","channel":"email"},{"title":"Short title","message":"The full message text","channel":"call"}]}

Rules:
- One WhatsApp message (short, conversational, under 100 words)
- One email (professional with clear subject and CTA)
- One call script (talking points for a phone call)
- Personalize based on the lead's status, project interest, and history
- Include specific references to the project name when available
- Suggest booking a site visit in at least one suggestion
${context ? `\nAdditional context from user: ${context}` : ''}`

      const result = await callAI(prompt)

      try {
        // Try to parse, stripping any markdown code blocks if present
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({
          suggestions: [
            { title: 'Follow-up Message', message: result, channel: 'whatsapp' as const },
          ],
        })
      }
    }

    if (type === 'analysis') {
      const prompt = `${leadContext}

Analyze this lead and return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"score":85,"assessment":"Overall assessment paragraph","risk":"low","hotPoints":["point1","point2"],"weaknesses":["weakness1"],"recommendation":"Clear next-step recommendation"}

Rules:
- score: 0-100 integer based on conversion likelihood
- risk: "low", "medium", or "high"
- hotPoints: 2-4 strengths/positive signals
- weaknesses: 1-3 concerns or gaps
- assessment: 2-3 sentence professional assessment
- recommendation: specific, actionable next step
${context ? `\nAdditional context from user: ${context}` : ''}`

      const result = await callAI(prompt)

      try {
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        // Ensure score is a number
        parsed.score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 50
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({
          score: 50,
          assessment: result,
          risk: 'medium',
          hotPoints: ['Analysis generated'],
          weaknesses: [],
          recommendation: 'Review the assessment above.',
        })
      }
    }

    if (type === 'summary') {
      const prompt = `${leadContext}

Generate a brief but comprehensive summary of this lead's journey and current situation. Cover:
- How they came to us and what they're interested in
- Key interactions and progress so far
- Current status and what needs to happen next

Keep it to 3-5 sentences, professional but concise. Return ONLY the summary text, no JSON.
${context ? `\nAdditional context from user: ${context}` : ''}`

      const result = await callAI(prompt)
      return NextResponse.json({ summary: result.trim() })
    }

    if (type === 'email') {
      const prompt = `${leadContext}

Draft a personalized email for this lead. Return ONLY valid JSON (no markdown, no code blocks):
{"subject":"Email subject line","body":"Full email body with greeting and sign-off"}

Rules:
- Professional tone with warmth
- Reference the specific project they're interested in
- Include a clear call-to-action (e.g., schedule a site visit, reply with questions)
- Sign off as MATRICA REAL ESTATE team
- Keep body under 200 words
${context ? `\nAdditional context from user: ${context}` : ''}`

      const result = await callAI(prompt)

      try {
        const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({
          subject: 'Regarding Your Interest in Matrica Real Estate',
          body: result,
        })
      }
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: unknown) {
    console.error('AI Lead Assistant error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}