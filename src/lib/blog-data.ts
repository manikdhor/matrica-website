import { db } from '@/lib/db'
import { cacheValidSince } from '@/lib/content-version'
import { estimateReadTime } from '@/lib/blog-utils'

export interface PublicBlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  image: string | null
  date: string // ISO date string
  readTime: string
  author: string
}

export interface PublicBlogListPayload {
  posts: PublicBlogPost[]
  fallback?: boolean
}

export interface PublicBlogPostDetail extends PublicBlogPost {
  content: string // HTML authored via the admin RichTextEditor
  updatedAt: string | null // ISO date string — server-only (JSON-LD dateModified)
}

export interface PublicBlogPostPayload {
  post: PublicBlogPostDetail | null
  fallback?: boolean
}

const LIST_FALLBACK: PublicBlogListPayload = { posts: [], fallback: true }
const DETAIL_FALLBACK: PublicBlogPostPayload = { post: null, fallback: true }

// Simple in-memory cache (same pattern as hero-slides.ts). Shared by the
// /api/blog(/[slug]) routes and by page.tsx server components so the blog
// list/article can render real content on first paint instead of a client
// fetch round-trip.
let listCache: PublicBlogListPayload | null = null
let listCacheTime = 0
const detailCache = new Map<string, { payload: PublicBlogPostPayload; time: number }>()
const CACHE_TTL = 60_000

export async function getPublishedBlogList(): Promise<PublicBlogListPayload> {
  const now = Date.now()
  if (listCache && now - listCacheTime < CACHE_TTL && cacheValidSince(listCacheTime)) {
    return listCache
  }
  try {
    const posts = await db.blogPost.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, slug: true, title: true, excerpt: true, category: true,
        featuredImage: true, authorName: true, content: true, publishedAt: true, createdAt: true,
      },
    })
    if (posts.length === 0) {
      listCache = LIST_FALLBACK
      listCacheTime = now
      return LIST_FALLBACK
    }
    const payload: PublicBlogListPayload = {
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || '',
        category: p.category || 'General',
        image: p.featuredImage,
        date: (p.publishedAt || p.createdAt).toISOString(),
        readTime: estimateReadTime(p.content),
        author: p.authorName || 'MATRICA Team',
      })),
    }
    listCache = payload
    listCacheTime = now
    return payload
  } catch {
    listCache = LIST_FALLBACK
    listCacheTime = now - CACHE_TTL + 15_000
    return LIST_FALLBACK
  }
}

export async function getPublishedBlogBySlug(slug: string): Promise<PublicBlogPostPayload> {
  const now = Date.now()
  const cached = detailCache.get(slug)
  if (cached && now - cached.time < CACHE_TTL && cacheValidSince(cached.time)) {
    return cached.payload
  }
  try {
    const post = await db.blogPost.findFirst({
      where: { slug, status: 'published' },
      select: {
        id: true, slug: true, title: true, excerpt: true, category: true,
        featuredImage: true, authorName: true, content: true, publishedAt: true, createdAt: true, updatedAt: true,
      },
    })
    if (!post) {
      return DETAIL_FALLBACK
    }
    const payload: PublicBlogPostPayload = {
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || '',
        category: post.category || 'General',
        image: post.featuredImage,
        date: (post.publishedAt || post.createdAt).toISOString(),
        readTime: estimateReadTime(post.content),
        author: post.authorName || 'MATRICA Team',
        content: post.content || '',
        updatedAt: post.updatedAt ? post.updatedAt.toISOString() : null,
      },
    }
    detailCache.set(slug, { payload, time: now })
    return payload
  } catch {
    return DETAIL_FALLBACK
  }
}
