import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const auth = await requirePermission('settings', true)
    if (auth instanceof NextResponse) return auth

    // Get WhatsApp settings to determine provider
    const settings = await db.setting.findMany({
      where: { key: { in: ['wa_provider', 'wa_phone_number_id', 'social_whatsapp'] } },
    })
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    const provider = map.wa_provider || 'mock'

    if (provider === 'mock') {
      // In mock mode, create a test message record
      const testPhone = map.social_whatsapp?.replace(/[^0-9]/g, '') || '8801700000000'
      const result = await sendWhatsAppMessage({
        to: testPhone,
        customMessage: '🧪 *Test Message* from MATRICA Admin Panel\n\nThis is a test WhatsApp message. If you see this, the WhatsApp integration is working correctly in mock mode.\n\n_MATRICA REAL ESTATE LTD_',
      })
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Mock message created (ID: ${result.messageId}). No actual message was sent — configure a provider (Meta/Twilio) for real delivery.`,
        })
      }
      return NextResponse.json({ error: result.error || 'Mock mode failed' }, { status: 500 })
    }

    // For real providers, send to the configured business number
    const testPhone = map.social_whatsapp?.replace(/[^0-9]/g, '') || '8801700000000'
    const result = await sendWhatsAppMessage({
      to: testPhone,
      customMessage: '🧪 *Test Message* from MATRICA Admin Panel\n\nThis is a test WhatsApp message to verify your ' + provider + ' integration is working.\n\n_MATRICA REAL ESTATE LTD_',
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: `Test message sent to ${testPhone}` })
    }
    return NextResponse.json({ error: result.error || 'Failed to send test WhatsApp' }, { status: 500 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}