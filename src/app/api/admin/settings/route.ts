import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { hasPermission } from '@/lib/permissions'
import { invalidateAiConfigCache } from '@/lib/ai'
import { invalidatePersonaCache } from '@/app/api/chat/route'

// Credential-bearing keys are only returned raw to admins with settings WRITE
// access; read-only viewers get a mask so secrets can't be exfiltrated.
const SECRET_KEYS = new Set(['ai_api_key', 'smtp_pass', 'wa_api_token'])

export async function GET() {
  const auth = await requirePermission('settings', false)
  if (auth instanceof Response) return auth
  const canWrite = hasPermission(auth, 'settings', true)
  const settings = await db.setting.findMany()
  const obj: Record<string, string | null> = {}
  settings.forEach((s) => {
    obj[s.key] = !canWrite && SECRET_KEYS.has(s.key) && s.value ? '••••••••' : s.value
  })
  return NextResponse.json(obj)
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('settings', true)
  if (auth instanceof Response) return auth
  const { settings } = await request.json()
  if (!settings || typeof settings !== 'object') return NextResponse.json({ error: 'settings object required' }, { status: 400 })

  await db.$transaction(
    Object.entries(settings).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  )

  // AI settings are cached in-process — invalidate when any ai_* key changes
  if (Object.keys(settings).some((key) => key.startsWith('ai_'))) {
    invalidateAiConfigCache()
  }

  // Chat persona settings are cached in the chat route — invalidate on chat_* changes
  if (Object.keys(settings).some((key) => key.startsWith('chat_'))) {
    invalidatePersonaCache()
  }

  return NextResponse.json({ success: true })
}