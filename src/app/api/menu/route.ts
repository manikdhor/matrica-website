import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'
import {
  DEFAULT_HEADER_MENU,
  DEFAULT_FOOTER_MENU,
  DEFAULT_MOBILE_MENU,
  type PublicMenuItem,
} from '@/lib/menu-defaults'

export interface PublicMenu {
  header: PublicMenuItem[]
  footer: PublicMenuItem[]
  mobile: PublicMenuItem[]
}

const FALLBACK: PublicMenu = {
  header: DEFAULT_HEADER_MENU,
  footer: DEFAULT_FOOTER_MENU,
  mobile: DEFAULT_MOBILE_MENU,
}

// Simple in-memory cache (same pattern as /api/site-settings)
let cache: PublicMenu | null = null
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

export async function GET() {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return NextResponse.json(cache)
  }
  try {
    const rows = await db.menuItem.findMany({ orderBy: { sortOrder: 'asc' } })
    // Empty table → serve hardcoded defaults (not cached, so seeding shows up immediately)
    if (rows.length === 0) {
      return NextResponse.json(FALLBACK)
    }
    const pick = (location: string): PublicMenuItem[] =>
      rows
        .filter(r => r.enabled && r.location === location)
        .map(({ label, href, target, icon }) => ({ label, href, target, icon }))
    const header = pick('header')
    const footer = pick('footer')
    const mobile = pick('mobile')
    // Each location falls back to its hardcoded default when the DB has no enabled
    // rows for it, so nav never silently disappears if one location is empty.
    cache = {
      header: header.length ? header : DEFAULT_HEADER_MENU,
      footer: footer.length ? footer : DEFAULT_FOOTER_MENU,
      mobile: mobile.length ? mobile : DEFAULT_MOBILE_MENU,
    }
    cacheTime = now
    return NextResponse.json(cache)
  } catch {
    // DB unreachable → graceful fallback with 200
    return NextResponse.json(FALLBACK)
  }
}
