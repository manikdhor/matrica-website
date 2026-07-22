import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getRawSettings } from '@/app/api/site-settings/route'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { aiChat, type AiMessage } from '@/lib/ai'
import { cacheValidSince } from '@/lib/content-version'

// ─── Persona settings (Setting table, chat_* keys) ──────────────────
const PERSONA_KEYS = [
  'chat_persona_name',
  'chat_persona_role',
  'chat_persona_style',
  'chat_persona_language',
  'chat_greeting',
  'chat_human_mode',
  'chat_handoff_number',
] as const

const PERSONA_DEFAULTS = {
  chat_persona_name: 'Ayesha',
  chat_persona_role: 'Sales Consultant',
  chat_persona_style: '',
  chat_persona_language: 'mixed',
  chat_greeting: '',
  chat_human_mode: 'true',
  chat_handoff_number: '',
}

type PersonaSettings = typeof PERSONA_DEFAULTS

// 60s in-memory cache — persona keys aren't in the public site-settings whitelist.
let personaCache: { value: PersonaSettings; at: number } | null = null
const PERSONA_TTL = 60_000

/** Drop the cached persona so the next chat request re-reads chat_* settings.
 *  Called by admin routes whenever a chat_* Setting key is saved. */
export function invalidatePersonaCache() {
  personaCache = null
}

async function getPersonaSettings(): Promise<PersonaSettings> {
  if (personaCache && Date.now() - personaCache.at < PERSONA_TTL) return personaCache.value
  const value: PersonaSettings = { ...PERSONA_DEFAULTS }
  try {
    const rows = await db.setting.findMany({
      where: { key: { in: [...PERSONA_KEYS] } },
      select: { key: true, value: true },
    })
    for (const row of rows) {
      if (row.value) value[row.key as keyof PersonaSettings] = row.value
    }
    personaCache = { value, at: Date.now() }
  } catch {
    // DB unreachable — serve defaults, don't cache so we retry next request
  }
  return value
}

// 60s in-memory cache for the enabled-knowledge fetch (same cacheValidSince
// pattern as public GET routes). The rest of the POST handler stays per-request.
let knowledgeCache: string | null = null
let knowledgeCacheTime = 0
const KNOWLEDGE_TTL = 60_000

/** Enabled knowledge entries formatted as prompt blocks, capped at ~4000 chars. */
async function getKnowledgeBlock(): Promise<string> {
  const now = Date.now()
  if (knowledgeCache != null && now - knowledgeCacheTime < KNOWLEDGE_TTL && cacheValidSince(knowledgeCacheTime)) {
    return knowledgeCache
  }
  try {
    const entries = await db.aiKnowledge.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
    })
    const KNOWLEDGE_CAP = 4000
    const blocks: string[] = []
    let total = 0
    for (const entry of entries) {
      const block = `${entry.category ? `[${entry.category}] ` : ''}${entry.title}: ${entry.content}`
      if (total + block.length > KNOWLEDGE_CAP) break
      blocks.push(block)
      total += block.length
    }
    const result = blocks.join('\n\n')
    knowledgeCache = result
    knowledgeCacheTime = now
    return result
  } catch {
    // DB unreachable — negative-cache briefly so repeated requests don't
    // each pay the full connect timeout.
    knowledgeCache = ''
    knowledgeCacheTime = now - KNOWLEDGE_TTL + 15_000
    return ''
  }
}

// ─── GET: public-safe greeting + persona name for the chat widget ───
export async function GET() {
  const p = await getPersonaSettings()
  const greeting =
    p.chat_greeting ||
    `Hi! I'm ${p.chat_persona_name} from MATRICA. How can I help you today?`
  return NextResponse.json(
    { greeting, personaName: p.chat_persona_name },
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  )
}

// ─── POST: chat completion ───────────────────────────────────────────
const LANGUAGE_RULES: Record<string, string> = {
  english: 'Reply in English only.',
  bangla: 'Reply in Bangla (Bengali script) by default, but mirror the user if they write in English.',
  mixed: "Mirror the user's language — Bangla, English, or Banglish (Bangla in Latin script). Match whatever they use.",
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    // 20 AI chat calls per 10 min per IP — protects against cost abuse.
    const limited = rateLimit(`chat:${ip}`, 20, 10 * 60 * 1000)
    if (!limited.ok) {
      return NextResponse.json(
        { reply: 'You are sending messages too quickly. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      )
    }

    const s = await getRawSettings()
    const companyName = s.company_name || 'MATRICA REAL ESTATE LTD'
    const companyAddress = s.company_address || 'House 45, Road 135, Gulshan-2, Dhaka 1212, Bangladesh'
    const companyEmail = s.company_email || 'info@matrica.com.bd'
    const companyPhone = s.company_phone || '+8801XXXXXXXXX'
    const officeHours = s.office_hours || 'Sat-Thu: 9:00 AM - 6:00 PM, Friday: Closed'

    const { message, history } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Optional multi-turn history: validated {role, content}[] capped at 10 turns.
    const historyMessages: AiMessage[] = []
    if (Array.isArray(history)) {
      for (const turn of history.slice(-10)) {
        if (
          turn &&
          typeof turn === 'object' &&
          (turn.role === 'user' || turn.role === 'assistant') &&
          typeof turn.content === 'string' &&
          turn.content.trim().length > 0
        ) {
          historyMessages.push({ role: turn.role, content: turn.content.slice(0, 1000) })
        }
      }
    }

    const persona = await getPersonaSettings()
    const knowledge = await getKnowledgeBlock()
    const humanMode = persona.chat_human_mode !== 'false'
    const handoffNumber = persona.chat_handoff_number || s.social_whatsapp || companyPhone

    const personaIntro = humanMode
      ? `You are ${persona.chat_persona_name}, a ${persona.chat_persona_role} at ${companyName}, a premium land developer in Purbachal, Dhaka, Bangladesh. You chat with website visitors exactly like a real human agent would.`
      : `You are ${persona.chat_persona_name}, a ${persona.chat_persona_role} and helpful assistant for ${companyName}, a premium land developer in Purbachal, Dhaka, Bangladesh.`

    const humanRules = humanMode
      ? `
HOW YOU TALK (very important — you are a real human agent):
- Use contractions and brief sentences. Keep replies under 60 words.
- Be warm and natural, like chatting with a friend. An occasional emoji is fine, never more than one per reply.
- Never use robotic phrases like "as an AI", "I am a language model", "How may I assist you today?".
- If you don't know something, admit it honestly and offer to connect them with a colleague on WhatsApp (${handoffNumber}).
- Ask one natural follow-up question when it helps move the conversation forward — never more than one.
- For pricing questions or serious buyers, warmly offer a WhatsApp handoff to ${handoffNumber} or a site visit.`
      : `
GUIDELINES:
- Be concise, friendly, professional. Under 80 words.`

    const systemPrompt = `${personaIntro}

LANGUAGE: ${LANGUAGE_RULES[persona.chat_persona_language] || LANGUAGE_RULES.mixed}
${persona.chat_persona_style ? `\nYOUR PERSONALITY & EXTRA INSTRUCTIONS:\n${persona.chat_persona_style}\n` : ''}
COMPANY FACTS:
- 2 premium projects: Chandra Chaya and Ventura City in Purbachal
- Residential plots planned in line with RAJUK policy, beside RAJUK Purbachal New Town (sizes: 3 & 5 Katha at Ventura City; 3, 5 & 10 Katha at Chandra Chaya). Do NOT claim the plots are "RAJUK approved" — say "planned per RAJUK policy".
- Land is bought in the company's own name, so registration follows immediately after payment
- Pricing is being finalized — do NOT quote any prices. Never say the company is "new".
- Office: ${companyAddress}
- Phone: ${companyPhone}, Email: ${companyEmail}
- Office hours: ${officeHours}
${knowledge ? `\nKNOWLEDGE BASE (use these facts when relevant, they come from your team):\n${knowledge}\n` : ''}${humanRules}

ALWAYS:
- Mention specific project names when relevant
- Encourage site visits and bookings, direct users to relevant pages
- For pricing: say pricing is being finalized, encourage contact for details or suggest /projects
- For visits: direct to /site-visit
- Never quote prices, even if asked repeatedly`

    const reply = await aiChat(
      [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: message },
      ],
      { maxTokens: 250, temperature: humanMode ? 0.8 : 0.7 }
    )

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ reply: 'Thank you for your message! Our team will get back to you shortly.' })
  }
}
