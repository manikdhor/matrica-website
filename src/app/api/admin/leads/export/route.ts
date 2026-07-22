import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireLeadAccess } from '@/lib/admin-auth'

function escapeCsvField(value: string | null | undefined): string {
  const str = value ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  const guard = await requireLeadAccess('read')
  if (guard instanceof Response) return guard
  // Bulk CSV export is a full-database exfiltration path — own-scope (sales)
  // users may not export at all.
  if (guard.access.scope === 'own') {
    return NextResponse.json({ error: 'Forbidden: export not allowed' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const source = searchParams.get('source') || ''
    const project = searchParams.get('project') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const search = searchParams.get('search') || ''
    const assignedTo = searchParams.get('assignedTo') || ''

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
    if (project) where.projectId = project
    if (assignedTo) where.assignedTo = assignedTo === '__unassigned__' ? null : assignedTo
    if (from || to) {
      const dateFilter: Record<string, unknown> = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) {
        const toEnd = new Date(to)
        toEnd.setHours(23, 59, 59, 999)
        dateFilter.lte = toEnd
      }
      where.createdAt = dateFilter
    }

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { name: true } } },
    })

    const header = 'Name,Phone,Email,Source,Project,Status,Priority,Score,Assigned To,Created At'
    const rows = leads.map((l) => {
      return [
        escapeCsvField(l.name),
        escapeCsvField(l.phone),
        escapeCsvField(l.email),
        escapeCsvField(l.source),
        escapeCsvField(l.project?.name),
        escapeCsvField(l.status),
        escapeCsvField(l.priority),
        String(l.score),
        escapeCsvField(l.assignedTo),
        escapeCsvField(l.createdAt.toISOString()),
      ].join(',')
    })

    const bom = '\uFEFF'
    const csv = bom + header + '\n' + rows.join('\n')
    const dateStr = new Date().toISOString().split('T')[0]

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-export-${dateStr}.csv"`,
      },
    })
  } catch (error) {
    console.error('Leads CSV export error:', error)
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 })
  }
}