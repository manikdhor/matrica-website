import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSiteSettings } from '@/app/api/site-settings/route'

/** Single Setting row holding the admin-managed per-page SEO overrides (JSON map). */
export const SEO_SETTING_KEY = 'page_seo'

export interface PageSeoEntry {
  title?: string
  description?: string
  keywords?: string // comma-separated
  ogImage?: string
  noindex?: boolean
}
export type PageSeoMap = Record<string, PageSeoEntry>

/** Static routes exposed in the admin SEO editor. Dynamic [slug] pages derive
 *  their meta from the underlying DB record instead. */
export const SEO_PAGES: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/projects', label: 'Projects (list)' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/blog', label: 'Blog (list)' },
  { path: '/faq', label: 'FAQ' },
  { path: '/contact', label: 'Contact' },
  { path: '/site-visit', label: 'Site Visit' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms & Conditions' },
]

export async function getPageSeoMap(): Promise<PageSeoMap> {
  try {
    const row = await db.setting.findUnique({
      where: { key: SEO_SETTING_KEY },
      select: { value: true },
    })
    if (!row?.value) return {}
    const parsed = JSON.parse(row.value)
    return parsed && typeof parsed === 'object' ? (parsed as PageSeoMap) : {}
  } catch {
    return {}
  }
}

/** Strip HTML tags + collapse whitespace — for meta descriptions / JSON-LD text
 *  built from rich-text (HTML) content fields. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Clamp a description to a search-friendly length without cutting mid-word. */
export function clampDescription(text: string, max = 160): string {
  const clean = stripHtml(text)
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

export interface SeoInput {
  /** Canonical path, e.g. "/about" or "/projects/chandra-chaya". */
  path: string
  title: string
  description: string
  ogImage?: string
  keywords?: string[]
  /** true for article-type OG (blog posts). */
  article?: boolean
}

/**
 * Build a full Next.js Metadata object for a page: admin overrides (for static
 * routes) win over the passed-in defaults, then canonical + OpenGraph + Twitter
 * are filled in. metadataBase is set once in the root layout, so relative
 * `path` values resolve to absolute URLs.
 */
export async function buildPageMetadata(input: SeoInput): Promise<Metadata> {
  const [settings, map] = await Promise.all([getSiteSettings(), getPageSeoMap()])
  const o = map[input.path] || {}

  const title = o.title?.trim() || input.title
  const description = clampDescription(o.description?.trim() || input.description)
  const ogImage =
    o.ogImage?.trim() || input.ogImage || settings.seoOgImage || '/images/hero-slide-1.webp'
  const keywords = o.keywords?.trim()
    ? o.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : input.keywords

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: input.path },
    openGraph: {
      title,
      description,
      url: input.path,
      type: input.article ? 'article' : 'website',
      siteName: settings.companyName,
      locale: 'en_BD',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: o.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
