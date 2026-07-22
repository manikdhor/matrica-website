import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'

// WhatsApp + Email settings
const SETTING_KEYS = [
  'wa_provider', 'wa_api_token', 'wa_phone_number_id', 'wa_base_url',
  'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email',
  'communication_welcome_email_enabled', 'communication_welcome_whatsapp_enabled',
  'communication_auto_whatsapp_template',
]

export async function GET() {
  const auth = await requirePermission('whatsapp', false)
  if (auth instanceof Response) return auth
  try {
    const settings = await db.setting.findMany({ where: { key: { in: SETTING_KEYS } } })
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    // Mask sensitive values
    if (map.wa_api_token) map.wa_api_token_masked = map.wa_api_token.substring(0, 8) + '...'
    if (map.smtp_pass) map.smtp_pass_masked = '••••••••'
    return NextResponse.json(map)
  } catch (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission('whatsapp', true)
  if (auth instanceof Response) return auth
  try {
    const settings = await request.json()
    await db.$transaction(
      Object.entries(settings)
        .filter(([key]) => SETTING_KEYS.includes(key))
        .map(([key, value]) =>
          db.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          })
        )
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Communication settings error:', error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}