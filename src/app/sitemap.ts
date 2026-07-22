import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const BASE_URL = 'https://matrica.com.bd'

async function getProjectSlugs(): Promise<string[]> {
  try {
    const rows = await db.project.findMany({
      where: { publishStatus: 'published' },
      select: { slug: true },
      orderBy: { sortOrder: 'asc' },
    })
    return rows.length ? rows.map((r) => r.slug) : ['chandra-chaya', 'ventura-city']
  } catch {
    return ['chandra-chaya', 'ventura-city']
  }
}

const FALLBACK_BLOG_SLUGS = [
  'why-purbachal-best-investment-2025',
  'complete-guide-buying-land-bangladesh',
  'purbachal-infrastructure-update-2025',
  'things-check-before-buying-plot',
  'matrica-launches-green-valley',
  'rajuk-approval-process-guide',
]

async function getBlogSlugs(): Promise<string[]> {
  try {
    const rows = await db.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true },
      orderBy: { publishedAt: 'desc' },
    })
    return rows.length ? rows.map((r) => r.slug) : FALLBACK_BLOG_SLUGS
  } catch {
    return FALLBACK_BLOG_SLUGS
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projectSlugs, blogSlugs] = await Promise.all([getProjectSlugs(), getBlogSlugs()])
  const staticRoutes = [
    '', '/projects', '/about', '/gallery', '/contact',
    '/site-visit', '/blog', '/faq', '/privacy', '/terms',
  ]

  const now = new Date()

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: now,
      changeFrequency: route === '/blog' ? 'weekly' as const : 'monthly' as const,
      priority: route === '' ? 1.0 : route === '/projects' ? 0.9 : 0.7,
    })),
    ...projectSlugs.map((slug) => ({
      url: `${BASE_URL}/projects/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...blogSlugs.map((slug) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}