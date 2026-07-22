import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requirePermission } from '@/lib/admin-auth'

// Default field options - used when no custom options are saved in the DB
const DEFAULT_OPTIONS: Record<string, { label: string; value: string }[]> = {
  lead_sources: [
    { label: 'Website', value: 'website' },
    { label: 'Contact Form', value: 'contact' },
    { label: 'Project Page', value: 'project' },
    { label: 'Site Visit', value: 'site_visit' },
    { label: 'Blog', value: 'blog' },
    { label: 'Manual', value: 'manual' },
    { label: 'Referral', value: 'referral' },
    { label: 'Facebook', value: 'facebook' },
    { label: 'WhatsApp', value: 'whatsapp' },
  ],
  lead_statuses: [
    { label: 'New', value: 'new' },
    { label: 'Contacted', value: 'contacted' },
    { label: 'Qualified', value: 'qualified' },
    { label: 'Site Visit', value: 'site_visit' },
    { label: 'Negotiation', value: 'negotiation' },
    { label: 'Won', value: 'won' },
    { label: 'Lost', value: 'lost' },
  ],
  lead_priorities: [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ],
  lead_tags_colors: [
    { label: 'Indigo', value: '#6366F1' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Sky', value: '#0EA5E9' },
    { label: 'Pink', value: '#EC4899' },
    { label: 'Violet', value: '#8B5CF6' },
    { label: 'Orange', value: '#F97316' },
  ],
  site_visit_statuses: [
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ],
  site_visit_times: [
    { label: 'Morning (9AM-12PM)', value: 'morning' },
    { label: 'Afternoon (12PM-3PM)', value: 'afternoon' },
    { label: 'Evening (3PM-6PM)', value: 'evening' },
  ],
  team_categories: [
    { label: 'Management', value: 'management' },
    { label: 'Sales', value: 'sales' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Support', value: 'support' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Finance', value: 'finance' },
  ],
  team_statuses: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
  project_statuses: [
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
    { label: 'Sold Out', value: 'sold_out' },
    { label: 'Cancelled', value: 'cancelled' },
  ],
  project_publish_statuses: [
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ],
  blog_statuses: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
  blog_categories: [
    { label: 'Investment Guide', value: 'investment_guide' },
    { label: 'Project Update', value: 'project_update' },
    { label: 'Market Analysis', value: 'market_analysis' },
    { label: 'Company News', value: 'company_news' },
    { label: 'Real Estate Tips', value: 'real_estate_tips' },
    { label: 'Lifestyle', value: 'lifestyle' },
  ],
  testimonial_statuses: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
  faq_categories: [
    { label: 'General', value: 'general' },
    { label: 'Projects', value: 'projects' },
    { label: 'Payment', value: 'payment' },
    { label: 'Legal', value: 'legal' },
    { label: 'Location', value: 'location' },
    { label: 'Construction', value: 'construction' },
  ],
  newsletter_sources: [
    { label: 'Manual', value: 'manual' },
    { label: 'Footer', value: 'footer' },
    { label: 'Popup', value: 'popup' },
    { label: 'Lead Form', value: 'lead_form' },
  ],
  whatsapp_categories: [
    { label: 'General', value: 'general' },
    { label: 'Welcome', value: 'welcome' },
    { label: 'Follow Up', value: 'follow_up' },
    { label: 'Promotion', value: 'promotion' },
    { label: 'Reminder', value: 'reminder' },
    { label: 'Notification', value: 'notification' },
    { label: 'Custom', value: 'custom' },
  ],
  gallery_media_types: [
    { label: 'Image', value: 'image' },
    { label: 'Video', value: 'video' },
  ],
  follow_up_types: [
    { label: 'Call', value: 'call' },
    { label: 'Email', value: 'email' },
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'Site Visit', value: 'site_visit' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Other', value: 'other' },
  ],
  follow_up_statuses: [
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ],
  document_types: [
    { label: 'Brochure', value: 'brochure' },
    { label: 'Floor Plan', value: 'floor_plan' },
    { label: 'Price List', value: 'price_list' },
    { label: 'Payment Plan', value: 'payment_plan' },
    { label: 'Legal Document', value: 'legal_document' },
    { label: 'Site Map', value: 'site_map' },
    { label: 'Other', value: 'other' },
  ],
}

// Human-readable labels for each option key
export const OPTION_LABELS: Record<string, string> = {
  lead_sources: 'Lead Sources',
  lead_statuses: 'Lead Statuses',
  lead_priorities: 'Lead Priorities',
  lead_tags_colors: 'Lead Tag Colors',
  site_visit_statuses: 'Site Visit Statuses',
  site_visit_times: 'Site Visit Time Slots',
  team_categories: 'Team Categories',
  team_statuses: 'Team Statuses',
  project_statuses: 'Project Statuses',
  project_publish_statuses: 'Project Publish Statuses',
  blog_statuses: 'Blog Post Statuses',
  blog_categories: 'Blog Categories',
  testimonial_statuses: 'Testimonial Statuses',
  faq_categories: 'FAQ Categories',
  newsletter_sources: 'Newsletter Sources',
  whatsapp_categories: 'WhatsApp Template Categories',
  gallery_media_types: 'Gallery Media Types',
  follow_up_types: 'Follow-up Types',
  follow_up_statuses: 'Follow-up Statuses',
  document_types: 'Document Types',
}

export const OPTION_GROUPS: Record<string, { label: string; keys: string[] }> = {
  leads: { label: 'Leads & CRM', keys: ['lead_sources', 'lead_statuses', 'lead_priorities', 'lead_tags_colors', 'follow_up_types', 'follow_up_statuses'] },
  projects: { label: 'Projects', keys: ['project_statuses', 'project_publish_statuses', 'document_types'] },
  site_visits: { label: 'Site Visits', keys: ['site_visit_statuses', 'site_visit_times'] },
  content: { label: 'Content', keys: ['blog_statuses', 'blog_categories', 'faq_categories', 'testimonial_statuses', 'gallery_media_types'] },
  team: { label: 'Team', keys: ['team_categories', 'team_statuses'] },
  communication: { label: 'Communication', keys: ['whatsapp_categories', 'newsletter_sources'] },
}

export async function GET(req: NextRequest) {
  try {
    // Any authenticated admin can read option lists — they feed the form
    // dropdowns on every content module, not just the Settings page.
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    // Fetch all option settings from DB
    const settings = await db.setting.findMany({
      where: {
        key: {
          startsWith: 'options_',
        },
      },
    })

    const overrides: Record<string, { label: string; value: string }[]> = {}
    for (const s of settings) {
      try {
        const parsed = JSON.parse(s.value || '[]')
        if (Array.isArray(parsed)) {
          overrides[s.key] = parsed
        }
      } catch {
        // skip invalid JSON
      }
    }

    // Merge: custom options override defaults
    const allOptions: Record<string, { label: string; value: string }[]> = {}
    for (const key of Object.keys(DEFAULT_OPTIONS)) {
      allOptions[key] = overrides[key] && overrides[key].length > 0
        ? overrides[key]
        : DEFAULT_OPTIONS[key]
    }

    return NextResponse.json({
      options: allOptions,
      labels: OPTION_LABELS,
      groups: OPTION_GROUPS,
      defaults: DEFAULT_OPTIONS,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Any authenticated admin may extend option lists (e.g. creating a blog
    // category inline) — this only edits dropdown choices, not site settings.
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { key, options } = body

    if (!key || !key.startsWith('options_') || !Array.isArray(options)) {
      return NextResponse.json({ error: 'Invalid request. Provide key (options_*) and options array.' }, { status: 400 })
    }

    // Validate options structure
    for (const opt of options) {
      if (!opt.label || !opt.value) {
        return NextResponse.json({ error: 'Each option must have label and value.' }, { status: 400 })
      }
    }

    // Upsert the setting
    await db.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(options) },
      create: { key, value: JSON.stringify(options) },
    })

    return NextResponse.json({ success: true, key, options })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to save options' }, { status: 500 })
  }
}

// Reset a specific option key to defaults
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requirePermission('settings', true)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    if (!key || !key.startsWith('options_')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    await db.setting.deleteMany({ where: { key } })

    return NextResponse.json({ success: true, key, resetTo: DEFAULT_OPTIONS[key] || [] })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to reset options' }, { status: 500 })
  }
}