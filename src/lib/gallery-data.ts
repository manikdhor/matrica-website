import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

export interface PublicGalleryItem {
  id: string
  title: string | null
  caption: string | null
  mediaType: string
  fileUrl: string | null
  videoUrl: string | null
  sortOrder: number
}

export interface PublicGalleryCategory {
  id: string
  name: string
  slug: string
  cover: string | null
  sortOrder: number
  items: PublicGalleryItem[]
}

export interface PublicGalleryPayload {
  categories: PublicGalleryCategory[]
  fallback?: boolean
}

// Simple in-memory cache (same pattern as hero-slides.ts). Shared by the
// /api/gallery route and by gallery/page.tsx so the masonry grid can render
// real images on first paint instead of a client /api/gallery round-trip.
let cache: PublicGalleryPayload | null = null
let cacheTime = 0
const CACHE_TTL = 60_000

const FALLBACK: PublicGalleryPayload = { categories: [], fallback: true }

export async function getGalleryPayload(): Promise<PublicGalleryPayload> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return cache
  }
  try {
    const categories = await db.galleryCategory.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        cover: true,
        sortOrder: true,
        items: {
          where: { enabled: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            caption: true,
            mediaType: true,
            fileUrl: true,
            videoUrl: true,
            sortOrder: true,
          },
        },
      },
    })

    const totalItems = categories.reduce((n, c) => n + c.items.length, 0)
    if (totalItems === 0) {
      return FALLBACK
    }

    const payload: PublicGalleryPayload = { categories }
    cache = payload
    cacheTime = now
    return payload
  } catch {
    return FALLBACK
  }
}
