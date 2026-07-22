import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

const int = (v: unknown, fallback = 0) => {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const nullableStr = (v: unknown) => {
  const s = str(v).trim()
  return s ? s : null
}
const bool = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('projects', false)
  if (auth instanceof Response) return auth
  const { id } = await params
  try {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        highlights: { orderBy: { sortOrder: 'asc' } },
        documents: { orderBy: { createdAt: 'asc' } },
        specs: { orderBy: { sortOrder: 'asc' } },
        stages: { orderBy: { sortOrder: 'asc' } },
        amenities: { orderBy: { sortOrder: 'asc' } },
        distances: { orderBy: { sortOrder: 'asc' } },
        landmarks: { orderBy: { sortOrder: 'asc' } },
        faqs: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(project)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('projects', true)
  if (auth instanceof Response) return auth
  const { id } = await params
  try {
    const body = await request.json()
    // Accept both partial bodies (inline list controls) and the full edit
    // form body — pull off relations, then strip non-column keys before update.
    const {
      highlights,
      documents,
      specs,
      stages,
      amenities,
      distances,
      landmarks,
      faqs,
      images,
      ...data
    } = body

    delete data.id
    delete data.createdAt
    delete data.updatedAt
    // Remove relation accessors that Prisma cannot accept as scalar data
    delete data.leads
    delete data.testimonials
    delete data.siteVisits
    delete data.paymentPlans

    // cardHighlights is stored as a JSON string array of short labels.
    if ('cardHighlights' in data) {
      if (Array.isArray(data.cardHighlights)) {
        data.cardHighlights = JSON.stringify(
          data.cardHighlights.map((s: unknown) => str(s).trim()).filter(Boolean)
        )
      } else if (data.cardHighlights == null || data.cardHighlights === '') {
        data.cardHighlights = null
      }
      // if already a string, persist as-is
    }

    // Coerce known numeric scalar columns
    if ('lat' in data) data.lat = data.lat === '' || data.lat == null ? null : Number(data.lat)
    if ('lng' in data) data.lng = data.lng === '' || data.lng == null ? null : Number(data.lng)
    if ('totalPlots' in data) data.totalPlots = data.totalPlots == null || data.totalPlots === '' ? null : int(data.totalPlots)
    if ('availablePlots' in data) data.availablePlots = data.availablePlots == null || data.availablePlots === '' ? null : int(data.availablePlots)
    if ('sortOrder' in data) data.sortOrder = int(data.sortOrder)

    const ops: Prisma.PrismaPromise<unknown>[] = [
      db.project.update({ where: { id }, data }),
    ]

    // Replace-children strategy: for every collection present in the body,
    // delete all rows then recreate with sortOrder = array index.
    if (Array.isArray(highlights)) {
      ops.push(db.projectHighlight.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectHighlight.createMany({
          data: highlights
            .filter((h: { title?: string }) => h && str(h.title).trim())
            .map((h: Record<string, unknown>, i: number) => ({
              title: str(h.title).trim(),
              titleBn: nullableStr(h.titleBn),
              detail: nullableStr(h.detail),
              icon: nullableStr(h.icon),
              image: nullableStr(h.image),
              sortOrder: i,
              projectId: id,
            })),
        })
      )
    }

    if (Array.isArray(specs)) {
      ops.push(db.projectSpec.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectSpec.createMany({
          data: specs
            .filter((s: { label?: string }) => s && str(s.label).trim())
            .map((s: Record<string, unknown>, i: number) => ({
              label: str(s.label).trim(),
              value: str(s.value),
              sortOrder: i,
              projectId: id,
            })),
        })
      )
    }

    if (Array.isArray(stages)) {
      ops.push(db.projectStage.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectStage.createMany({
          data: stages
            .filter((s: { label?: string }) => s && str(s.label).trim())
            .map((s: Record<string, unknown>, i: number) => ({
              label: str(s.label).trim(),
              stage: ['Complete', 'Underway', 'Planned'].includes(str(s.stage)) ? str(s.stage) : 'Planned',
              sortOrder: i,
              projectId: id,
            })),
        })
      )
    }

    if (Array.isArray(amenities)) {
      ops.push(db.projectAmenity.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectAmenity.createMany({
          data: amenities
            .filter((a: { label?: string }) => a && str(a.label).trim())
            .map((a: Record<string, unknown>, i: number) => ({
              icon: nullableStr(a.icon),
              label: str(a.label).trim(),
              sortOrder: i,
              projectId: id,
            })),
        })
      )
    }

    if (Array.isArray(distances)) {
      ops.push(db.projectDistance.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectDistance.createMany({
          data: distances
            .filter((d: { place?: string }) => d && str(d.place).trim())
            .map((d: Record<string, unknown>, i: number) => ({
              place: str(d.place).trim(),
              value: str(d.value),
              sortOrder: i,
              projectId: id,
            })),
        })
      )
    }

    if (Array.isArray(landmarks)) {
      ops.push(db.projectLandmark.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectLandmark.createMany({
          data: landmarks
            .filter((l: { name?: string }) => l && str(l.name).trim())
            .map((l: Record<string, unknown>, i: number) => ({
              icon: nullableStr(l.icon),
              name: str(l.name).trim(),
              minutes: int(l.minutes),
              angle: int(l.angle),
              ring: int(l.ring, 1),
              sortOrder: i,
              projectId: id,
            })),
        })
      )
    }

    if (Array.isArray(faqs)) {
      ops.push(db.projectFaq.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectFaq.createMany({
          data: faqs
            .filter((f: { question?: string }) => f && str(f.question).trim())
            .map((f: Record<string, unknown>, i: number) => ({
              question: str(f.question).trim(),
              answer: str(f.answer),
              sortOrder: i,
              projectId: id,
            })),
        })
      )
    }

    if (Array.isArray(images)) {
      ops.push(db.projectImage.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectImage.createMany({
          data: images
            .filter((im: { url?: string }) => im && str(im.url).trim())
            .map((im: Record<string, unknown>, i: number) => ({
              url: str(im.url).trim(),
              caption: nullableStr(im.caption),
              sortOrder: i,
              projectId: id,
            })),
        })
      )
    }

    if (Array.isArray(documents)) {
      // ProjectDocument has no sortOrder; preserve submitted order via createMany.
      ops.push(db.projectDocument.deleteMany({ where: { projectId: id } }))
      ops.push(
        db.projectDocument.createMany({
          data: documents
            .filter((d: { label?: string }) => d && str(d.label).trim())
            .map((d: Record<string, unknown>) => ({
              docType: str(d.docType).trim() || 'brochure',
              label: str(d.label).trim(),
              fileUrl: nullableStr(d.fileUrl),
              version: int(d.version, 1),
              viewable: d.viewable === undefined ? true : bool(d.viewable),
              gated: bool(d.gated),
              downloads: int(d.downloads),
              enabled: d.enabled === undefined ? true : bool(d.enabled),
              projectId: id,
            })),
        })
      )
    }

    await db.$transaction(ops)
    const project = await db.project.findUnique({ where: { id } })
    return NextResponse.json({ success: true, project })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('projects', true)
  if (auth instanceof Response) return auth
  const { id } = await params
  try {
    await db.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
