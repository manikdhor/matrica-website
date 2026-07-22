import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { aiChat } from '@/lib/ai'

const SYSTEM_PROMPT = `You are a content writer for MATRICA REAL ESTATE LTD, a premium land developer in Purbachal, Dhaka, Bangladesh.
- Projects: Chandra Chaya and Ventura City - residential plots planned per RAJUK policy, beside RAJUK Purbachal New Town (never claim "RAJUK approved"; never call the company "new")
- Write for Bangladesh real estate market
- Blog: 300-500 words, markdown format with headers
- Social media: concise, engaging, include relevant hashtags
- Professional but approachable tone
- Emphasize: location advantage, RAJUK approval, investment potential
- Always respond in valid JSON format matching the requested structure exactly.`

function buildBlogPrompt(input: { title: string; tone?: string; keywords?: string }): string {
  const tone = input.tone || 'professional'
  const keywords = input.keywords ? `Include these keywords: ${input.keywords}` : ''
  return `Generate a blog post with the following details:
Title: "${input.title}"
Tone: ${tone}
${keywords}

Return a JSON object with EXACTLY this structure (no extra fields, no markdown wrapping):
{
  "title": "string - the blog post title",
  "excerpt": "string - 1-2 sentence excerpt/summary",
  "content": "string - full blog post in markdown format with headers, 300-500 words",
  "metaDescription": "string - SEO meta description under 160 characters",
  "suggestedTags": ["array", "of", "tag", "strings"]
}`
}

function buildProjectDescPrompt(input: { projectName: string; features?: string[]; location?: string; tone?: string }): string {
  const features = input.features?.length ? input.features.join(', ') : ''
  const location = input.location || 'Purbachal, Dhaka'
  return `Generate a project description with the following details:
Project Name: "${input.projectName}"
Location: ${location}
Key Features: ${features || 'Residential plots, planned per RAJUK policy, beside RAJUK Purbachal New Town'}
Tone: ${input.tone || 'professional'}

Return a JSON object with EXACTLY this structure (no extra fields, no markdown wrapping):
{
  "tagline": "string - catchy one-line tagline",
  "summary": "string - 2-3 sentence project summary",
  "description": "string - full description in markdown format with headers",
  "highlights": ["array", "of", "key", "highlight", "strings"]
}`
}

function buildSocialMediaPrompt(input: { topic: string; platform: string; tone?: string }): string {
  const platformName = input.platform === 'facebook' ? 'Facebook' : input.platform === 'linkedin' ? 'LinkedIn' : 'WhatsApp'
  return `Generate social media posts for ${platformName} about the following topic:
Topic: "${input.topic}"
Platform: ${platformName}
Tone: ${input.tone || 'engaging'}

Generate 3 different variations. Each should be tailored for ${platformName}:
- Facebook: Longer, engaging, use emojis, include hashtags
- LinkedIn: Professional, industry-focused, include hashtags
- WhatsApp: Concise, direct, include call-to-action

Return a JSON object with EXACTLY this structure (no extra fields, no markdown wrapping):
{
  "posts": [
    {
      "platform": "${input.platform}",
      "content": "string - the post content",
      "hashtags": "string - relevant hashtags"
    },
    {
      "platform": "${input.platform}",
      "content": "string - variation 2",
      "hashtags": "string - relevant hashtags"
    },
    {
      "platform": "${input.platform}",
      "content": "string - variation 3",
      "hashtags": "string - relevant hashtags"
    }
  ]
}`
}

function buildFaqPrompt(input: { question: string; context?: string }): string {
  return `Generate an FAQ answer for the following question:
Question: "${input.question}"
Context: ${input.context || 'MATRICA REAL ESTATE LTD - premium land developer in Purbachal, Dhaka, Bangladesh; residential plots planned per RAJUK policy, beside RAJUK Purbachal New Town'}

Return a JSON object with EXACTLY this structure (no extra fields, no markdown wrapping):
{
  "answer": "string - comprehensive yet concise answer"
}`
}

function buildEmailPrompt(input: { subject?: string; target: string; project?: string; offer?: string }): string {
  const targetDesc: Record<string, string> = {
    new_leads: 'new leads who recently expressed interest',
    site_visitors: 'people who visited the website recently',
    newsletter: 'existing newsletter subscribers',
  }
  return `Generate a marketing email campaign with the following details:
Subject (optional suggestion): "${input.subject || ''}"
Target Audience: ${targetDesc[input.target] || input.target}
Project: ${input.project || 'Chandra Chaya and Ventura City'}
Special Offer: ${input.offer || 'Standard investment opportunity'}

Return a JSON object with EXACTLY this structure (no extra fields, no markdown wrapping):
{
  "subject": "string - compelling email subject line",
  "previewText": "string - preview text shown in inbox, under 100 characters",
  "body": "string - full email body in plain text with paragraphs, professional tone",
  "ctaText": "string - call-to-action button text (e.g., Schedule a Visit, Learn More)",
  "ctaLink": "string - suggested link path (e.g., /projects, /site-visit, /contact)"
}`
}

async function generateContent(prompt: string, maxTokens = 2000): Promise<string> {
  try {
    return await aiChat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { maxTokens, temperature: 0.7 }
    )
  } catch (e) {
    // Preserve previous behavior: empty AI content flows into parseJSON, which throws its own error
    if (e instanceof Error && e.message.startsWith('Empty response')) return ''
    throw e
  }
}

function parseJSON(text: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {
    // Try extracting JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim())
    }
    // Try finding first { and last }
    const startIdx = text.indexOf('{')
    const endIdx = text.lastIndexOf('}')
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      return JSON.parse(text.slice(startIdx, endIdx + 1))
    }
    throw new Error('Could not parse AI response as JSON')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('ai', true)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { type, input } = body

    if (!type || !input) {
      return NextResponse.json({ error: 'Content type and input are required' }, { status: 400 })
    }

    let prompt = ''
    let maxTokens = 2000

    switch (type) {
      case 'blog_post':
        if (!input.title) {
          return NextResponse.json({ error: 'Title is required for blog posts' }, { status: 400 })
        }
        prompt = buildBlogPrompt(input)
        maxTokens = 2000
        break

      case 'project_description':
        if (!input.projectName) {
          return NextResponse.json({ error: 'Project name is required for project descriptions' }, { status: 400 })
        }
        prompt = buildProjectDescPrompt(input)
        maxTokens = 1500
        break

      case 'social_media':
        if (!input.topic || !input.platform) {
          return NextResponse.json({ error: 'Topic and platform are required for social media posts' }, { status: 400 })
        }
        if (!['facebook', 'linkedin', 'whatsapp'].includes(input.platform)) {
          return NextResponse.json({ error: 'Platform must be facebook, linkedin, or whatsapp' }, { status: 400 })
        }
        prompt = buildSocialMediaPrompt(input)
        maxTokens = 1500
        break

      case 'faq_answer':
        if (!input.question) {
          return NextResponse.json({ error: 'Question is required for FAQ answers' }, { status: 400 })
        }
        prompt = buildFaqPrompt(input)
        maxTokens = 800
        break

      case 'email_campaign':
        if (!input.target) {
          return NextResponse.json({ error: 'Target audience is required for email campaigns' }, { status: 400 })
        }
        if (!['new_leads', 'site_visitors', 'newsletter'].includes(input.target)) {
          return NextResponse.json({ error: 'Target must be new_leads, site_visitors, or newsletter' }, { status: 400 })
        }
        prompt = buildEmailPrompt(input)
        maxTokens = 1500
        break

      default:
        return NextResponse.json({ error: `Unknown content type: ${type}` }, { status: 400 })
    }

    const raw = await generateContent(prompt, maxTokens)
    const result = parseJSON(raw)

    return NextResponse.json({ success: true, type, content: result })
  } catch (error) {
    console.error('AI Content Writer error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    )
  }
}
