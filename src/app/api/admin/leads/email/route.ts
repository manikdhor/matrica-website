import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/admin-auth'
import { sendCustomEmail } from '@/lib/email'

/** Wrap a plain-text message body in a minimal branded HTML shell. */
function wrapHtml(message: string): string {
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFB;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#1E6B3A,#166B34);padding:20px 32px;">
        <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">MATRICA REAL ESTATE LTD</h1>
      </td></tr>
      <tr><td style="padding:28px 32px;font-size:14px;color:#334155;line-height:1.7;">${safe}</td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission('leads', true)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { leadId, leadIds, subject, message } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const ids: string[] = Array.isArray(leadIds) && leadIds.length > 0
      ? leadIds
      : leadId
        ? [leadId]
        : []
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No recipient specified' }, { status: 400 })
    }

    const leads = await db.lead.findMany({ where: { id: { in: ids } } })
    const html = wrapHtml(message)

    let sent = 0
    let failed = 0
    let skipped = 0

    for (const lead of leads) {
      if (!lead.email) {
        skipped++
        continue
      }
      const result = await sendCustomEmail(lead.email, subject, html, lead.id)
      if (result.success) {
        sent++
        await db.leadActivity.create({
          data: {
            leadId: lead.id,
            type: 'email_sent',
            description: `Email sent by ${auth.username}: "${subject}"`,
            createdBy: auth.username,
          },
        }).catch(() => {})
      } else {
        failed++
      }
    }

    if (sent === 0 && failed === 0 && skipped > 0) {
      return NextResponse.json(
        { success: false, error: 'No selected leads have an email address', sent, failed, skipped },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: sent > 0, sent, failed, skipped, total: leads.length })
  } catch (error) {
    console.error('Lead email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
