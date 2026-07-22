import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import { getPublishedBlogList } from '@/lib/blog-data'
import { getContentSectionsMap } from '@/lib/content-sections-data'
import BlogPage from '@/components/BlogPage'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/blog',
    title: `Blog | ${name}`,
    description: "Read the latest insights on real estate investment, Purbachal development, sustainable living, and property trends in Bangladesh.",
  })
}

// ISR — matches the 60s in-memory cache TTL in blog-data.ts.
export const revalidate = 60

// Server-fetched so the post grid renders real content on first paint
// instead of waiting on a client /api/blog round-trip.
export default async function Page() {
  const [blogList, contentSections] = await Promise.all([
    getPublishedBlogList(),
    getContentSectionsMap(),
  ])
  return <BlogPage initialBlogList={blogList} initialContentSections={contentSections} />
}