import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

// Simple in-memory cache (same pattern as /api/hero-slides)
let cache: Awaited<ReturnType<typeof fetchLinks>> | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

function fetchLinks() {
  return db.socialLink.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, platform: true, url: true, icon: true, label: true },
  })
}

/** PUBLIC — admin-managed social links (dynamic, any platform). */
export async function GET() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return NextResponse.json(cache)
  }
  try {
    const links = await fetchLinks()
    cache = links
    cacheTime = now
    return NextResponse.json(links)
  } catch (error) {
    console.error('social-links public GET error:', error)
    // DB unreachable — negative-cache briefly so repeated requests don't
    // each pay the full connect timeout.
    cache = []
    cacheTime = now - CACHE_TTL + 15_000
    return NextResponse.json([], { status: 200 })
  }
}
