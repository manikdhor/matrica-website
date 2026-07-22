import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'

// Public settings keys that the frontend needs
const PUBLIC_KEYS = [
  'company_name',
  'company_tagline',
  'company_description',
  'company_phone',
  'company_email',
  'company_address',
  'office_hours',
  'contact_address',
  'contact_map_embed',
  'contact_phone_1',
  'contact_phone_2',
  'contact_email_1',
  'contact_email_2',
  'social_facebook',
  'social_instagram',
  'social_youtube',
  'social_linkedin',
  'social_whatsapp',
  'social_twitter',
  'social_tiktok',
  'social_telegram',
  'seo_title',
  'seo_description',
  'seo_og_image',
  'announcement_text',
  'announcement_enabled',
  'announcement_link',
  'stat_plots',
  'stat_years',
  'stat_projects',
  'stat_families',
  'whatsapp_default_message',
  'site_url',
  'footer_about',
  'footer_credit',
  'footer_credit_url',
  'footer_colophon',
  'logo_url',
  'logo_footer',
  'favicon_url',
  'brand_primary',
  'brand_action',
  'brand_gold',
  'theme_background',
  'theme_foreground',
  'theme_accent',
  'theme_accent_fg',
  'theme_gold_light',
  'theme_brand_deep',
  'theme_border',
  'theme_muted',
  'theme_muted_fg',
  'theme_radius',
  'font_heading',
  'font_body',
  'font_mono',
  'font_google_url',
  'anim_enabled',
  'emi_down_payment_pct',
  'emi_max_tenure',
  'emi_min_loan',
  'emi_max_loan',
  'emi_default_rate',
  'emi_default_tenure',
  'sla_hours',
  'privacy_updated',
  'terms_updated',
  'chat_quick_replies',
  'homepage_sections',
  'widget_quickchat_enabled',
  'widget_whatsapp_enabled',
  'widget_loading_screen_enabled',
  'widget_cookie_consent_enabled',
  'widget_back_to_top_enabled',
  'widget_scroll_progress_enabled',
  'widget_lead_popup_enabled',
  'tracking_ga4_id',
  'tracking_gtm_id',
  'tracking_fb_pixel_id',
  'tracking_head_code',
  'tracking_body_code',
] as const

export interface SiteSettings {
  companyName: string
  companyTagline: string
  companyPhone: string
  companyEmail: string
  companyAddress: string
  officeHours: string
  contactAddress: string
  contactMapEmbed: string
  contactPhone1: string
  contactPhone2: string
  contactEmail1: string
  contactEmail2: string
  socialFacebook: string
  socialInstagram: string
  socialYoutube: string
  socialLinkedin: string
  socialWhatsapp: string
  socialTwitter: string
  socialTiktok: string
  socialTelegram: string
  seoTitle: string
  seoDescription: string
  seoOgImage: string
  announcementText: string
  announcementEnabled: boolean
  announcementLink: string
  statPlots: string
  statYears: string
  statProjects: string
  statFamilies: string
  whatsappDefaultMessage: string
  siteUrl: string
  footerAbout: string
  footerCredit: string
  footerCreditUrl: string
  footerColophon: string
  logoUrl: string
  logoFooter: string
  faviconUrl: string
  brandPrimary: string
  brandAction: string
  brandGold: string
  themeBackground: string
  themeForeground: string
  themeAccent: string
  themeAccentFg: string
  themeGoldLight: string
  themeBrandDeep: string
  themeBorder: string
  themeMuted: string
  themeMutedFg: string
  themeRadius: string
  fontHeading: string
  fontBody: string
  fontMono: string
  fontGoogleUrl: string
  animEnabled: boolean
  emiDownPaymentPct: string
  emiMaxTenure: string
  emiMinLoan: string
  emiMaxLoan: string
  emiDefaultRate: string
  emiDefaultTenure: string
  slaHours: string
  privacyUpdated: string
  termsUpdated: string
  chatQuickReplies: string
  homepageSections: string
  widgetQuickchatEnabled: boolean
  widgetWhatsappEnabled: boolean
  widgetLoadingScreenEnabled: boolean
  widgetCookieConsentEnabled: boolean
  widgetBackToTopEnabled: boolean
  widgetScrollProgressEnabled: boolean
  widgetLeadPopupEnabled: boolean
  trackingGa4Id: string
  trackingGtmId: string
  trackingFbPixelId: string
  trackingHeadCode: string
  trackingBodyCode: string
  [key: string]: string | boolean
}

// Canonical homepage section order — must match src/app/page.tsx & use-site-settings.ts
const DEFAULT_HOMEPAGE_SECTIONS_JSON = JSON.stringify([
  { key: 'hero', enabled: true },
  { key: 'featuredProjects', enabled: true },
  { key: 'stats', enabled: true },
  { key: 'whyChooseUs', enabled: true },
  { key: 'howItWorks', enabled: true },
  { key: 'neighborhood', enabled: true },
  { key: 'gallery', enabled: true },
  { key: 'testimonials', enabled: true },
  { key: 'faq', enabled: true },
  { key: 'blog', enabled: true },
  { key: 'cta', enabled: true },
])

const DEFAULTS: Record<string, string> = {
  company_name: 'MATRICA REAL ESTATE LTD',
  company_tagline: 'Premium Land Developer in Purbachal, Dhaka',
  company_phone: '+880 1XXX-XXXXXX',
  company_email: 'info@matrica.com.bd',
  company_address: 'House 45, Road 135, Gulshan-2, Dhaka 1212, Bangladesh',
  office_hours: 'Sat-Thu: 9:00 AM - 6:00 PM, Friday: Closed',
  stat_plots: '',
  stat_years: '',
  stat_projects: '2',
  stat_families: '',
  whatsapp_default_message: 'Hi MATRICA! I am interested in your Purbachal projects. Please share more details.',
  site_url: 'https://matrica.com.bd',
  footer_about: 'is a Dhaka-based land developer building master-planned residential plots in Purbachal — planned in line with RAJUK policy, beside RAJUK Purbachal New Town.',
  footer_credit: 'Design and Developed by YouthFire IT',
  footer_credit_url: 'https://youthfireit.com',
  footer_colophon: 'Purbachal, Dhaka · RAJUK-Approved Developments',
  emi_default_rate: '9.5',
  emi_default_tenure: '5',
  sla_hours: '2',
  privacy_updated: 'July 2025',
  terms_updated: 'July 2025',
  chat_quick_replies: JSON.stringify(['Book a Plot', 'Site Visit', 'Project Details', 'Contact Sales']),
  logo_url: '/images/matrica-logo.webp',
}

// Simple in-memory cache
let cache: Record<string, string> | null = null
let cacheTime = 0
let cachePromise: Promise<SiteSettings> | null = null
const CACHE_TTL = 60_000 // 1 minute

function buildSettings(raw: Record<string, string>): SiteSettings {
  const g = (key: string, fallback = ''): string => raw[key] || fallback
  return {
    companyName: g('company_name', DEFAULTS.company_name),
    companyTagline: g('company_tagline', DEFAULTS.company_tagline),
    companyPhone: g('company_phone', DEFAULTS.company_phone),
    companyEmail: g('company_email', DEFAULTS.company_email),
    companyAddress: g('company_address', DEFAULTS.company_address),
    officeHours: g('office_hours', DEFAULTS.office_hours),
    contactAddress: g('contact_address') || g('company_address', DEFAULTS.company_address),
    contactMapEmbed: g('contact_map_embed'),
    contactPhone1: g('contact_phone_1') || g('company_phone', DEFAULTS.company_phone),
    contactPhone2: g('contact_phone_2'),
    contactEmail1: g('contact_email_1') || g('company_email', DEFAULTS.company_email),
    contactEmail2: g('contact_email_2'),
    socialFacebook: g('social_facebook'),
    socialInstagram: g('social_instagram'),
    socialYoutube: g('social_youtube'),
    socialLinkedin: g('social_linkedin'),
    socialWhatsapp: g('social_whatsapp'),
    socialTwitter: g('social_twitter'),
    socialTiktok: g('social_tiktok'),
    socialTelegram: g('social_telegram'),
    seoTitle: g('seo_title'),
    seoDescription: g('seo_description'),
    seoOgImage: g('seo_og_image'),
    announcementText: g('announcement_text'),
    announcementEnabled: g('announcement_enabled', 'false') === 'true',
    announcementLink: g('announcement_link'),
    statPlots: g('stat_plots', DEFAULTS.stat_plots),
    statYears: g('stat_years', DEFAULTS.stat_years),
    statProjects: g('stat_projects', DEFAULTS.stat_projects),
    statFamilies: g('stat_families', DEFAULTS.stat_families),
    whatsappDefaultMessage: g('whatsapp_default_message', DEFAULTS.whatsapp_default_message),
    siteUrl: g('site_url', DEFAULTS.site_url),
    footerAbout: g('footer_about', DEFAULTS.footer_about),
    footerCredit: g('footer_credit', DEFAULTS.footer_credit),
    footerCreditUrl: g('footer_credit_url', DEFAULTS.footer_credit_url),
    footerColophon: g('footer_colophon', DEFAULTS.footer_colophon),
    logoUrl: g('logo_url', DEFAULTS.logo_url),
    logoFooter: g('logo_footer'),
    faviconUrl: g('favicon_url'),
    brandPrimary: g('brand_primary'),
    brandAction: g('brand_action'),
    brandGold: g('brand_gold'),
    themeBackground: g('theme_background'),
    themeForeground: g('theme_foreground'),
    themeAccent: g('theme_accent'),
    themeAccentFg: g('theme_accent_fg'),
    themeGoldLight: g('theme_gold_light'),
    themeBrandDeep: g('theme_brand_deep'),
    themeBorder: g('theme_border'),
    themeMuted: g('theme_muted'),
    themeMutedFg: g('theme_muted_fg'),
    themeRadius: g('theme_radius'),
    fontHeading: g('font_heading'),
    fontBody: g('font_body'),
    fontMono: g('font_mono'),
    fontGoogleUrl: g('font_google_url'),
    animEnabled: g('anim_enabled', 'true') !== 'false',
    emiDownPaymentPct: g('emi_down_payment_pct', '20'),
    emiMaxTenure: g('emi_max_tenure', '30'),
    emiMinLoan: g('emi_min_loan', '500000'),
    emiMaxLoan: g('emi_max_loan', '100000000'),
    emiDefaultRate: g('emi_default_rate', DEFAULTS.emi_default_rate),
    emiDefaultTenure: g('emi_default_tenure', DEFAULTS.emi_default_tenure),
    slaHours: g('sla_hours', DEFAULTS.sla_hours),
    privacyUpdated: g('privacy_updated', DEFAULTS.privacy_updated),
    termsUpdated: g('terms_updated', DEFAULTS.terms_updated),
    chatQuickReplies: g('chat_quick_replies', DEFAULTS.chat_quick_replies),
    homepageSections: g('homepage_sections', DEFAULT_HOMEPAGE_SECTIONS_JSON),
    widgetQuickchatEnabled: g('widget_quickchat_enabled', 'true') === 'true',
    widgetWhatsappEnabled: g('widget_whatsapp_enabled', 'true') === 'true',
    // Default off — a blocking splash costs ~1.5s of LCP/Speed Index on
    // every first visit; the admin toggle can still turn it on deliberately.
    widgetLoadingScreenEnabled: g('widget_loading_screen_enabled', 'false') === 'true',
    widgetCookieConsentEnabled: g('widget_cookie_consent_enabled', 'true') === 'true',
    widgetBackToTopEnabled: g('widget_back_to_top_enabled', 'true') === 'true',
    widgetScrollProgressEnabled: g('widget_scroll_progress_enabled', 'true') === 'true',
    widgetLeadPopupEnabled: g('widget_lead_popup_enabled', 'true') === 'true',
    trackingGa4Id: g('tracking_ga4_id'),
    trackingGtmId: g('tracking_gtm_id'),
    trackingFbPixelId: g('tracking_fb_pixel_id'),
    trackingHeadCode: g('tracking_head_code'),
    trackingBodyCode: g('tracking_body_code'),
  }
}

/**
 * Server-side utility — call from Server Components or API routes.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return buildSettings(cache)
  }
  if (cachePromise) {
    return cachePromise
  }
  try {
    cachePromise = (async () => {
      const rows = await db.setting.findMany({
        where: { key: { in: [...PUBLIC_KEYS] } },
        select: { key: true, value: true },
      })
      cache = Object.fromEntries(rows.map(r => [r.key, r.value ?? '']))
      cacheTime = Date.now()
      return buildSettings(cache)
    })()
    return await cachePromise
  } catch {
    // Negative-cache the failure — without this every request past the TTL
    // re-pays the full DB connect timeout when the database is unreachable.
    cache = {}
    cacheTime = now - CACHE_TTL + 15_000 // retry the DB in 15s, not 60s
    return buildSettings({})
  } finally {
    cachePromise = null
  }
}

/**
 * Server-side raw key-value map (for email/whatsapp/AI templates).
 */
export async function getRawSettings(): Promise<Record<string, string>> {
  const now = Date.now()
  if (cache && now - cacheTime < CACHE_TTL && cacheValidSince(cacheTime)) {
    return { ...cache }
  }
  try {
    const rows = await db.setting.findMany({
      where: { key: { in: [...PUBLIC_KEYS] } },
      select: { key: true, value: true },
    })
    cache = Object.fromEntries(rows.map(r => [r.key, r.value ?? '']))
    cacheTime = now
    return { ...cache }
  } catch {
    cache = {}
    cacheTime = now - CACHE_TTL + 15_000
    return {}
  }
}

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}