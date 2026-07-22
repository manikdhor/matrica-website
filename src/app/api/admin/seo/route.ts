import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { SEO_PAGES, SEO_SETTING_KEY, getPageSeoMap, type PageSeoEntry, type PageSeoMap } from '@/lib/seo'

const ALLOWED_KEYS = ['title', 'description', 'keywords', 'ogImage', 'noindex'] as const

export async function GET() {
  const auth = await requirePermission('settings', false)
  if (auth instanceof Response) return auth
  return NextResponse.json({ pages: SEO_PAGES, map: await getPageSeoMap() })
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('settings', true)
  if (auth instanceof Response) return auth

  const body = await request.json()
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A page SEO map object is required' }, { status: 400 })
  }

  // Strip unknown keys per entry — only allow the known PageSeoEntry fields.
  const clean: PageSeoMap = {}
  for (const [path, rawEntry] of Object.entries(body as Record<string, unknown>)) {
    if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) continue
    const src = rawEntry as Record<string, unknown>
    const entry: PageSeoEntry = {}
    for (const key of ALLOWED_KEYS) {
      if (!(key in src) || src[key] == null) continue
      if (key === 'noindex') {
        entry.noindex = Boolean(src[key])
      } else {
        entry[key] = String(src[key])
      }
    }
    clean[path] = entry
  }

  await db.setting.upsert({
    where: { key: SEO_SETTING_KEY },
    update: { value: JSON.stringify(clean) },
    create: { key: SEO_SETTING_KEY, value: JSON.stringify(clean) },
  })

  return NextResponse.json({ success: true })
}
