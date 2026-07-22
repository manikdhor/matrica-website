import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

export interface PublicSocialLink {
  id: string
  platform: string
  url: string
  icon: string
  label?: string
}

let cache: PublicSocialLink[] | null = null
let cacheTime = 0
const CACHE_TTL = 60_000

export async function getPublicSocialLinks(): Promise<PublicSocialLink[]> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return cache
  }

  try {
    cache = await db.socialLink.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, platform: true, url: true, icon: true, label: true },
    })
    cacheTime = now
    return cache
  } catch {
    cache = []
    cacheTime = now - CACHE_TTL + 15_000
    return []
  }
}
