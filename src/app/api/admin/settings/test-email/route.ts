import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin-auth'
import { getEmailConfig, sendWelcomeEmail } from '@/lib/email'

export async function POST() {
  try {
    const auth = await requirePermission('settings', true)
    if (auth instanceof NextResponse) return auth

    const config = await getEmailConfig()
    if (!config) {
      return NextResponse.json({ error: 'SMTP not configured. Please save SMTP settings first.' }, { status: 400 })
    }

    // Send test email to the configured from address
    const testTo = config.fromEmail || config.user
    const result = await sendWelcomeEmail(testTo, 'Admin Test', undefined)

    if (result.success) {
      return NextResponse.json({ success: true, message: `Test email sent to ${testTo}` })
    }
    return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 500 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}