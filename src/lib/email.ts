import nodemailer from 'nodemailer'
import { getRawSettings } from '@/app/api/site-settings/route'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

let transporter: nodemailer.Transporter | null = null
let transporterKey: string | null = null

function getTransporter(config: EmailConfig): nodemailer.Transporter {
  // Key the cache on the connection config so SMTP setting edits take effect
  // immediately, without needing a process restart.
  const key = `${config.host}|${config.port}|${config.secure}|${config.user}|${config.pass}`
  if (transporter && transporterKey === key) return transporter
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })
  transporterKey = key
  return transporter
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  const { db } = await import('@/lib/db')
  const keys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email']
  const settings = await db.setting.findMany({ where: { key: { in: keys } } })
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  if (!map.smtp_host || !map.smtp_user || !map.smtp_pass) return null
  return {
    host: map.smtp_host,
    port: parseInt(map.smtp_port || '587'),
    secure: map.smtp_secure === 'true',
    user: map.smtp_user,
    pass: map.smtp_pass,
    fromName: map.smtp_from_name || 'MATRICA REAL ESTATE LTD',
    fromEmail: map.smtp_from_email || map.smtp_user,
  }
}

function getWelcomeEmailHtml(
  name: string,
  settings: {
    companyName: string
    companyTagline: string
    companyAddress: string
    companyPhone: string
    companyEmail: string
    siteUrl: string
  },
  projectName?: string
): string {
  const { companyName, companyTagline, companyAddress, companyPhone, companyEmail, siteUrl } = settings
  const projectLine = projectName ? `<p style="margin:0 0 8px;font-size:14px;color:#64748B;">You expressed interest in <strong style="color:#1E6B3A;">${projectName}</strong>.</p>` : ''
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFB;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);max-width:600px;width:100%;">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#1E6B3A,#166B34);padding:32px 40px;">
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Welcome to ${companyName.replace(' LTD', '').replace(' LTD.', '')}</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${companyTagline}</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 16px;font-size:16px;color:#1A202C;">Dear <strong>${name}</strong>,</p>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">Thank you for your interest in ${companyName}! We're thrilled that you're considering us for your dream property investment in Purbachal, Dhaka.</p>
        ${projectLine}
        <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">Our team of expert advisors will reach out to you within <strong>24 hours</strong> to discuss your requirements and help you find the perfect plot.</p>
        
        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
          <td style="background:#1E6B3A;border-radius:8px;padding:0;">
            <a href="${siteUrl}/projects" style="display:inline-block;padding:12px 32px;color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Explore Our Projects</a>
          </td>
        </tr></table>
        
        <div style="border-top:1px solid #E2E8F0;padding-top:20px;margin-top:8px;">
          <p style="margin:0 0 8px;font-size:13px;color:#64748B;"><strong>Why ${companyName.replace(' LTD', '').replace(' LTD.', '')}?</strong></p>
          <ul style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:1.8;">
            <li>Planned in line with RAJUK policy, beside RAJUK Purbachal New Town</li>
            <li>550+ bigha under master-planned development</li>
            <li>Land held in the company's own name — registration right after payment</li>
            <li>Transparent pricing and verifiable documentation</li>
          </ul>
        </div>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#F8FAFB;padding:20px 40px;border-top:1px solid #E2E8F0;">
        <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">${companyName}</p>
        <p style="margin:0 0 4px;font-size:11px;color:#CBD5E1;">${companyAddress}</p>
        <p style="margin:0;font-size:11px;color:#CBD5E1;">📞 ${companyPhone} &nbsp;|&nbsp; 📧 ${companyEmail}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

export async function sendWelcomeEmail(to: string, name: string, projectName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getEmailConfig()
    if (!config) {
      console.log('[Email] SMTP not configured, skipping welcome email')
      return { success: false, error: 'SMTP not configured' }
    }

    const s = await getRawSettings()
    const companyName = s.company_name || 'MATRICA REAL ESTATE LTD'
    const companyTagline = s.company_tagline || 'Premium Land Developer in Purbachal, Dhaka'
    const companyAddress = s.company_address || 'House 45, Road 135, Gulshan-2, Dhaka 1212, Bangladesh'
    const companyPhone = s.company_phone || '+8801XXXXXXXXX'
    const companyEmail = s.company_email || 'info@matrica.com.bd'
    const siteUrl = s.site_url || 'https://matrica.com.bd'

    const transport = getTransporter(config)
    const html = getWelcomeEmailHtml(name, { companyName, companyTagline, companyAddress, companyPhone, companyEmail, siteUrl }, projectName)

    await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject: `Welcome to ${companyName}, ${name}!`,
      html,
    })

    // Log the email
    const { db } = await import('@/lib/db')
    await db.emailLog.create({
      data: { to, subject: `Welcome to ${companyName}, ${name}!`, body: html, status: 'sent', sentAt: new Date() },
    })

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Email] Failed to send welcome email:', msg)
    // Log the failure
    try {
      const { db } = await import('@/lib/db')
      await db.emailLog.create({
        data: { to, subject: `Welcome, ${name}!`, body: 'Welcome email', status: 'failed', error: msg },
      })
    } catch {}
    return { success: false, error: msg }
  }
}

export async function sendCustomEmail(to: string, subject: string, html: string, leadId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getEmailConfig()
    if (!config) return { success: false, error: 'SMTP not configured' }
    const transport = getTransporter(config)
    await transport.sendMail({ from: `"${config.fromName}" <${config.fromEmail}>`, to, subject, html })
    const { db } = await import('@/lib/db')
    await db.emailLog.create({ data: { to, subject, body: html, status: 'sent', sentAt: new Date(), leadId } })
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: msg }
  }
}