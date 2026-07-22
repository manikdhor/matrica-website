import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { hasPermission, resolveLeadAccess } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const auth = await requirePermission('dashboard', false)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ leads: [], projects: [], blogPosts: [], siteVisits: [], testimonials: [] })
    }

    const where = {
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ],
    }

    // Each sub-search is gated by its own module so dashboard access alone
    // can't leak lead / site-visit contact data.
    const canRead = (module: string) => hasPermission(auth, module, false)
    // Own-scope users (sales) only ever see their own leads in search results
    const leadAccess = resolveLeadAccess(auth)
    const leadScope = leadAccess?.scope === 'own' ? { assignedTo: auth.name } : {}

    const [leads, projects, blogPosts, siteVisits, testimonials] = await Promise.all([
      // Leads: search name, phone, email
      canRead('leads')
        ? db.lead.findMany({
            where: { ...where, ...leadScope },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, phone: true, email: true, status: true, createdAt: true },
          })
        : Promise.resolve([]),

      // Projects: search name
      canRead('projects')
        ? db.project.findMany({
            where: { name: { contains: q } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, status: true, publishStatus: true, locationArea: true },
          })
        : Promise.resolve([]),

      // Blog Posts: search title
      canRead('blog')
        ? db.blogPost.findMany({
            where: { title: { contains: q } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, status: true, category: true, createdAt: true },
          })
        : Promise.resolve([]),

      // Site Visits: search name, phone
      canRead('siteVisits')
        ? db.siteVisitBooking.findMany({
            where: {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
              ],
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, phone: true, preferredDate: true, status: true },
          })
        : Promise.resolve([]),

      // Testimonials: search name
      canRead('testimonials')
        ? db.testimonial.findMany({
            where: { name: { contains: q } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, designation: true, status: true },
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      leads: leads.map((l) => ({
        id: l.id,
        type: 'lead' as const,
        title: l.name,
        subtitle: l.phone + (l.email ? ` · ${l.email}` : ''),
        href: `/admin/leads?id=${l.id}`,
        meta: l.status,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        subtitle: p.locationArea || p.status,
        href: `/admin/projects?id=${p.id}`,
        meta: p.publishStatus,
      })),
      blogPosts: blogPosts.map((b) => ({
        id: b.id,
        type: 'blogPost' as const,
        title: b.title,
        subtitle: b.category || b.status,
        href: `/admin/blog?id=${b.id}`,
        meta: b.status,
      })),
      siteVisits: siteVisits.map((s) => ({
        id: s.id,
        type: 'siteVisit' as const,
        title: s.name,
        subtitle: `${s.phone} · ${s.preferredDate}`,
        href: `/admin/site-visits?id=${s.id}`,
        meta: s.status,
      })),
      testimonials: testimonials.map((t) => ({
        id: t.id,
        type: 'testimonial' as const,
        title: t.name,
        subtitle: t.designation || '—',
        href: `/admin/testimonials?id=${t.id}`,
        meta: t.status,
      })),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}