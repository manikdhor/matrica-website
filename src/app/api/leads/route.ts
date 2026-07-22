import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scoreLeadInBackground } from '@/lib/lead-scoring'
import { sendWelcomeEmail } from '@/lib/email'
import { sendWelcomeWhatsAppInBackground } from '@/lib/whatsapp'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// Max field lengths to prevent DB bloat / abuse.
const LIMITS = { name: 120, phone: 32, email: 254, message: 2000, source: 64 }

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    // 10 lead submissions per hour per IP.
    const limited = rateLimit(`lead:${ip}`, 10, 60 * 60 * 1000)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      )
    }

    const body = await request.json()
    let { name, phone, email, projectId, message, source } = body

    if (!name || !phone || typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Trim + enforce length caps.
    name = String(name).trim().slice(0, LIMITS.name)
    phone = String(phone).trim().slice(0, LIMITS.phone)
    email = email ? String(email).trim().slice(0, LIMITS.email) : ''
    message = message ? String(message).trim().slice(0, LIMITS.message) : ''
    source = source ? String(source).trim().slice(0, LIMITS.source) : ''
    projectId = projectId ? String(projectId).slice(0, 64) : ''

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Forms send either a Project id or a slug (project pages pass the slug).
    // Resolve to a real id; an unknown value must not fail the whole lead with
    // a foreign-key error — keep the reference in the message instead.
    if (projectId) {
      const project = await db.project.findFirst({
        where: { OR: [{ id: projectId }, { slug: projectId }] },
        select: { id: true },
      })
      if (project) {
        projectId = project.id
      } else {
        message = [message, `[Project ref: ${projectId}]`].filter(Boolean).join('\n').slice(0, LIMITS.message)
        projectId = ''
      }
    }

    const lead = await db.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        projectId: projectId || null,
        message: message || null,
        source: source || 'website',
      },
    })

    // Create notification for admin — the lead is already saved, so a
    // notification failure must not turn the submission into a 500.
    await db.notification.create({
      data: {
        type: 'lead_created',
        title: 'New lead from website',
        message: `${lead.name} (${lead.phone}) submitted a lead${email ? ` — ${email}` : ''}`,
        link: `/admin/leads?id=${lead.id}`,
      },
    }).catch(() => {})

    // Auto-score lead with AI (non-blocking)
    scoreLeadInBackground(lead.id, { name, phone, email, projectId, message, source }).catch(() => {})

    // Get project name for personalized messages
    let projectName: string | undefined
    if (lead.projectId) {
      const project = await db.project.findUnique({ where: { id: lead.projectId }, select: { name: true } })
      projectName = project?.name || undefined
    }

    // Send welcome email (non-blocking)
    if (email) {
      sendWelcomeEmail(email, name, projectName).catch(() => {})
    }

    // Send welcome WhatsApp (non-blocking)
    sendWelcomeWhatsAppInBackground(lead.id, { name, phone, projectName }).catch(() => {})

    return NextResponse.json(
      { success: true, id: lead.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}