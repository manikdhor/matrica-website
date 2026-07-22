import { db } from '@/lib/db'

interface LeadScoringInput {
  name: string
  phone: string
  email?: string | null
  projectId?: string | null
  message?: string | null
  source?: string | null
}

/**
 * Rule-based lead scoring — instant, no AI API call.
 * Scoring logic:
 *   Base: 30
 *   Has email: +10
 *   Has message with 10+ chars: +10
 *   Has projectId: +15
 *   Source is 'referral': +15
 *   Source is 'direct': +10
 *   Source is 'site_visit': +10
 *   Clamped to 0-100
 */
function computeRuleScore(data: LeadScoringInput): number {
  let score = 30
  if (data.email) score += 10
  if (data.message && data.message.length >= 10) score += 10
  if (data.projectId) score += 15
  if (data.source === 'referral') score += 15
  if (data.source === 'direct') score += 10
  if (data.source === 'site_visit') score += 10
  return Math.min(100, Math.max(0, score))
}

function generateInsights(data: LeadScoringInput, score: number): string {
  const parts: string[] = []
  if (data.projectId) parts.push('showing project interest')
  if (data.source === 'referral') parts.push('referred by someone')
  if (data.source === 'direct') parts.push('direct inquiry')
  if (data.source === 'site_visit') parts.push('requested site visit')
  if (data.email && data.message?.length && data.message.length >= 10) {
    parts.push('provided full contact info and details')
  } else if (data.email) {
    parts.push('provided email')
  }
  if (parts.length === 0) parts.push('basic inquiry')
  return `Score ${score}/100 — ${parts.join(', ')}.`
}

function generateNextAction(data: LeadScoringInput, score: number): string {
  if (score >= 70) {
    return data.projectId
      ? 'Call immediately, schedule site visit'
      : 'Call to discuss project options'
  }
  if (score >= 50) {
    return data.email ? 'Send project details via email' : 'Reach out via WhatsApp'
  }
  return 'Add to follow-up queue'
}

/**
 * Fire-and-forget rule-based scoring for a newly created lead.
 * Updates the lead with aiScore, aiInsights, aiNextAction, aiAnalyzedAt.
 * If score >= 70, creates a hot-lead notification.
 */
export function scoreLeadInBackground(
  leadId: string,
  data: LeadScoringInput
): Promise<void> {
  return (async () => {
    try {
      const score = computeRuleScore(data)
      const insights = generateInsights(data, score)
      const nextAction = generateNextAction(data, score)

      await db.lead.update({
        where: { id: leadId },
        data: {
          aiScore: score,
          aiInsights: insights,
          aiNextAction: nextAction,
          aiAnalyzedAt: new Date(),
        },
      })

      // Hot lead notification
      if (score >= 70) {
        await db.notification.create({
          data: {
            type: 'hot_lead',
            title: `🔥 Hot lead detected: ${data.name} scored ${score}/100`,
            message: `AI scored ${data.name} (${data.phone}) at ${score}/100. Action: ${nextAction}`,
            link: `/admin/leads?id=${leadId}`,
          },
        })
      }
    } catch (err) {
      console.error('[lead-scoring] Background score failed for', leadId, err)
    }
  })()
}

/**
 * AI-powered deep scoring using the configured AI provider (Settings → AI Configuration).
 * Used when admin explicitly requests deep scoring (autoScore: true).
 */
export async function scoreLeadWithAI(
  leadId: string,
  data: LeadScoringInput
): Promise<void> {
  const { aiChat } = await import('@/lib/ai')
  const { getRawSettings } = await import('@/app/api/site-settings/route')
  const settings = await getRawSettings()
  const companyName = settings.company_name || 'MATRICA REAL ESTATE LTD'

  const prompt = `You are an expert real estate sales analyst for ${companyName} in Purbachal, Dhaka, Bangladesh.
Score this new lead 0-100 based on conversion probability.

Lead data:
- Name: ${data.name}
- Phone: ${data.phone}
- Email: ${data.email || 'not provided'}
- Project interest: ${data.projectId ? 'yes, specific project' : 'none specified'}
- Message: ${data.message || 'none'}
- Source: ${data.source || 'website'}

Return ONLY a JSON object with:
- "aiScore": integer 0-100
- "aiInsights": 1-2 sentence analysis
- "aiNextAction": specific next action under 15 words

No markdown, no code blocks.`

  let raw = ''
  try {
    raw = await aiChat(
      [
        { role: 'system', content: 'You are a real estate lead scoring AI. Return ONLY raw JSON, no markdown.' },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 300, temperature: 0.3 }
    )
  } catch (e) {
    // Preserve previous behavior: empty AI content falls through to the rule-based fallback below
    if (!(e instanceof Error && e.message.startsWith('Empty response'))) throw e
  }
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let aiScore: number
  let aiInsights: string
  let aiNextAction: string

  try {
    const parsed = JSON.parse(cleaned)
    aiScore = Math.min(100, Math.max(0, parseInt(parsed.aiScore, 10) || 50))
    aiInsights = String(parsed.aiInsights || '').substring(0, 300)
    aiNextAction = String(parsed.aiNextAction || 'Follow up with lead').substring(0, 100)
  } catch {
    // Fallback to rule-based on AI parse failure
    aiScore = computeRuleScore(data)
    aiInsights = generateInsights(data, aiScore)
    aiNextAction = generateNextAction(data, aiScore)
  }

  await db.lead.update({
    where: { id: leadId },
    data: {
      aiScore,
      aiInsights,
      aiNextAction,
      aiAnalyzedAt: new Date(),
    },
  })

  if (aiScore >= 70) {
    await db.notification.create({
      data: {
        type: 'hot_lead',
        title: `🔥 Hot lead detected: ${data.name} scored ${aiScore}/100`,
        message: `AI deep-scored ${data.name} (${data.phone}) at ${aiScore}/100. ${aiInsights}`,
        link: `/admin/leads?id=${leadId}`,
      },
    })
  }
}