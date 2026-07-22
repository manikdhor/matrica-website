import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requirePermission('projects', false)
  if (auth instanceof Response) return auth
  try {
    const projects = await db.project.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('projects', true)
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    if (!body.name || !body.slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })
    // Child collections are edited after creation via PUT; strip relation
    // arrays (and non-column keys) so create only receives scalar fields.
    const {
      highlights, documents, specs, stages, amenities, distances,
      landmarks, faqs, images, leads, testimonials, siteVisits, paymentPlans,
      id, createdAt, updatedAt,
      ...data
    } = body
    void highlights; void documents; void specs; void stages; void amenities
    void distances; void landmarks; void faqs; void images; void leads
    void testimonials; void siteVisits; void paymentPlans; void id
    void createdAt; void updatedAt
    if (Array.isArray(data.cardHighlights)) {
      data.cardHighlights = JSON.stringify(
        data.cardHighlights.map((s: unknown) => String(s ?? '').trim()).filter(Boolean)
      )
    }
    const project = await db.project.create({ data })
    return NextResponse.json({ success: true, project }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error && error.message.includes('Unique') ? 'Slug already exists' : 'Failed to create project'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}