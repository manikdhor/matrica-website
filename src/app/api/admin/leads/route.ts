import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess, leadScopeWhere } from '@/lib/admin-auth'
import { scoreLeadInBackground, scoreLeadWithAI } from '@/lib/lead-scoring'

export async function GET(request: NextRequest) {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard
  const { session, access } = guard

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const source = searchParams.get('source') || ''
    const priority = searchParams.get('priority') || ''
    const projectId = searchParams.get('projectId') || ''
    const assignedTo = searchParams.get('assignedTo') || ''
    // Whitelist sort field + direction so arbitrary input can't reach Prisma
    const ALLOWED_SORT_FIELDS = ['createdAt', 'score', 'aiScore', 'name', 'status']
    const sortByRaw = searchParams.get('sortBy') || 'createdAt'
    const sortBy = ALLOWED_SORT_FIELDS.includes(sortByRaw) ? sortByRaw : 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    // Clamp pagination so NaN / negative / oversized values never hit skip/take
    const rawPage = parseInt(searchParams.get('page') || '1')
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1
    const rawLimit = parseInt(searchParams.get('limit') || '20')
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20
    const exportCsv = searchParams.get('export') === 'csv'

    const scope = leadScopeWhere(session, access)

    // Live duplicate check endpoint (own-scope users can only probe their
    // own leads — otherwise this leaks other agents' lead details by phone)
    const checkDuplicate = searchParams.get('checkDuplicate') === '1'
    const phone = searchParams.get('phone') || ''
    if (checkDuplicate && phone) {
      const existing = await db.lead.findFirst({
        where: { phone, ...scope },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      if (existing) {
        return NextResponse.json({
          duplicate: true,
          existingLead: {
            id: existing.id,
            name: existing.name,
            phone: existing.phone,
            status: existing.status,
            createdAt: existing.createdAt.toISOString(),
            projectName: existing.project?.name || null,
          },
        })
      }
      return NextResponse.json({ duplicate: false, existingLead: null })
    }

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (source) where.source = source
    if (priority) where.priority = priority
    if (projectId) where.projectId = projectId
    if (assignedTo) where.assignedTo = assignedTo === '__unassigned__' ? null : assignedTo
    // Own-scope (sales) always overrides any assignedTo filter from the client
    Object.assign(where, scope)

    const orderBy: Record<string, string> = { [sortBy]: sortOrder }

    if (exportCsv) {
      if (access.scope === 'own') {
        return NextResponse.json({ error: 'Forbidden: export not allowed' }, { status: 403 })
      }
      const leads = await db.lead.findMany({
        where,
        orderBy,
        include: { project: { select: { name: true } } },
      })
      const header = 'Name,Phone,Email,Source,Project,Status,Priority,Score,Created\n'
      const rows = leads
        .map(
          (l) =>
            `"${l.name}","${l.phone}","${l.email || ''}","${l.source}","${l.project?.name || ''}","${l.status}","${l.priority}","${l.score}","${l.createdAt.toISOString()}"`
        )
        .join('\n')
      return new NextResponse(header + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=leads.csv',
        },
      })
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { name: true } },
          tags: {
            include: { tag: { select: { id: true, name: true, color: true } } },
          },
        },
      }),
      db.lead.count({ where }),
    ])

    // Compute smart segment counts (based on all filtered leads, not just current page)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [aiHot, aiWarm, aiCold, aiUnscored, atRisk] = await Promise.all([
      db.lead.count({ where: { ...where, aiScore: { gte: 70 } } }),
      db.lead.count({ where: { ...where, aiScore: { gte: 40, lt: 70 } } }),
      db.lead.count({ where: { ...where, aiScore: { lt: 40 } } }),
      db.lead.count({ where: { ...where, aiScore: null } }),
      db.lead.count({ where: { ...where, status: 'new', createdAt: { lt: sevenDaysAgo } } }),
    ])
    const smartCounts = { ai_hot: aiHot, ai_warm: aiWarm, ai_cold: aiCold, ai_unscored: aiUnscored, at_risk: atRisk }

    return NextResponse.json({
      leads: leads.map((l) => ({
        ...l,
        projectName: l.project?.name || '—',
        aiScore: l.aiScore ?? null,
        aiNextAction: l.aiNextAction ?? null,
        aiAnalyzedAt: l.aiAnalyzedAt?.toISOString() ?? null,
        tags: l.tags.map((t) => ({
          tagId: t.tag.id,
          tagName: t.tag.name,
          tagColor: t.tag.color,
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      smartCounts,
    })
  } catch (error) {
    console.error('Leads list error:', error)
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireLeadAccess('edit')
  if (guard instanceof Response) return guard
  const auth = guard.session

  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const body = await request.json()
    const { name, phone, email, source, projectId, message, priority, score, autoScore } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    // Duplicate detection: check for existing lead with same phone
    if (!force) {
      const existing = await db.lead.findFirst({
        where: { phone },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      if (existing) {
        return NextResponse.json({
          success: false,
          error: 'duplicate',
          duplicate: {
            id: existing.id,
            name: existing.name,
            phone: existing.phone,
            status: existing.status,
            createdAt: existing.createdAt.toISOString(),
            projectName: existing.project?.name || null,
          },
        }, { status: 409 })
      }
    }

    const lead = await db.lead.create({
      data: {
        name, phone,
        email: email || null,
        source: source || 'manual',
        projectId: projectId || null,
        message: message || null,
        priority: priority || 'medium',
        score: score || 0,
      },
      include: { project: { select: { name: true } } },
    })

    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'created',
        description: `Lead created by ${auth.username}`,
        createdBy: auth.username,
      },
    })

    // Create notification
    await db.notification.create({
      data: {
        type: 'lead_created',
        title: 'New lead created',
        message: `${lead.name} (${lead.phone}) — ${lead.source}`,
        link: `/admin/leads?id=${lead.id}`,
        createdBy: auth.username,
      },
    })

    // Auto-score: use AI deep scoring if requested, otherwise rule-based
    const scoringData = { name, phone, email, projectId, message, source }
    if (autoScore === true) {
      scoreLeadWithAI(lead.id, scoringData).catch(() => {})
    } else {
      scoreLeadInBackground(lead.id, scoringData).catch(() => {})
    }

    return NextResponse.json({ success: true, lead }, { status: 201 })
  } catch (error) {
    console.error('Create lead error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  // 'status' is the lowest bulk-write capability (sales may bulk-move status
  // on their OWN leads); priority needs edit, assignedTo needs assign.
  const guard = await requireLeadAccess('status')
  if (guard instanceof Response) return guard
  const { session: auth, access } = guard

  try {
    const { ids, status, priority, assignedTo } = await request.json()
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (status && access.canStatus) data.status = status
    if (priority && access.canEdit) data.priority = priority
    // assignedTo: explicit '' / '__unassign__' clears the assignment
    const unassign = assignedTo === '' || assignedTo === '__unassign__'
    if (access.canAssign && assignedTo !== undefined && (assignedTo || unassign)) {
      data.assignedTo = unassign ? null : assignedTo
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No permitted fields to update' }, { status: 400 })
    }

    // Resolve the leads actually in scope BEFORE updating, so own-scope users
    // can't touch other agents' leads and the activity log only records real hits.
    const targets = await db.lead.findMany({
      where: { id: { in: ids }, ...leadScopeWhere(auth, access) },
      select: { id: true },
    })
    const targetIds = targets.map((t) => t.id)
    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'No accessible leads in selection' }, { status: 403 })
    }

    const result = await db.lead.updateMany({ where: { id: { in: targetIds } }, data })

    // Create activity for each updated lead
    const parts: string[] = []
    if (data.status) parts.push(`status → ${status}`)
    if (data.priority) parts.push(`priority → ${priority}`)
    if (data.assignedTo !== undefined) parts.push(data.assignedTo ? `assigned to ${data.assignedTo}` : 'unassigned')
    if (parts.length > 0) {
      for (const id of targetIds) {
        await db.leadActivity.create({
          data: {
            leadId: id,
            type: 'bulk_update',
            description: `Bulk update: ${parts.join(', ')}`,
            createdBy: auth.username,
          },
        })
      }
    }

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json({ error: 'Failed to update leads' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requireLeadAccess('edit')
  if (guard instanceof Response) return guard

  try {
    const { ids } = await request.json()
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    const result = await db.lead.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 })
  }
}