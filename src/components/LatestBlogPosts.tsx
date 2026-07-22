'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Clock, Calendar } from 'lucide-react'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import type { PublicBlogListPayload } from '@/app/api/blog/route'

interface BlogPost {
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  image: string
  slug: string
}

const categoryColorMap: Record<string, string> = {
  'Investment Guide': 'bg-[#1E6B3A] text-white',
  "Buyer's Guide": 'bg-[#A98B4F] text-white',
  'Project Spotlight': 'bg-[#1E6B3A] text-white',
}

const blogPosts: BlogPost[] = [
  {
    title: "Why Purbachal is Dhaka's Best Investment Destination in 2025",
    excerpt:
      'Discover why thousands of families are choosing Purbachal for their dream home. From infrastructure growth to property appreciation, we break down the numbers.',
    category: 'Investment Guide',
    date: 'Jan 15, 2025',
    readTime: '5 min read',
    image: '/images/project-chandrachaya.webp',
    slug: '/blog/why-purbachal-best-investment-2025',
  },
  {
    title: 'Complete Guide to Buying a Residential Plot in Bangladesh',
    excerpt:
      "From RAJUK approval to registration — everything you need to know before investing in a residential plot. Avoid common mistakes with our expert tips.",
    category: "Buyer's Guide",
    date: 'Dec 28, 2024',
    readTime: '8 min read',
    image: '/images/project-ventura.webp',
    slug: '/blog/complete-guide-buying-land-bangladesh',
  },
  {
    title: 'RAJUK Approval Process: A Complete Guide for Buyers in Bangladesh',
    excerpt:
      'Understanding RAJUK approval is crucial when buying property in Dhaka. Our step-by-step guide covers everything from layout plan verification to final approval.',
    category: "Buyer's Guide",
    date: 'Dec 10, 2024',
    readTime: '6 min read',
    image: '/images/project-chandrachaya.webp',
    slug: '/blog/rajuk-approval-process-guide',
  },
]

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LatestBlogPosts() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const t = useT()

  // DB-driven posts (admin-managed) — hardcoded posts stay as fallback
  const { data } = usePublicData<PublicBlogListPayload>('/api/blog')

  // Section header copy — admin-managed via the `blog_section` content section
  // (subtitle = eyebrow, title = heading); literals stay as fallback.
  const { data: cs } =
    usePublicData<Record<string, { title?: string; subtitle?: string; content?: string }>>('/api/content-sections')
  const bs = cs?.blog_section

  const posts: BlogPost[] =
    data?.posts && data.posts.length > 0
      ? data.posts.slice(0, 3).map((p) => ({
          title: p.title,
          excerpt: p.excerpt,
          category: p.category,
          date: formatDate(p.date),
          readTime: p.readTime,
          image: p.image || '/images/project-chandrachaya.webp',
          slug: `/blog/${p.slug}`,
        }))
      : blogPosts

  return (
    <section className="py-24 md:py-32 bg-[#FBFAF7] relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="eyebrow-plot mb-5">
            {bs?.subtitle ?? 'The Journal'}
          </span>
          <h2 className="display-title mt-4">
            {bs?.title ? (
              bs.title
            ) : (
              <>
                From our <span className="accent-word">blog</span>
              </>
            )}
          </h2>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {posts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + index * 0.12, duration: 0.5 }}
              className="premium-card overflow-hidden group transition-colors duration-300 hover:border-[#1E6B3A]/40"
            >
              {/* Image */}
              <Link href={post.slug} className="block overflow-hidden h-48">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </Link>

              {/* Content */}
              <div className="p-5 sm:p-6 flex flex-col">
                {/* Category Tag */}
                <span
                  className={`tag-premium w-fit mb-3 ${categoryColorMap[post.category] || 'bg-[#1E6B3A] text-white'}`}
                >
                  {post.category}
                </span>

                {/* Title */}
                <Link href={post.slug}>
                  <h3
                    className="font-[family-name:var(--font-heading)] text-[#1A202C] font-bold text-base sm:text-lg leading-snug mb-3 hover:text-[#1E6B3A] transition-colors"
                    style={{ fontFamily: 'var(--font-heading), Georgia, serif' }}
                  >
                    {post.title}
                  </h3>
                </Link>

                {/* Excerpt */}
                <p className="text-[#334155] text-sm leading-relaxed mb-4 flex-1">
                  {post.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 pt-3 border-t border-[#E2E8F0]">
                  <span className="flex items-center gap-1.5 text-[#334155] text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#334155] text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-10"
        >
          <Link href="/blog" className="link-premium">
            {t('home.blog.viewAll')}
            <ArrowRight className="w-4 h-4 link-arrow" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}