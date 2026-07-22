'use client'
import { useState, useEffect, useCallback } from 'react'
import { Settings, Save, Building2, Phone, Mail, MapPin, Globe, Bell, FileText, BarChart3, Share2, Search, UserCog, Eye, EyeOff, Loader2, Sparkles, MessageSquare, Server, ListFilter, LayoutList, Puzzle, ArrowUp, ArrowDown, GripVertical, Bot, PanelBottom, Percent, Scale, SlidersHorizontal, MessageCircle, Palette, LineChart } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { useDragReorder, arrayMove } from '@/hooks/useDragReorder'
import FieldOptionsEditor from '@/components/FieldOptionsEditor'
import MediaUploadInput from '@/components/MediaUploadInput'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })
import { parseHomepageSections, type HomepageSectionConfig } from '@/lib/use-site-settings'

interface Section {
  key: string
  title: string
  icon: React.ReactNode
  fields?: { key: string; label: string; placeholder?: string; type?: 'text' | 'textarea' | 'richtext' | 'media' | 'code'; hint?: string }[]
  custom?: boolean
}

/** Parse the chat_quick_replies setting (a JSON string array) into a string[]. */
function parseQuickReplies(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((r) => String(r)) : []
  } catch {
    return []
  }
}

/** Friendly labels for homepage section keys (render order managed via homepage_sections setting) */
const HOMEPAGE_SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  featuredProjects: 'Featured Projects',
  stats: 'Stats (The Numbers)',
  whyChooseUs: 'Why Choose Us',
  howItWorks: 'How It Works',
  neighborhood: 'Neighborhood Guide',
  gallery: 'Gallery Preview',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  blog: 'Latest Blog Posts',
  cta: 'Call to Action',
}

/** Widget toggles default to enabled — seeded so they render as checkboxes even before first save */
const WIDGET_DEFAULTS: Record<string, string> = {
  widget_quickchat_enabled: 'true',
  widget_whatsapp_enabled: 'true',
  widget_loading_screen_enabled: 'true',
  widget_cookie_consent_enabled: 'true',
  widget_back_to_top_enabled: 'true',
  widget_scroll_progress_enabled: 'true',
}

/** Hardcoded provider list — mirrors AI_PROVIDERS in src/lib/ai.ts (server-only module, can't import here) */
const AI_PROVIDER_OPTIONS: { value: string; label: string; baseUrl: string; models: string[] }[] = [
  { value: 'openai', label: 'OpenAI (ChatGPT)', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o4-mini'] },
  { value: 'anthropic', label: 'Anthropic (Claude)', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-sonnet-5', 'claude-haiku-4-5-20251001', 'claude-opus-4-8'] },
  { value: 'gemini', label: 'Google (Gemini)', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'] },
  { value: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { value: 'xai', label: 'xAI (Grok)', baseUrl: 'https://api.x.ai/v1', models: ['grok-3-mini', 'grok-3', 'grok-4'] },
  { value: 'zai', label: 'Z.AI (GLM)', baseUrl: 'https://api.z.ai/api/paas/v4', models: ['glm-4.5-air', 'glm-4.5', 'glm-4.6'] },
  { value: 'perplexity', label: 'Perplexity', baseUrl: 'https://api.perplexity.ai', models: ['sonar', 'sonar-pro'] },
  { value: 'openrouter', label: 'OpenRouter (any model)', baseUrl: 'https://openrouter.ai/api/v1', models: ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-5', 'google/gemini-2.5-flash', 'deepseek/deepseek-chat'] },
  { value: 'custom', label: 'Custom (OpenAI-compatible)', baseUrl: '', models: [] },
  { value: 'zai-sdk', label: 'Legacy built-in (z-ai-web-dev-sdk)', baseUrl: '', models: ['gpt-4o-mini'] },
]

const sections: Section[] = [
  {
    key: 'profile',
    title: 'Profile & Security',
    icon: <UserCog className="w-5 h-5 text-slate-400" />,
    custom: true,
  },
  {
    key: 'company',
    title: 'Company Information',
    icon: <Building2 className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'company_name', label: 'Company Name', placeholder: 'MATRICA REAL ESTATE LTD' },
      { key: 'company_tagline', label: 'Tagline', placeholder: 'Premium Land Developer in Dhaka' },
      { key: 'company_description', label: 'Description', type: 'textarea', placeholder: 'Company description for SEO...' },
      { key: 'company_phone', label: 'Phone', placeholder: '+880 1234-567890' },
      { key: 'company_email', label: 'Email', placeholder: 'info@matrica.com.bd' },
      { key: 'company_address', label: 'Office Address', placeholder: 'House 45, Road 135, Gulshan-2, Dhaka 1212' },
      { key: 'office_hours', label: 'Office Hours', placeholder: 'Sat-Thu 9AM-6PM, Friday Closed' },
    ],
  },
  {
    key: 'branding',
    title: 'Branding',
    icon: <Palette className="w-5 h-5 text-slate-400" />,
    custom: true,
  },
  {
    key: 'social',
    title: 'Social Media Links',
    icon: <Share2 className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'social_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
      { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
      { key: 'social_youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/...' },
      { key: 'social_linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/...' },
      { key: 'social_twitter', label: 'X / Twitter URL', placeholder: 'https://x.com/...' },
      { key: 'social_tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@...' },
      { key: 'social_telegram', label: 'Telegram URL', placeholder: 'https://t.me/...' },
      { key: 'social_whatsapp', label: 'WhatsApp Number', placeholder: '+8801234567890' },
    ],
  },
  {
    key: 'announcement',
    title: 'Announcement Bar',
    icon: <Bell className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'announcement_text', label: 'Announcement Text', placeholder: 'Special offer: Get up to 10% early-bird discount!' },
      { key: 'announcement_enabled', label: 'Enabled', placeholder: 'true' },
      { key: 'announcement_link', label: 'Link URL (optional)', placeholder: '/contact' },
    ],
  },
  {
    key: 'contact',
    title: 'Contact Page',
    icon: <Phone className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'contact_address', label: 'Address', placeholder: 'Full office address' },
      { key: 'contact_map_embed', label: 'Google Map Embed URL', placeholder: 'https://www.google.com/maps/embed?...' },
      { key: 'contact_phone_1', label: 'Phone 1', placeholder: '+880 1234-567890' },
      { key: 'contact_phone_2', label: 'Phone 2', placeholder: '+880 9876-543210' },
      { key: 'contact_email_1', label: 'Email 1', placeholder: 'info@matrica.com.bd' },
      { key: 'contact_email_2', label: 'Email 2', placeholder: 'sales@matrica.com.bd' },
    ],
  },
  {
    key: 'seo',
    title: 'SEO Settings',
    icon: <Search className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'seo_title', label: 'Meta Title', placeholder: 'MATRICA REAL ESTATE LTD | Premium Land Developer in Dhaka' },
      { key: 'seo_description', label: 'Meta Description', type: 'textarea', placeholder: 'Discover premium residential plots in Purbachal...' },
      { key: 'seo_og_image', label: 'OG Image URL', placeholder: '/images/hero-bg.webp', type: 'media', hint: 'Recommended 1200×630 px (1.91:1). Social / link-share preview image. JPG or PNG, under 1 MB.' },
    ],
  },
  {
    key: 'tracking',
    title: 'Tracking & Scripts',
    icon: <LineChart className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'tracking_ga4_id', label: 'Google Analytics 4 — Measurement ID', placeholder: 'G-XXXXXXXXXX', hint: 'From GA4 → Admin → Data Streams. Loads gtag.js automatically after page load.' },
      { key: 'tracking_gtm_id', label: 'Google Tag Manager — Container ID', placeholder: 'GTM-XXXXXXX', hint: 'From GTM → container header. Injects the GTM snippet + no-JS fallback.' },
      { key: 'tracking_fb_pixel_id', label: 'Meta (Facebook) Pixel ID', placeholder: '1234567890', hint: 'From Meta Events Manager. Fires PageView on load and on every route change.' },
      { key: 'tracking_head_code', label: 'Custom <head> Code', type: 'code', placeholder: '<!-- site-verification, other pixels, inline scripts -->', hint: 'Raw HTML/JS injected into the document head on public pages. <script> tags execute. Paste vendor snippets exactly.' },
      { key: 'tracking_body_code', label: 'Custom Body Code (before </body>)', type: 'code', placeholder: '<!-- chat widgets, remarketing tags -->', hint: 'Raw HTML/JS injected at the end of the body on public pages. Never runs inside the admin panel.' },
    ],
  },
  {
    key: 'stats',
    title: 'Stats Section Values',
    icon: <BarChart3 className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'stat_years', label: 'Bigha Under Development', placeholder: '500+' },
      { key: 'stat_projects', label: 'Master-Planned Projects', placeholder: '2' },
      { key: 'stat_families', label: 'RAJUK-Approved Plots', placeholder: '100%' },
      { key: 'stat_plots', label: 'Wide Internal Roads', placeholder: '40 ft' },
    ],
  },
  {
    key: 'footer',
    title: 'Footer',
    icon: <PanelBottom className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'footer_about', label: 'About Text', type: 'richtext', placeholder: 'Short description shown in the footer...' },
      { key: 'footer_credit', label: 'Credit Text', placeholder: 'Developed by ...' },
      { key: 'footer_credit_url', label: 'Credit Link URL', placeholder: 'https://...' },
      { key: 'footer_colophon', label: 'Colophon / Copyright Line', placeholder: '© 2026 MATRICA REAL ESTATE LTD. All rights reserved.' },
    ],
  },
  {
    key: 'finance',
    title: 'Finance & EMI',
    icon: <Percent className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'emi_default_rate', label: 'Default EMI Interest Rate (%)', placeholder: '12' },
      { key: 'emi_default_tenure', label: 'Default EMI Tenure (months)', placeholder: '36' },
      { key: 'sla_hours', label: 'Response SLA (hours)', placeholder: '24' },
    ],
  },
  {
    key: 'legal',
    title: 'Legal Dates',
    icon: <Scale className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'privacy_updated', label: 'Privacy Policy — Last Updated', placeholder: 'e.g. July 2026 or 2026-07-01' },
      { key: 'terms_updated', label: 'Terms & Conditions — Last Updated', placeholder: 'e.g. July 2026 or 2026-07-01' },
    ],
  },
  {
    key: 'misc',
    title: 'Misc',
    icon: <SlidersHorizontal className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'site_url', label: 'Site URL', placeholder: 'https://matrica.com.bd' },
      { key: 'whatsapp_default_message', label: 'WhatsApp Default Message', type: 'textarea', placeholder: 'Hi! I’m interested in your projects...' },
    ],
  },
  {
    key: 'chat',
    title: 'Chat Quick Replies',
    icon: <MessageCircle className="w-5 h-5 text-slate-400" />,
    custom: true,
  },
  {
    key: 'homepage',
    title: 'Homepage Sections',
    icon: <LayoutList className="w-5 h-5 text-slate-400" />,
    custom: true,
  },
  {
    key: 'widgets',
    title: 'Widgets',
    icon: <Puzzle className="w-5 h-5 text-slate-400" />,
    fields: [
      { key: 'widget_quickchat_enabled', label: 'AI Chat Widget (Quick Chat)', placeholder: 'true' },
      { key: 'widget_whatsapp_enabled', label: 'WhatsApp Chat Button', placeholder: 'true' },
      { key: 'widget_loading_screen_enabled', label: 'Loading Screen', placeholder: 'true' },
      { key: 'widget_cookie_consent_enabled', label: 'Cookie Consent Banner', placeholder: 'true' },
      { key: 'widget_back_to_top_enabled', label: 'Back to Top Button', placeholder: 'true' },
      { key: 'widget_scroll_progress_enabled', label: 'Scroll Progress Bar', placeholder: 'true' },
      { key: 'widget_lead_popup_enabled', label: 'Lead Capture Popup', placeholder: 'true' },
    ],
  },
  {
    key: 'email',
    title: 'Email (SMTP)',
    icon: <Mail className="w-5 h-5 text-slate-400" />,
    custom: true,
  },
  {
    key: 'whatsapp',
    title: 'WhatsApp Business',
    icon: <MessageSquare className="w-5 h-5 text-slate-400" />,
    custom: true,
  },
  {
    key: 'ai',
    title: 'AI Configuration',
    icon: <Bot className="w-5 h-5 text-slate-400" />,
    custom: true,
  },
  {
    key: 'field_options',
    title: 'Field Options',
    icon: <ListFilter className="w-5 h-5 text-slate-400" />,
    custom: true,
  },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({ ...WIDGET_DEFAULTS })
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  // Profile & Security state
  const [adminUser, setAdminUser] = useState<{ name: string; role: string } | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingWhatsApp, setTestingWhatsApp] = useState(false)
  const [testingAi, setTestingAi] = useState(false)
  const [showAiKey, setShowAiKey] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => setSettings(prev => ({ ...prev, ...(d || {}) }))).catch(() => {})
  }, [])

  const fetchAdminUser = useCallback(() => {
    fetch('/api/admin/auth')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated && d.user) {
          setAdminUser({ name: d.user.name, role: d.user.role })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchAdminUser()
  }, [fetchAdminUser])

  const update = (key: string, value: string) => setSettings({ ...settings, [key]: value })

  // Homepage sections — stored as a JSON string in the `homepage_sections` setting
  const homepageSections = parseHomepageSections(settings.homepage_sections)
  const setHomepageSections = (next: HomepageSectionConfig[]) =>
    update('homepage_sections', JSON.stringify(next))
  const moveHomepageSection = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= homepageSections.length) return
    const next = [...homepageSections]
    ;[next[index], next[target]] = [next[target], next[index]]
    setHomepageSections(next)
  }
  // Drag-and-drop reorder — local state only; persisted via "Save All Settings"
  const handleDragReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    setHomepageSections(arrayMove(homepageSections, fromIdx, toIdx))
  }
  const dnd = useDragReorder(handleDragReorder)

  const toggleHomepageSection = (index: number) => {
    setHomepageSections(
      homepageSections.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      const data = await res.json()
      if (data.success) toast.success('Settings saved')
      else toast.error('Failed')
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error('Please enter your current password')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
      } else {
        toast.error(data.error || 'Failed to change password')
      }
    } catch {
      toast.error('Failed to change password')
    }
    setChangingPassword(false)
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    try {
      const res = await fetch('/api/admin/settings/test-email', { method: 'POST' })
      const data = await res.json()
      if (data.success) toast.success('Test email sent! Check your inbox.')
      else toast.error(data.error || 'Failed to send test email')
    } catch { toast.error('Test email failed') }
    setTestingEmail(false)
  }

  const handleTestAi = async () => {
    setTestingAi(true)
    try {
      const res = await fetch('/api/admin/settings/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.ai_provider || 'zai-sdk',
          model: settings.ai_model || '',
          apiKey: settings.ai_api_key || '',
          baseUrl: settings.ai_base_url || '',
          temperature: settings.ai_temperature || '',
          maxTokens: settings.ai_max_tokens || '',
        }),
      })
      const data = await res.json()
      if (data.ok) toast.success(`AI connection working${data.reply ? ` — reply: "${data.reply}"` : ''}`)
      else toast.error(data.error || 'AI connection failed')
    } catch { toast.error('AI connection test failed') }
    setTestingAi(false)
  }

  const handleTestWhatsApp = async () => {
    setTestingWhatsApp(true)
    try {
      const res = await fetch('/api/admin/settings/test-whatsapp', { method: 'POST' })
      const data = await res.json()
      if (data.success) toast.success('Test WhatsApp sent!')
      else toast.error(data.error || 'Failed to send test WhatsApp')
    } catch { toast.error('Test WhatsApp failed') }
    setTestingWhatsApp(false)
  }

  const selectedAiProvider =
    AI_PROVIDER_OPTIONS.find((p) => p.value === (settings.ai_provider || 'zai-sdk')) ||
    AI_PROVIDER_OPTIONS[AI_PROVIDER_OPTIONS.length - 1]

  const passwordStrengthColor = newPassword.length === 0
    ? 'text-slate-500'
    : newPassword.length < 8
      ? 'text-red-400'
      : newPassword.length < 12
        ? 'text-yellow-400'
        : 'text-[#34D399]'

  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <button onClick={saveAll} disabled={saving} className="btn-admin btn-admin-primary text-sm">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        {/* Section Nav */}
        <div className="admin-card p-2 space-y-0.5 h-fit lg:sticky lg:top-20">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                activeSection === s.key
                  ? 'bg-[#1E6B3A]/15 text-[#34D399] border border-[#1E6B3A]/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {s.icon}
              {s.title}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="space-y-4">
          {activeSection === 'profile' && (
            <div className="admin-card p-6">
              <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-slate-400" /> Profile & Security
              </h3>

              {/* Admin Info Card */}
              <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20">
                <div className="w-12 h-12 rounded-full bg-[#1E6B3A]/30 flex items-center justify-center text-[#34D399] font-bold text-lg">
                  {adminUser?.name?.charAt(0)?.toUpperCase() || <UserCog className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-white font-medium">{adminUser?.name || 'Loading...'}</p>
                  <p className="text-xs text-slate-400 capitalize">{adminUser?.role || ''}</p>
                </div>
              </div>

              {/* Change Password Form */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Change Password</h4>
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      className="admin-input pr-10"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    New Password
                    <span className={`ml-2 text-[10px] ${passwordStrengthColor}`}>
                      {newPassword.length === 0 ? '' : newPassword.length < 8 ? '(min 8 characters)' : newPassword.length < 12 ? '(good)' : '(strong)'}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      className="admin-input pr-10"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Confirm New Password
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <span className="ml-2 text-[10px] text-red-400">(does not match)</span>
                    )}
                    {passwordsMatch && (
                      <span className="ml-2 text-[10px] text-[#34D399]">(matches)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      className="admin-input pr-10"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                  <p className="text-[11px] text-slate-500 font-medium mb-2">Requirements:</p>
                  <ul className="space-y-1">
                    <li className={`text-[11px] flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-[#34D399]' : 'text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-[#34D399]' : 'bg-slate-600'}`} />
                      Minimum 8 characters
                    </li>
                    <li className={`text-[11px] flex items-center gap-1.5 ${passwordsMatch ? 'text-[#34D399]' : 'text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-[#34D399]' : 'bg-slate-600'}`} />
                      New passwords must match
                    </li>
                  </ul>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="btn-admin btn-admin-primary text-sm w-fit"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'branding' && (
            <div className="admin-card p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-slate-400" /> Branding
              </h3>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  Upload your logos and favicon, and set brand colors. Leave a color empty to fall back to the built-in theme default. Click &quot;Save All Settings&quot; to apply.
                </p>
              </div>

              {/* Logos & favicon */}
              <div className="space-y-4">
                {[
                  { key: 'logo_url', label: 'Logo (Header)', placeholder: '/images/logo.png', hint: 'Recommended ~240×80 px, transparent PNG (SVG best). Displayed ~36 px tall.' },
                  { key: 'logo_footer', label: 'Logo (Footer)', placeholder: '/images/logo-footer.png', hint: 'Recommended ~240×80 px, transparent PNG (SVG best). Light version for dark footer.' },
                  { key: 'favicon_url', label: 'Favicon', placeholder: '/favicon.ico', hint: 'Square. 512×512 px PNG, or 32×32 px .ico. Browser-tab icon.' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-slate-400 mb-1.5">{f.label}</label>
                    <MediaUploadInput
                      value={settings[f.key] || ''}
                      onChange={(url) => update(f.key, url)}
                      placeholder={f.placeholder}
                      hint={f.hint}
                    />
                  </div>
                ))}
              </div>

              {/* Brand colors */}
              <div className="space-y-4 pt-2 border-t border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Brand Colors</h4>
                {[
                  { key: 'brand_primary', label: 'Primary', fallback: '#1E6B3A' },
                  { key: 'brand_action', label: 'Action / Accent', fallback: '#34D399' },
                  { key: 'brand_gold', label: 'Gold', fallback: '#A98B4F' },
                ].map((c) => {
                  const val = settings[c.key] || ''
                  const swatch = /^#[0-9a-fA-F]{6}$/.test(val) ? val : c.fallback
                  return (
                    <div key={c.key}>
                      <label className="block text-xs text-slate-400 mb-1.5">{c.label}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          aria-label={`${c.label} color picker`}
                          value={swatch}
                          onChange={(e) => update(c.key, e.target.value)}
                          className="h-10 w-14 shrink-0 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 p-1"
                        />
                        <input
                          className="admin-input"
                          type="text"
                          placeholder={`${c.fallback} — empty = theme default`}
                          value={val}
                          onChange={(e) => update(c.key, e.target.value)}
                        />
                      </div>
                    </div>
                  )
                })}
                <p className="text-[11px] text-slate-500">Leave a field empty to use the built-in theme default color.</p>
              </div>
            </div>
          )}

          {activeSection === 'email' && (
            <div className="admin-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-slate-400" /> Email (SMTP) Configuration
                </h3>
                <button onClick={handleTestEmail} disabled={testingEmail} className="btn-admin btn-admin-secondary text-xs">
                  {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {testingEmail ? ' Sending...' : ' Send Test'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  Configure your SMTP server to send welcome emails to leads. Save settings first, then test.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">SMTP Host</label>
                  <input className="admin-input" placeholder="smtp.gmail.com" value={settings.smtp_host || ''} onChange={(e) => update('smtp_host', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">SMTP Port</label>
                  <input className="admin-input" placeholder="587" value={settings.smtp_port || ''} onChange={(e) => update('smtp_port', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">SMTP User (Email)</label>
                  <input className="admin-input" placeholder="noreply@matrica.com.bd" value={settings.smtp_user || ''} onChange={(e) => update('smtp_user', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">SMTP Password</label>
                  <input className="admin-input" type="password" placeholder="••••••••" value={settings.smtp_pass || ''} onChange={(e) => update('smtp_pass', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">From Name</label>
                  <input className="admin-input" placeholder="MATRICA REAL ESTATE LTD" value={settings.smtp_from_name || ''} onChange={(e) => update('smtp_from_name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">From Email</label>
                  <input className="admin-input" placeholder="info@matrica.com.bd" value={settings.smtp_from_email || ''} onChange={(e) => update('smtp_from_email', e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smtp_secure === 'true'}
                    onChange={(e) => update('smtp_secure', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-[#1E6B3A] focus:ring-[#1E6B3A] focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-300">Use SSL/TLS (secure connection)</span>
                </label>
              </div>
            </div>
          )}

          {activeSection === 'whatsapp' && (
            <div className="admin-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-400" /> WhatsApp Business API
                </h3>
                <button onClick={handleTestWhatsApp} disabled={testingWhatsApp} className="btn-admin btn-admin-secondary text-xs">
                  {testingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  {testingWhatsApp ? ' Sending...' : ' Send Test'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  Configure WhatsApp Business API to auto-send welcome messages to leads. Supports Meta Cloud API and Twilio. If not configured, messages are logged in mock mode.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Provider</label>
                  <select
                    className="admin-input"
                    value={settings.wa_provider || 'mock'}
                    onChange={(e) => update('wa_provider', e.target.value)}
                  >
                    <option value="mock">Mock (Log Only — No API Calls)</option>
                    <option value="meta">Meta WhatsApp Cloud API</option>
                    <option value="twilio">Twilio WhatsApp API</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">API Token / Auth</label>
                    <input className="admin-input" type="password" placeholder="Bearer token or SID:AuthToken" value={settings.wa_api_token || ''} onChange={(e) => update('wa_api_token', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Phone Number ID</label>
                    <input className="admin-input" placeholder="Meta: Phone Number ID / Twilio: From number" value={settings.wa_phone_number_id || ''} onChange={(e) => update('wa_phone_number_id', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Base URL (optional)</label>
                  <input className="admin-input" placeholder="https://graph.facebook.com/v18.0" value={settings.wa_base_url || ''} onChange={(e) => update('wa_base_url', e.target.value)} />
                  <p className="text-[11px] text-slate-500 mt-1">Default: Meta = graph.facebook.com/v18.0, Twilio = api.twilio.com</p>
                </div>
              </div>

              {settings.wa_provider === 'mock' && (
                <div className="p-3 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#34D399]" />
                  <p className="text-xs text-slate-300">
                    Mock mode is active. Messages will be saved to the database with status &quot;sent&quot; but no actual WhatsApp messages will be sent. Configure a provider above to enable real delivery.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <p className="text-[11px] text-slate-500 font-medium mb-2">For advanced template management:</p>
                <Link href="/admin/whatsapp" className="text-xs text-[#34D399] hover:underline">
                  Go to WhatsApp Templates & Messages Manager →
                </Link>
              </div>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="admin-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-slate-400" /> AI Configuration
                </h3>
                <button onClick={handleTestAi} disabled={testingAi} className="btn-admin btn-admin-secondary text-xs">
                  {testingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                  {testingAi ? ' Testing...' : ' Test AI Connection'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  Choose which AI provider powers lead scoring, insights, content writing and the admin chat. The test button uses the values in this form (no save needed), but click &quot;Save All Settings&quot; to apply them everywhere.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Provider</label>
                  <select
                    className="admin-input"
                    value={settings.ai_provider || 'zai-sdk'}
                    onChange={(e) => update('ai_provider', e.target.value)}
                  >
                    {AI_PROVIDER_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Model</label>
                    <input
                      className="admin-input"
                      list="ai-model-suggestions"
                      placeholder={selectedAiProvider.models[0] || 'model-name'}
                      value={settings.ai_model || ''}
                      onChange={(e) => update('ai_model', e.target.value)}
                    />
                    <datalist id="ai-model-suggestions">
                      {selectedAiProvider.models.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                    <p className="text-[11px] text-slate-500 mt-1">Leave empty to use the provider default{selectedAiProvider.models[0] ? ` (${selectedAiProvider.models[0]})` : ''}.</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">API Key</label>
                    <div className="relative">
                      <input
                        className="admin-input pr-10"
                        type={showAiKey ? 'text' : 'password'}
                        placeholder="sk-..."
                        value={settings.ai_api_key || ''}
                        onChange={(e) => update('ai_api_key', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAiKey(!showAiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Not required for the legacy built-in provider.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Base URL Override (optional)</label>
                  <input
                    className="admin-input"
                    placeholder={selectedAiProvider.baseUrl || 'https://your-server.example.com/v1'}
                    value={settings.ai_base_url || ''}
                    onChange={(e) => update('ai_base_url', e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedAiProvider.value === 'custom'
                      ? 'Required for Custom — any OpenAI-compatible /chat/completions endpoint.'
                      : 'Leave empty to use the provider default shown above.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Temperature (0–2)</label>
                    <input
                      className="admin-input"
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      placeholder="0.7"
                      value={settings.ai_temperature || ''}
                      onChange={(e) => update('ai_temperature', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Max Tokens</label>
                    <input
                      className="admin-input"
                      type="number"
                      min={1}
                      placeholder="1024"
                      value={settings.ai_max_tokens || ''}
                      onChange={(e) => update('ai_max_tokens', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {(settings.ai_provider || 'zai-sdk') === 'zai-sdk' && (
                <div className="p-3 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#34D399]" />
                  <p className="text-xs text-slate-300">
                    Legacy built-in provider is active — AI features use the bundled z-ai-web-dev-sdk. Select a provider above and add an API key to switch.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'field_options' && (
            <FieldOptionsEditor />
          )}

          {activeSection === 'chat' && (
            <div className="admin-card p-6">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-slate-400" /> Chat Quick Replies
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                One quick-reply per line. These appear as tappable suggestions in the site chat widget. Changes apply after clicking &quot;Save All Settings&quot;.
              </p>
              <textarea
                className="admin-input min-h-[180px] resize-y"
                placeholder={'I want to book a site visit\nWhat are your payment plans?\nShow me available plots'}
                value={parseQuickReplies(settings.chat_quick_replies).join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean)
                  update('chat_quick_replies', JSON.stringify(lines))
                }}
              />
              <p className="mt-2 text-[11px] text-slate-600">
                Stored as a JSON array. {parseQuickReplies(settings.chat_quick_replies).length} quick {parseQuickReplies(settings.chat_quick_replies).length === 1 ? 'reply' : 'replies'}.
              </p>
            </div>
          )}

          {activeSection === 'homepage' && (
            <div className="admin-card p-6">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <LayoutList className="w-5 h-5 text-slate-400" /> Homepage Sections
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Drag sections to reorder (or use the arrows) and toggle their visibility. Changes apply after clicking &quot;Save All Settings&quot;.
              </p>
              <div className="space-y-2">
                {homepageSections.map((section, index) => {
                  const label = HOMEPAGE_SECTION_LABELS[section.key] || section.key
                  const edge = dnd.dropEdge(index)
                  return (
                    <div
                      key={section.key}
                      {...dnd.itemProps(index)}
                      className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border ${
                        edge === 'above'
                          ? 'border-t-[#A98B4F] border-t-2 border-slate-700/50'
                          : edge === 'below'
                            ? 'border-b-[#A98B4F] border-b-2 border-slate-700/50'
                            : 'border-slate-700/50'
                      } ${dnd.isDragging(index) ? 'opacity-40' : ''}`}
                    >
                      <span
                        {...dnd.handleProps}
                        className="p-1 rounded text-slate-500 cursor-grab active:cursor-grabbing hover:text-white hover:bg-slate-700 transition-colors"
                        title="Drag to reorder"
                        aria-hidden="true"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => moveHomepageSection(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move ${label} up`}
                          className="text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveHomepageSection(index, 1)}
                          disabled={index === homepageSections.length - 1}
                          aria-label={`Move ${label} down`}
                          className="text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-600 w-5 text-right tabular-nums">{index + 1}.</span>
                      <span className={`flex-1 text-sm ${section.enabled ? 'text-white' : 'text-slate-500 line-through'}`}>
                        {label}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => toggleHomepageSection(index)}
                          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-[#1E6B3A] focus:ring-[#1E6B3A] focus:ring-offset-0"
                        />
                        <span className="text-xs text-slate-400 w-14">{section.enabled ? 'Visible' : 'Hidden'}</span>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {sections.filter((s) => !s.custom && s.key === activeSection).map((section) => (
            <div key={section.key} className="admin-card p-6">
              <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                {section.icon} {section.title}
              </h3>
              <div className="space-y-4">
                {section.fields!.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-slate-400 mb-1.5">{field.label}</label>
                    {['true', 'false'].includes(String(settings[field.key])) ? (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[field.key] === 'true'}
                          onChange={(e) => update(field.key, e.target.checked ? 'true' : 'false')}
                          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-[#1E6B3A] focus:ring-[#1E6B3A] focus:ring-offset-0"
                        />
                        <span className="text-sm text-slate-300">{settings[field.key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ) : field.type === 'media' ? (
                      <MediaUploadInput
                        value={settings[field.key] || ''}
                        onChange={(url) => update(field.key, url)}
                        placeholder={field.placeholder}
                        hint={field.hint}
                      />
                    ) : field.type === 'richtext' ? (
                      <RichTextEditor
                        value={settings[field.key] || ''}
                        onChange={(html) => update(field.key, html)}
                        placeholder={field.placeholder}
                        minHeight="160px"
                      />
                    ) : field.type === 'code' ? (
                      <textarea
                        className="admin-input min-h-[130px] resize-y font-mono text-xs leading-relaxed"
                        spellCheck={false}
                        placeholder={field.placeholder}
                        value={settings[field.key] || ''}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="admin-input min-h-[80px] resize-y"
                        placeholder={field.placeholder}
                        value={settings[field.key] || ''}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                    ) : (
                      <input
                        className="admin-input"
                        type="text"
                        placeholder={field.placeholder}
                        value={settings[field.key] || ''}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                    )}
                    {field.hint && field.type !== 'media' && (
                      <p className="mt-1.5 text-[11px] leading-snug text-slate-500">{field.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}