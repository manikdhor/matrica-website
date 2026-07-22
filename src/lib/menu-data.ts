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

let cache: PublicMenu | null = null
let cacheTime = 0
const CACHE_TTL = 60_000

function toPublicMenu(rows: Array<{ enabled: boolean; location: string; label: string; href: string; target: string | null; icon: string | null }>): PublicMenu {
  if (rows.length === 0) return FALLBACK

  const pick = (location: string): PublicMenuItem[] =>
    rows
      .filter((row) => row.enabled && row.location === location)
      .map(({ label, href, target, icon }) => ({ label, href, target, icon }))

  const header = pick('header')
  const footer = pick('footer')
  const mobile = pick('mobile')

  return {
    header: header.length ? header : DEFAULT_HEADER_MENU,
    footer: footer.length ? footer : DEFAULT_FOOTER_MENU,
    mobile: mobile.length ? mobile : DEFAULT_MOBILE_MENU,
  }
}

export async function getPublicMenu(): Promise<PublicMenu> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return cache
  }

  try {
    const rows = await db.menuItem.findMany({ orderBy: { sortOrder: 'asc' } })
    cache = toPublicMenu(rows)
    cacheTime = now
    return cache
  } catch {
    return FALLBACK
  }
}
