import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('whatsapp', false)
  if (auth instanceof Response) return auth
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') // 'templates', 'messages', 'stats'

    if (mode === 'templates') {
      const templates = await db.whatsAppTemplate.findMany({ orderBy: { sortOrder: 'asc' } })
      return NextResponse.json({ templates })
    }

    if (mode === 'messages') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const status = searchParams.get('status')
      const where: Record<string, unknown> = {}
      if (status) where.status = status

      const [messages, total] = await Promise.all([
        db.whatsAppMessage.findMany({
          where,
          include: { lead: { select: { name: true, phone: true } }, template: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.whatsAppMessage.count({ where }),
      ])
      return NextResponse.json({ messages, total, page, totalPages: Math.ceil(total / limit) })
    }

    if (mode === 'stats') {
      const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
      const [totalSent, totalFailed, todaySent, templateCount] = await Promise.all([
        db.whatsAppMessage.count({ where: { status: 'sent' } }),
        db.whatsAppMessage.count({ where: { status: 'failed' } }),
        db.whatsAppMessage.count({ where: { status: 'sent', sentAt: { gte: startOfToday } } }),
        db.whatsAppTemplate.count(),
      ])
      return NextResponse.json({ totalSent, totalFailed, todaySent, templateCount })
    }

    // Default: return templates + recent messages
    const [templates, recentMessages] = await Promise.all([
      db.whatsAppTemplate.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      db.whatsAppMessage.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { lead: { select: { name: true } } },
      }),
    ])
    return NextResponse.json({ templates, recentMessages })
  } catch (error) {
    console.error('WhatsApp GET error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('whatsapp', true)
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'send') {
      const { to, leadId, templateId, message, variables, leadIds } = body
      const { sendWhatsAppMessage, renderTemplate } = await import('@/lib/whatsapp')

      // Bulk send to multiple leads
      if (leadIds && Array.isArray(leadIds)) {
        const leads = await db.lead.findMany({
          where: { id: { in: leadIds } },
          include: { project: { select: { name: true } } },
        })
        const results = await Promise.allSettled(
          leads.map(lead => {
            // Per-lead defaults sit UNDER the caller's variables so each lead keeps
            // its own name/project unless the caller explicitly overrides them.
            const perLeadVars = { name: lead.name, project: lead.project?.name || '', ...(variables || {}) }
            return sendWhatsAppMessage({
              to: lead.phone,
              templateId,
              // Render {{placeholders}} in custom messages too — sendWhatsAppMessage
              // only renders template bodies, so a raw custom message would otherwise
              // be delivered with literal {{name}} text.
              customMessage: message ? renderTemplate(message, perLeadVars) : undefined,
              leadId: lead.id,
              variables: perLeadVars,
              createdBy: auth.username,
            })
          })
        )
        const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
        const failed = results.length - sent
        return NextResponse.json({ success: sent > 0, sent, failed, total: results.length })
      }

      // Single send
      if (!to && !leadId) return NextResponse.json({ error: 'Recipient required' }, { status: 400 })

      let phone = to
      if (!phone && leadId) {
        const lead = await db.lead.findUnique({ where: { id: leadId } })
        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        phone = lead.phone
      }
      if (!phone) return NextResponse.json({ error: 'No phone number' }, { status: 400 })

      const result = await sendWhatsAppMessage({
        to: phone,
        templateId,
        customMessage: message,
        leadId,
        variables,
        createdBy: auth.username,
      })
      return NextResponse.json(result)
    }

    if (action === 'create_template') {
      const { name, description, body: templateBody, category, isActive, sortOrder } = body
      if (!name || !templateBody) return NextResponse.json({ error: 'Name and body are required' }, { status: 400 })
      const template = await db.whatsAppTemplate.create({
        data: {
          name,
          description,
          body: templateBody,
          category: category || 'general',
          isActive: isActive ?? true,
          sortOrder: sortOrder ?? 0,
        },
      })
      return NextResponse.json({ success: true, template }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('WhatsApp POST error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('whatsapp', true)
  if (auth instanceof Response) return auth
  try {
    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { name, description, body, category, isActive, sortOrder } = updates
    const template = await db.whatsAppTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(body !== undefined && { body }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })
    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('WhatsApp PUT error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission('whatsapp', true)
  if (auth instanceof Response) return auth
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.whatsAppTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WhatsApp DELETE error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}