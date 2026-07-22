import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'
import { UI_DEFAULTS } from '@/lib/ui-strings'

let cache: Record<string, string> | null = null
let cacheTime = 0
const CACHE_TTL = 60_000

export async function getPublicUiStrings(): Promise<Record<string, string>> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return cache
  }

  try {
    const rows = await db.uiString.findMany({ select: { key: true, value: true } })
    const map: Record<string, string> = { ...UI_DEFAULTS }
    for (const row of rows) {
      if (row.value != null) map[row.key] = row.value
    }
    cache = map
    cacheTime = now
    return map
  } catch {
    cache = { ...UI_DEFAULTS }
    cacheTime = now - CACHE_TTL + 15_000
    return UI_DEFAULTS
  }
}
