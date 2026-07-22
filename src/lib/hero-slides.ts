import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

export interface PublicHeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  imageUrl: string
  backgroundImage: string | null
  mobileImage: string | null
  label: string | null
  cta1Text: string | null
  cta1Href: string | null
  cta2Text: string | null
  cta2Href: string | null
  ctaText: string | null
  ctaLink: string | null
  sortOrder: number
}

export interface PublicHeroSlidesPayload {
  slides: PublicHeroSlide[]
  fallback?: boolean
}

const FALLBACK: PublicHeroSlidesPayload = { slides: [], fallback: true }

// Simple in-memory cache (same pattern as /api/site-settings)
let cache: PublicHeroSlidesPayload | null = null
let cacheTime = 0
let cachePromise: Promise<PublicHeroSlidesPayload> | null = null
const CACHE_TTL = 60_000 // 1 minute

/**
 * Server-side utility — call from Server Components or API routes.
 * The homepage server component uses this so the first hero slide is in the
 * initial HTML (LCP image preloads instead of waiting on a client fetch).
 */
export async function getHeroSlides(): Promise<PublicHeroSlidesPayload> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return cache
  }
  if (cachePromise) {
    return cachePromise
  }
  try {
    cachePromise = (async () => {
      const slides = await db.heroSlide.findMany({
        where: { enabled: true, status: 'active' },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true,
          imageUrl: true,
          backgroundImage: true,
          mobileImage: true,
          label: true,
          cta1Text: true,
          cta1Href: true,
          cta2Text: true,
          cta2Href: true,
          ctaText: true,
          ctaLink: true,
          sortOrder: true,
        },
      })

      if (slides.length === 0) {
        cache = FALLBACK
        cacheTime = Date.now()
        return FALLBACK
      }

      const payload: PublicHeroSlidesPayload = { slides }
      cache = payload
      cacheTime = Date.now()
      return payload
    })()
    return await cachePromise
  } catch {
    // DB unreachable — negative-cache briefly so repeated requests don't
    // each pay the full connect timeout; public page uses hardcoded content.
    cache = FALLBACK
    cacheTime = now - CACHE_TTL + 15_000
    return FALLBACK
  } finally {
    cachePromise = null
  }
}
