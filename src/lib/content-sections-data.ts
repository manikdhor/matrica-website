import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

export type PublicContentSection = {
  sectionKey: string
  title: string | null
  subtitle: string | null
  content: string | null
  icon: string | null
  image: string | null
  config: string | null
}

export type PublicContentSectionsMap = Record<string, PublicContentSection>

// Simple in-memory cache (same pattern as hero-slides.ts). Shared by the
// /api/content-sections route and by page.tsx server components that want
// to seed the client cache instead of paying a client-side fetch.
let cache: PublicContentSectionsMap | null = null
let cacheTime = 0
const CACHE_TTL = 60_000

export async function getContentSectionsMap(): Promise<PublicContentSectionsMap> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return cache
  }
  try {
    const sections = await db.contentSection.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        sectionKey: true,
        title: true,
        subtitle: true,
        content: true,
        icon: true,
        image: true,
        config: true,
      },
    })
    const map: PublicContentSectionsMap = {}
    for (const s of sections) map[s.sectionKey] = s
    cache = map
    cacheTime = now
    return map
  } catch (error) {
    console.error('Content sections fetch error:', error)
    cache = {}
    cacheTime = now - CACHE_TTL + 15_000
    return {}
  }
}
