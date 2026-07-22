'use client'

import PageHero from '@/components/PageHero'
import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChevronRight, Clock, ArrowRight, Search, BookOpen, Tag, Calendar, X, Mail, Diamond } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePublicData, seedPublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import type { PublicBlogListPayload } from '@/app/api/blog/route'

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  image: string
  date: string
  readTime: string
  author: string
  featured?: boolean
}

const blogPosts: BlogPost[] = [
  {
    slug: 'why-purbachal-best-investment-2025',
    title: 'Why Purbachal is Dhaka\'s Best Investment in 2025',
    excerpt:
      'Purbachal New Town continues to outperform all other Dhaka suburbs in land value appreciation. With major infrastructure projects nearing completion, 2025 presents an unprecedented opportunity for savvy investors looking to secure premium residential plots at competitive prices.',
    category: 'Investment',
    image: '/images/project-ventura.webp',
    date: 'Mar 15, 2025',
    readTime: '7 min read',
    author: 'MATRICA Team',
    featured: true,
  },
  {
    slug: 'complete-guide-buying-land-bangladesh',
    title: 'Complete Guide to Buying Land in Bangladesh',
    excerpt:
      'Navigate the complexities of land acquisition in Bangladesh with our comprehensive guide covering legal requirements, documentation, RAJUK approvals, and essential due diligence steps every buyer must follow.',
    category: 'Buying Guide',
    image: '/images/project-chandrachaya.webp',
    date: 'Feb 28, 2025',
    readTime: '8 min read',
    author: 'MATRICA Team',
  },
  {
    slug: 'purbachal-infrastructure-update-2025',
    title: 'Purbachal New Town: Infrastructure Update 2025',
    excerpt:
      'From the newly opened expressway to upcoming metro rail extensions, Purbachal\'s infrastructure landscape is transforming rapidly. Here\'s everything you need to know about the latest developments.',
    category: 'Purbachal',
    image: '/images/project-chandrachaya.webp',
    date: 'Feb 10, 2025',
    readTime: '6 min read',
    author: 'MATRICA Team',
  },
  {
    slug: 'things-check-before-buying-plot',
    title: '5 Things to Check Before Buying a Residential Plot',
    excerpt:
      'Before investing your hard-earned money in a residential plot, ensure you verify these five critical factors that can make or break your investment decision.',
    category: 'Buying Guide',
    image: '/images/project-ventura.webp',
    date: 'Jan 25, 2025',
    readTime: '5 min read',
    author: 'MATRICA Team',
  },
  {
    slug: 'matrica-launches-chandra-chaya',
    title: 'Matrica Launches Chandra Chaya: A New Standard in Living',
    excerpt:
      'Introducing Chandra Chaya — our flagship project in Purbachal featuring eco-friendly design, modern amenities, and thoughtfully planned residential plots that redefine premium living.',
    category: 'Company News',
    image: '/images/project-chandrachaya.webp',
    date: 'Jan 15, 2025',
    readTime: '5 min read',
    author: 'MATRICA Team',
  },
  {
    slug: 'rajuk-approval-process-guide',
    title: 'RAJUK Approval Process: What Buyers Need to Know',
    excerpt:
      'Understanding RAJUK\'s approval process is crucial for any land buyer in Dhaka. We break down the steps, timelines, and key requirements to help you make informed decisions.',
    category: 'Investment',
    image: '/images/project-ventura.webp',
    date: 'Jan 5, 2025',
    readTime: '6 min read',
    author: 'MATRICA Team',
  },
]

const categories = ['All', 'Investment', 'Purbachal', 'Buying Guide', 'Company News']

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogPage({
  initialBlogList,
  initialContentSections,
}: {
  initialBlogList?: unknown
  initialContentSections?: unknown
} = {}) {
  if (initialBlogList) seedPublicData('/api/blog', initialBlogList)
  if (initialContentSections) seedPublicData('/api/content-sections', initialContentSections)
  const t = useT()
  // DB-driven posts (admin-managed) — hardcoded posts stay as fallback.
  // API returns newest first; the newest becomes the featured post.
  const { data } = usePublicData<PublicBlogListPayload>('/api/blog')

  // Hero + newsletter copy — admin-managed via the `blog_hero` /
  // `blog_newsletter` content sections; literals stay as fallback.
  const { data: cs } =
    usePublicData<Record<string, { title?: string; subtitle?: string; content?: string }>>('/api/content-sections')
  const bh = cs?.blog_hero
  const bn = cs?.blog_newsletter

  const dbPosts: BlogPost[] | null =
    data?.posts && data.posts.length > 0
      ? data.posts.map((p, i) => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          category: p.category,
          image: p.image || '/images/project-chandrachaya.webp',
          date: formatDate(p.date),
          readTime: p.readTime,
          author: p.author,
          featured: i === 0,
        }))
      : null

  const posts = dbPosts ?? blogPosts
  const categoriesList = dbPosts
    ? ['All', ...Array.from(new Set(dbPosts.map((p) => p.category)))]
    : categories
  const latestLabel = dbPosts
    ? new Date(data!.posts[0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Mar 2025'

  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [email, setEmail] = useState('')
  const topRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(topRef, { once: true, margin: '-80px' })

  const categoryFiltered =
    activeCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === activeCategory)

  const filteredPosts = searchQuery.trim()
    ? categoryFiltered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryFiltered

  const featuredPost = posts.find((p) => p.featured)
  const regularPosts = filteredPosts.filter((p) => !p.featured)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success(t('pages.blog.toastSubscribed'), {
          description: t('pages.blog.toastSubscribedDesc'),
        })
        setEmail('')
      } else {
        toast.error(t('pages.blog.toastSubscribeFailed'))
      }
    } catch {
      toast.error(t('pages.blog.toastNetworkError'))
    }
  }

  return (
    <main className="min-h-screen page-enter">
      {/* Chapter opener */}
      <div ref={topRef}>
        <PageHero
          plotNo="Sheet 04"
          eyebrow={bh?.subtitle ?? 'The Journal'}
          title={
            bh?.title ? (
              bh.title
            ) : (
              <>
                Notes from the <span className="accent-word-gold">field</span>
              </>
            )
          }
          subtitle={bh?.content ?? 'Insights, buying guides, and market updates from Purbachal and beyond.'}
        />
      </div>

      {/* Stats Bar */}
      <section className="py-6 bg-[#FFFFFF] border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-6 sm:gap-10 text-sm"
          >
            <div className="flex items-center gap-2 text-[#4A564E]">
              <BookOpen className="w-4 h-4 text-[#1E6B3A]" />
              <span>{posts.length} {t('pages.blog.statArticles')}</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-[#4A564E]">
              <Tag className="w-4 h-4 text-[#1E6B3A]" />
              <span>{categoriesList.length - 1} {t('pages.blog.statCategories')}</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-[#4A564E]">
              <Calendar className="w-4 h-4 text-[#1E6B3A]" />
              <span>{t('pages.blog.statLatest')} {latestLabel}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter & Posts */}
      <section className="py-16 md:py-20 bg-[#FBFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A564E]" />
              <input
                type="text"
                placeholder={t('pages.blog.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 premium-input rounded-xl text-sm transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A564E] hover:text-[#1E6B3A] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <p className="text-center text-xs text-[#4A564E] mt-2">
                {filteredPosts.length} {filteredPosts.length !== 1 ? t('pages.blog.resultsFound') : t('pages.blog.resultFound')}
              </p>
            )}
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-12"
          >
            <Tabs
              value={activeCategory}
              onValueChange={setActiveCategory}
              className="w-full max-w-2xl"
            >
              <TabsList className="bg-[#FFFFFF] border border-border w-full justify-start overflow-x-auto p-1 h-auto gap-1">
                {categoriesList.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="data-[state=active]:bg-[#1E6B3A] data-[state=active]:text-[#FFFFFF] text-[#4A564E] text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md whitespace-nowrap transition-colors"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Featured Post */}
          {activeCategory === 'All' && featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <Link href={`/blog/${featuredPost.slug}`} className="group block">
                <article className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#1E6B3A]/30 transition-colors">
                  {/* Gold corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-30 pointer-events-none z-10">
                    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path d="M96 0 L96 40 L56 0 Z" fill="#1E6B3A" />
                    </svg>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-[#1E6B3A] text-[#FFFFFF] text-xs font-semibold">
                          {featuredPost.category}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-[#FFFFFF]/80 text-[#1E6B3A] text-xs border border-[#1E6B3A]/30">
                          {t('pages.blog.editorsPick')}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <Badge className="bg-[#FFFFFF]/80 text-[#131B16] text-xs border border-border flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {featuredPost.readTime}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#131B16] mb-4 group-hover:text-[#1E6B3A] transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-[#4A564E] text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-[#4A564E]">
                          <span className="w-6 h-6 rounded-full bg-[#1E6B3A]/20 text-[#1E6B3A] text-[10px] font-bold flex items-center justify-center border border-[#1E6B3A]/30">
                            MT
                          </span>
                          <span>{featuredPost.author}</span>
                          <span>·</span>
                          <span>{featuredPost.date}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {featuredPost.readTime}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[#1E6B3A] text-sm font-medium group-hover:gap-2 transition-all">
                          {t('pages.blog.readMore')}
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          )}

          {/* Post Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {(activeCategory === 'All' ? regularPosts : filteredPosts).map(
              (post, index) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Link href={`/blog/${post.slug}`} className="group block h-full">
                    <article className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-[#1E6B3A]/30 hover:border-l-2 hover:border-l-[#1E6B3A] transition-colors h-full flex flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-[#1E6B3A] text-[#FFFFFF] text-xs font-semibold">
                            {post.category}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <Badge className="bg-[#FFFFFF]/80 text-[#131B16] text-[10px] border border-border flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {post.readTime}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-5 sm:p-6 flex flex-col flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-[#131B16] mb-2 group-hover:text-[#1E6B3A] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-[#4A564E] text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                          {post.excerpt}
                        </p>
                        <div className="shimmer-line mb-0" />
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-3 text-xs text-[#4A564E]">
                            <span className="w-6 h-6 rounded-full bg-[#1E6B3A]/20 text-[#1E6B3A] text-[10px] font-bold flex items-center justify-center border border-[#1E6B3A]/30 shrink-0">
                              MT
                            </span>
                            <span>{post.author}</span>
                            <span>·</span>
                            <span>{post.date}</span>
                          </div>
                          <span className="flex items-center gap-1 text-[#1E6B3A] text-sm font-medium group-hover:gap-2 transition-all">
                            {t('pages.blog.readMore')}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              )
            )}
          </div>

          {/* Empty state */}
          {filteredPosts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white border border-gray-100 flex items-center justify-center">
                <Search className="w-7 h-7 text-[#4A564E]" />
              </div>
              <p className="text-[#131B16] text-lg font-medium mb-2">
                {t('pages.blog.emptyTitle')}
              </p>
              <p className="text-[#4A564E] text-sm mb-6">
                {searchQuery.trim()
                  ? `${t('pages.blog.emptyNoResultsPre')}"${searchQuery.trim()}"${t('pages.blog.emptyNoResultsPost')}`
                  : t('pages.blog.emptyCategory')}
              </p>
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFFFFF] border border-border text-[#1E6B3A] text-sm hover:border-[#1E6B3A]/50 transition-colors mb-6"
                >
                  <X className="w-4 h-4" />
                  {t('pages.blog.clearSearch')}
                </button>
              )}
              <div className="mt-4">
                <p className="text-xs text-[#4A564E] mb-3 uppercase tracking-wider">{t('pages.blog.popularCategories')}</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {categoriesList.filter((c) => c !== 'All').map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat)
                        setSearchQuery('')
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-border text-xs text-[#4A564E] hover:text-[#1E6B3A] hover:border-[#1E6B3A]/30 transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-20 bg-[#FBFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-2xl mx-auto text-center"
          >
            {/* Gold diamond separator */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#1E6B3A]/40" />
              <Diamond className="w-4 h-4 text-[#1E6B3A] mx-3" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#1E6B3A]/40" />
            </div>

            <Mail className="w-10 h-10 text-[#1E6B3A] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#131B16] mb-3">
              {bn?.title ?? 'Stay Updated'}
            </h2>
            <RichText
              className="text-[#4A564E] text-sm sm:text-base mb-8 max-w-md mx-auto"
              html={bn?.content ?? 'Get the latest real estate insights delivered to your inbox'}
            />

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder={t('pages.blog.newsletterPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 premium-input rounded-xl text-sm transition-colors"
              />
              <button
                type="submit"
                className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap"
              >
                {t('pages.blog.subscribe')}
              </button>
            </form>

            <p className="text-[#4A564E]/60 text-xs mt-4">
              {t('pages.blog.noSpam')}
            </p>

            {/* Bottom diamond separator */}
            <div className="flex items-center justify-center mt-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#1E6B3A]/40" />
              <Diamond className="w-3 h-3 text-[#1E6B3A]/60 mx-3" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#1E6B3A]/40" />
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}