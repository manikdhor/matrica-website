import { db } from '@/lib/db'
import { getRawSettings } from '@/app/api/site-settings/route'

interface SendWhatsAppParams {
  to: string
  templateId?: string
  customMessage?: string
  leadId?: string
  variables?: Record<string, string>
  createdBy?: string
}

export async function sendWhatsAppMessage({
  to,
  templateId,
  customMessage,
  leadId,
  variables = {},
  createdBy,
}: SendWhatsAppParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let messageBody = customMessage || ''

    // If template is provided, render it with variables
    if (templateId && !customMessage) {
      const template = await db.whatsAppTemplate.findUnique({ where: { id: templateId } })
      if (!template) return { success: false, error: 'Template not found' }
      messageBody = renderTemplate(template.body, variables)
    }

    if (!messageBody) return { success: false, error: 'No message content' }

    // Get WhatsApp settings
    const settings = await db.setting.findMany({
      where: { key: { in: ['wa_provider', 'wa_api_token', 'wa_phone_number_id', 'wa_base_url'] } },
    })
    const settingMap = Object.fromEntries(settings.map(s => [s.key, s.value]))

    const provider = settingMap.wa_provider || 'mock'
    const apiToken = settingMap.wa_api_token
    const phoneNumberId = settingMap.wa_phone_number_id
    const baseUrl = settingMap.wa_base_url || 'https://graph.facebook.com/v18.0'

    let providerId: string | null = null
    let sendError: string | null = null

    // Normalize phone number
    const phone = to.replace(/[^0-9+]/g, '')

    if (provider === 'mock') {
      // Mock mode — explicitly configured; log and mark as sent
      providerId = `mock_${Date.now()}`
    } else if (provider === 'meta') {
      if (!apiToken || !phoneNumberId) {
        sendError = 'Meta WhatsApp not configured: missing API token or phone number ID'
      } else {
      // Meta WhatsApp Business API
      try {
        const res = await fetch(`${baseUrl}/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: messageBody },
          }),
        })
        const data = await res.json()
        if (data.messages?.[0]?.id) {
          providerId = data.messages[0].id
        } else {
          sendError = data.error?.message || 'Meta API error'
        }
      } catch (e) {
        sendError = e instanceof Error ? e.message : 'Meta API request failed'
      }
      }
    } else if (provider === 'twilio') {
      // Twilio WhatsApp API
      try {
        const accountSid = settingMap.wa_api_token?.split(':')[0] || ''
        const authToken = settingMap.wa_api_token?.split(':')[1] || ''
        const twilioUrl = baseUrl || 'https://api.twilio.com'

        const res = await fetch(`${twilioUrl}/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: `whatsapp:${phoneNumberId}`,
            To: `whatsapp:${phone}`,
            Body: messageBody,
          }),
        })
        const data = await res.json()
        if (data.sid) {
          providerId = data.sid
        } else {
          sendError = data.message || 'Twilio API error'
        }
      } catch (e) {
        sendError = e instanceof Error ? e.message : 'Twilio API request failed'
      }
    } else {
      // Unknown/unconfigured provider — do NOT silently pretend to send
      sendError = `WhatsApp provider not configured: "${provider}". Set wa_provider to mock, meta, or twilio.`
    }

    // Save message record
    const record = await db.whatsAppMessage.create({
      data: {
        leadId: leadId || null,
        to: phone,
        templateId: templateId || null,
        message: messageBody,
        status: sendError ? 'failed' : 'sent',
        providerId: providerId || null,
        sentAt: sendError ? null : new Date(),
        error: sendError,
        createdBy: createdBy || null,
      },
    })

    return {
      success: !sendError,
      messageId: record.id,
      error: sendError || undefined,
    }
  } catch (error) {
    console.error('sendWhatsAppMessage error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Send failed' }
  }
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value)
  }
  return result
}

/**
 * Get the default welcome WhatsApp message.
 * Used when no custom template is configured.
 */
function getDefaultWelcomeMessage(
  name: string,
  settings: {
    companyName: string
    companyAddress: string
    companyPhone: string
    siteUrl: string
    companyTagline: string
  },
  projectName?: string
): string {
  const { companyName, companyAddress, companyPhone, siteUrl, companyTagline } = settings
  const projectLine = projectName
    ? `\n\nYou expressed interest in *${projectName}*.`
    : ''
  return (
    `Hello ${name}! 👋 Welcome to *${companyName}*.\n\n` +
    `Thank you for reaching out to us. We're excited to help you find your dream property in Purbachal, Dhaka!${projectLine}\n\n` +
    `Our team will contact you within *24 hours* to discuss your requirements.\n\n` +
    `In the meantime, feel free to:\n` +
    `• Explore our projects: ${siteUrl}/projects\n` +
    `• Call us: ${companyPhone}\n` +
    `• Visit our office: ${companyAddress}\n\n` +
    `_${companyName} — ${companyTagline}_`
  )
}

/**
 * Fire-and-forget welcome WhatsApp message for a newly created lead.
 * Looks for an active "welcome" category template first, falls back to default message.
 */
export function sendWelcomeWhatsAppInBackground(
  leadId: string,
  data: { name: string; phone: string; projectName?: string }
): Promise<void> {
  return (async () => {
    try {
      const s = await getRawSettings()
      const companyName = s.company_name || 'MATRICA REAL ESTATE LTD'
      const companyAddress = s.company_address || 'House 45, Road 135, Gulshan-2, Dhaka 1212, Bangladesh'
      const companyPhone = s.company_phone || '+8801XXXXXXXXX'
      const siteUrl = s.site_url || 'https://matrica.com.bd'
      const companyTagline = s.company_tagline || 'Premium Land Developer in Purbachal, Dhaka'

      // Try to find an active welcome template
      const welcomeTemplate = await db.whatsAppTemplate.findFirst({
        where: { category: 'welcome', isActive: true },
        orderBy: { sortOrder: 'asc' },
      })

      const messageBody = welcomeTemplate
        ? renderTemplate(welcomeTemplate.body, {
            name: data.name,
            phone: data.phone,
            project: data.projectName || 'our projects',
            company: companyName,
            date: new Date().toLocaleDateString('en-BD'),
            time: new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }),
          })
        : getDefaultWelcomeMessage(data.name, { companyName, companyAddress, companyPhone, siteUrl, companyTagline }, data.projectName)

      const result = await sendWhatsAppMessage({
        to: data.phone,
        customMessage: messageBody,
        leadId,
        templateId: welcomeTemplate?.id,
      })

      if (result.success) {
        console.log(`[WhatsApp] Welcome message sent to ${data.phone} (lead: ${leadId})`)
      } else {
        console.warn(`[WhatsApp] Failed to send welcome to ${data.phone}:`, result.error)
      }
    } catch (err) {
      console.error('[WhatsApp] sendWelcomeWhatsAppInBackground failed for', leadId, err)
    }
  })()
}

/**
 * Seed a set of default WhatsApp templates. No-op if templates already exist.
 * Placeholders use the {{key}} syntax consumed by renderTemplate().
 */
export async function seedDefaultTemplates(): Promise<void> {
  const count = await db.whatsAppTemplate.count()
  if (count > 0) return

  await db.whatsAppTemplate.createMany({
    data: [
      {
        name: 'Welcome',
        description: 'Sent automatically when a new lead is created.',
        body: 'Hello {{name}}, thank you for your interest in {{company}}! Our team will contact you shortly regarding {{project}}. For any query, feel free to reply here.',
        category: 'welcome',
        isActive: true,
        sortOrder: 0,
      },
      {
        name: 'Follow Up',
        description: 'General follow-up with a lead.',
        body: 'Hi {{name}}, just following up on your interest in {{project}}. Would you like to schedule a site visit? — {{company}}',
        category: 'follow_up',
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Site Visit Reminder',
        description: 'Reminds a lead about an upcoming site visit.',
        body: 'Reminder: your site visit for {{project}} is scheduled on {{date}} at {{time}}. See you soon! — {{company}}',
        category: 'reminder',
        isActive: true,
        sortOrder: 2,
      },
    ],
  })
}