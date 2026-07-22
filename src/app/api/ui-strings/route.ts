import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UI_DEFAULTS } from '@/lib/ui-strings'
import { cacheValidSince } from '@/lib/content-version'

// Simple in-memory cache (same pattern as /api/hero-slides)
let cache: Record<string, string> | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

/** PUBLIC — merged UI strings: bundled defaults overlaid with DB overrides. */
export async function GET() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return NextResponse.json(cache)
  }
  try {
    const rows = await db.uiString.findMany({ select: { key: true, value: true } })
    const map: Record<string, string> = { ...UI_DEFAULTS }
    for (const r of rows) if (r.value != null) map[r.key] = r.value
    cache = map
    cacheTime = now
    return NextResponse.json(map)
  } catch (error) {
    console.error('ui-strings public GET error:', error)
    // DB unreachable — negative-cache briefly so repeated requests don't
    // each pay the full connect timeout; client falls back to bundled defaults.
    cache = { ...UI_DEFAULTS }
    cacheTime = now - CACHE_TTL + 15_000
    return NextResponse.json(UI_DEFAULTS, { status: 200 })
  }
}
