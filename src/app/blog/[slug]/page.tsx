import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata, stripHtml, clampDescription } from '@/lib/seo'
import { getPublishedBlogBySlug } from '@/lib/blog-data'
import JsonLd from '@/components/JsonLd'
import BlogArticlePage from '@/components/BlogArticlePage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const s = await getSiteSettings()
  const { post } = await getPublishedBlogBySlug(slug)
  const name = post?.title || slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const desc =
    clampDescription(post?.excerpt || post?.content || '') ||
    `Read about ${name} on the ${s.companyName} blog — insights on property investment and Dhaka real estate.`
  return buildPageMetadata({
    path: `/blog/${slug}`,
    title: `${name} | ${s.companyName}`,
    description: desc,
    ogImage: post?.image || undefined,
    article: true,
  })
}

// ISR — matches the 60s in-memory cache TTL in blog-data.ts.
export const revalidate = 60

export default async function BlogArticle({ params }: PageProps) {
  const { slug } = await params
  const s = await getSiteSettings()
  const payload = await getPublishedBlogBySlug(slug)
  const post = payload.post

  const url = `${s.siteUrl}/blog/${slug}`
  const published = post?.date
  const modified = post?.updatedAt ?? undefined

  const graph: Record<string, unknown>[] = []
  if (post) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: clampDescription(post.excerpt || post.content || '') || undefined,
      image: post.image || undefined,
      author: { '@type': 'Organization', name: post.author || s.companyName },
      publisher: {
        '@type': 'Organization',
        name: s.companyName,
        logo: { '@type': 'ImageObject', url: `${s.siteUrl}/logo.png` },
      },
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      ...(post.category ? { articleSection: post.category } : {}),
    })
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: s.siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${s.siteUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    })
  }

  return (
    <>
      {graph.length > 0 && <JsonLd data={graph} />}
      <BlogArticlePage slug={slug} initialPost={payload.fallback ? undefined : payload} />
    </>
  )
}
