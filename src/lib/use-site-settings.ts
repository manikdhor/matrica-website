'use client'

import { useState, useEffect } from 'react'
import type { SiteSettings } from '@/app/api/site-settings/route'

export interface HomepageSectionConfig {
  key: string
  enabled: boolean
}

/** Canonical homepage sections in default render order — must match src/app/page.tsx */
export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
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
]

/**
 * Parse the `homepage_sections` JSON setting.
 * Falls back to the canonical default order on any malformed input,
 * and appends any canonical sections missing from a saved config.
 */
export function parseHomepageSections(raw: string | undefined | null): HomepageSectionConfig[] {
  try {
    if (!raw) return DEFAULT_HOMEPAGE_SECTIONS
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_HOMEPAGE_SECTIONS
    const items = parsed.filter(
      (s): s is HomepageSectionConfig =>
        !!s && typeof s === 'object' &&
        typeof (s as HomepageSectionConfig).key === 'string' &&
        typeof (s as HomepageSectionConfig).enabled === 'boolean'
    )
    if (items.length === 0) return DEFAULT_HOMEPAGE_SECTIONS
    // Append canonical sections missing from the saved config (e.g. added later)
    const present = new Set(items.map(s => s.key))
    for (const def of DEFAULT_HOMEPAGE_SECTIONS) {
      if (!present.has(def.key)) items.push({ ...def })
    }
    return items
  } catch {
    return DEFAULT_HOMEPAGE_SECTIONS
  }
}

const DEFAULTS: SiteSettings = {
  companyName: 'MATRICA REAL ESTATE LTD',
  companyTagline: 'Premium Land Developer in Purbachal, Dhaka',
  companyPhone: '+880 1XXX-XXXXXX',
  companyEmail: 'info@matrica.com.bd',
  companyAddress: 'House 45, Road 135, Gulshan-2, Dhaka 1212, Bangladesh',
  officeHours: 'Sat-Thu: 9:00 AM - 6:00 PM, Friday: Closed',
  contactAddress: 'House 45, Road 135, Gulshan-2, Dhaka 1212, Bangladesh',
  contactMapEmbed: '',
  contactPhone1: '+880 1XXX-XXXXXX',
  contactPhone2: '',
  contactEmail1: 'info@matrica.com.bd',
  contactEmail2: '',
  socialFacebook: '',
  socialInstagram: '',
  socialYoutube: '',
  socialLinkedin: '',
  socialWhatsapp: '',
  socialTwitter: '',
  socialTiktok: '',
  socialTelegram: '',
  seoTitle: '',
  seoDescription: '',
  seoOgImage: '',
  announcementText: '',
  announcementEnabled: false,
  announcementLink: '',
  statPlots: '',
  statYears: '',
  statProjects: '2',
  statFamilies: '',
  whatsappDefaultMessage: 'Hi MATRICA! I am interested in your Purbachal projects. Please share more details.',
  siteUrl: 'https://matrica.com.bd',
  footerAbout: 'is a Dhaka-based land developer building master-planned residential plots in Purbachal — planned in line with RAJUK policy, beside RAJUK Purbachal New Town.',
  footerCredit: 'Design and Developed by YouthFire IT',
  footerCreditUrl: 'https://youthfireit.com',
  footerColophon: 'Purbachal, Dhaka · RAJUK-Approved Developments',
  logoUrl: '/images/matrica-logo.webp',
  logoFooter: '',
  faviconUrl: '',
  brandPrimary: '',
  brandAction: '',
  brandGold: '',
  themeBackground: '',
  themeForeground: '',
  themeAccent: '',
  themeAccentFg: '',
  themeGoldLight: '',
  themeBrandDeep: '',
  themeBorder: '',
  themeMuted: '',
  themeMutedFg: '',
  themeRadius: '',
  fontHeading: '',
  fontBody: '',
  fontMono: '',
  fontGoogleUrl: '',
  animEnabled: true,
  emiDownPaymentPct: '20',
  emiMaxTenure: '30',
  emiMinLoan: '500000',
  emiMaxLoan: '100000000',
  emiDefaultRate: '9.5',
  emiDefaultTenure: '5',
  slaHours: '2',
  privacyUpdated: 'July 2025',
  termsUpdated: 'July 2025',
  chatQuickReplies: JSON.stringify(['Book a Plot', 'Site Visit', 'Project Details', 'Contact Sales']),
  homepageSections: JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS),
  widgetQuickchatEnabled: true,
  widgetWhatsappEnabled: true,
  widgetLoadingScreenEnabled: false,
  widgetCookieConsentEnabled: true,
  widgetBackToTopEnabled: true,
  widgetScrollProgressEnabled: true,
  widgetLeadPopupEnabled: true,
  trackingGa4Id: '',
  trackingGtmId: '',
  trackingFbPixelId: '',
  trackingHeadCode: '',
  trackingBodyCode: '',
}

// Module-level singleton — shared across all components
let sharedSettings: SiteSettings | null = null
let sharedPromise: Promise<SiteSettings> | null = null
let fetchTime = 0
const STALE_TIME = 60_000 // 1 minute

/**
 * Seed the settings cache with server-fetched data (called from LayoutWrapper
 * with the settings the root layout already loaded). Removes the client-side
 * /api/site-settings fetch from the critical path and guarantees the first
 * render (SSR and hydration) uses real values instead of DEFAULTS — no
 * announcement-bar layout shift, no loading-screen flash.
 */
export function seedSiteSettings(settings: SiteSettings): void {
  sharedSettings = settings
  fetchTime = Date.now()
}

async function fetchSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch('/api/site-settings')
    if (!res.ok) return DEFAULTS
    return await res.json()
  } catch {
    return DEFAULTS
  }
}

/**
 * React hook to access site settings.
 * Uses a module-level cache so multiple components share one fetch.
 */
export function useSiteSettings(): SiteSettings {
  const [, setTick] = useState(0)

  useEffect(() => {
    const now = Date.now()
    // If we have fresh cached data, use it
    if (sharedSettings && now - fetchTime < STALE_TIME) return

    // Deduplicate concurrent fetches
    if (!sharedPromise) {
      sharedPromise = fetchSettings().then(data => {
        sharedSettings = data
        fetchTime = Date.now()
        sharedPromise = null
        setTick(t => t + 1) // re-render all consumers
        return data
      })
    }

    sharedPromise.then(() => setTick(t => t + 1))
  }, [])

  return sharedSettings || DEFAULTS
}

/**
 * Helper: get WhatsApp link from settings.
 */
export function getWhatsAppLink(settings: SiteSettings, customMessage?: string): string {
  // Falls back to the company phone when no dedicated WhatsApp number is set.
  // Placeholder numbers (containing "X") are treated as unset.
  const raw = settings.socialWhatsapp || settings.companyPhone || ''
  const phone = /x/i.test(raw) ? '' : raw.replace(/[^0-9]/g, '')
  const msg = customMessage || settings.whatsappDefaultMessage || ''
  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    : '#'
}

/**
 * Helper: get phone link (tel: URI) from settings.
 */
export function getPhoneLink(settings: SiteSettings): string {
  return `tel:${settings.companyPhone.replace(/[^0-9+]/g, '')}`
}

/**
 * Helper: get mailto link from settings.
 */
export function getMailtoLink(settings: SiteSettings, email?: string): string {
  return `mailto:${email || settings.companyEmail}`
}