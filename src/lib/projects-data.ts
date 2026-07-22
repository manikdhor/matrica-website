import { db } from '@/lib/db'
import { shapeProject, FALLBACK_PROJECTS, type PublicProject } from '@/lib/project-shape'
import { cacheValidSince } from '@/lib/content-version'

/**
 * Server-side utilities — same in-memory-cache pattern as hero-slides.ts /
 * site-settings route.ts. Shared by the public API routes (/api/projects,
 * /api/projects/[slug]) AND by the page.tsx server components, so a project
 * page can pass real data to its client component as a prop instead of
 * waiting on a client-side fetch of the same data it could've had at
 * render time.
 */

const include = {
  specs: { orderBy: { sortOrder: 'asc' as const } },
  stages: { orderBy: { sortOrder: 'asc' as const } },
  amenities: { orderBy: { sortOrder: 'asc' as const } },
  distances: { orderBy: { sortOrder: 'asc' as const } },
  landmarks: { orderBy: { sortOrder: 'asc' as const } },
  faqs: { orderBy: { sortOrder: 'asc' as const } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  highlights: { orderBy: { sortOrder: 'asc' as const } },
  documents: true,
}

let listCache: PublicProject[] | null = null
let listCacheTime = 0
const LIST_CACHE_TTL = 60_000

export async function getPublishedProjects(): Promise<PublicProject[]> {
  const now = Date.now()
  if (listCache && now - listCacheTime < LIST_CACHE_TTL && cacheValidSince(listCacheTime)) {
    return listCache
  }
  try {
    const projects = await db.project.findMany({
      where: { publishStatus: 'published' },
      orderBy: { sortOrder: 'asc' },
      include,
    })
    if (projects.length === 0) {
      listCache = FALLBACK_PROJECTS
      listCacheTime = now
      return FALLBACK_PROJECTS
    }
    const shaped = projects.map(shapeProject)
    listCache = shaped
    listCacheTime = now
    return shaped
  } catch (error) {
    console.error('Error fetching projects:', error)
    listCache = FALLBACK_PROJECTS
    listCacheTime = now - LIST_CACHE_TTL + 15_000
    return FALLBACK_PROJECTS
  }
}

const detailCache = new Map<string, { data: PublicProject; at: number }>()
const DETAIL_CACHE_TTL = 60_000

export async function getPublishedProjectBySlug(slug: string): Promise<PublicProject | null> {
  const now = Date.now()
  const hit = detailCache.get(slug)
  if (hit && now - hit.at < DETAIL_CACHE_TTL && cacheValidSince(hit.at)) {
    return hit.data
  }
  try {
    const p = await db.project.findFirst({
      where: { slug, publishStatus: 'published' },
      include: { ...include, documents: { where: { enabled: true } } },
    })
    if (!p) {
      return FALLBACK_PROJECTS.find((x) => x.slug === slug) ?? null
    }
    const shaped = shapeProject(p)
    detailCache.set(slug, { data: shaped, at: now })
    return shaped
  } catch (error) {
    console.error('Error fetching project:', error)
    return FALLBACK_PROJECTS.find((x) => x.slug === slug) ?? null
  }
}
