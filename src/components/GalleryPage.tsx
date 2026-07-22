'use client'

import PageHero from '@/components/PageHero'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ZoomIn, ChevronLeft, ChevronRight, X, ChevronRight as ChevronRightIcon, Camera, FolderOpen, Building2, LayoutGrid, HardHat, Sparkles, Download } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePublicData, seedPublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import { shimmerBlurDataURL } from '@/lib/blur-placeholder'
import type { PublicGalleryPayload } from '@/app/api/gallery/route'

interface GalleryItem {
  src: string
  name: string
  category: string
}

const galleryItems: GalleryItem[] = [
  { src: '/images/project-chandrachaya-v2.webp', name: 'Chandra Chaya Aerial', category: 'Projects' },
  { src: '/images/project-ventura.webp', name: 'Ventura City Entrance', category: 'Projects' },
  { src: '/images/hero-slide-1.webp', name: 'Purbachal Masterplan View', category: 'Projects' },
  { src: '/images/project-greenvalley.webp', name: 'Green Corridors', category: 'Development' },
  { src: '/images/project-riverside.webp', name: 'Lakeside Plots', category: 'Development' },
  { src: '/images/hero-slide-3.webp', name: 'Road Infrastructure', category: 'Development' },
  { src: '/images/project-skyline.webp', name: 'City Skyline Outlook', category: 'Amenities' },
  { src: '/images/gallery-event.webp', name: 'Handover Ceremony', category: 'Amenities' },
  { src: '/images/about-office.webp', name: 'Experience Center', category: 'Amenities' },
]

const fallbackTabs = ['All', 'Projects', 'Development', 'Amenities']

export default function GalleryPage({
  initialGallery,
  initialContentSections,
}: {
  initialGallery?: unknown
  initialContentSections?: unknown
} = {}) {
  if (initialGallery) seedPublicData('/api/gallery', initialGallery)
  if (initialContentSections) seedPublicData('/api/content-sections', initialContentSections)

  const t = useT()
  const [currentTab, setCurrentTab] = useState('All')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // DB-driven gallery (admin-managed) — hardcoded items stay as fallback
  const { data } = usePublicData<PublicGalleryPayload>('/api/gallery')

  // Hero + bottom-CTA copy — admin-managed via the `gallery_hero` /
  // `gallery_cta` content sections; literals stay as fallback.
  const { data: cs } =
    usePublicData<Record<string, { title?: string; subtitle?: string; content?: string }>>('/api/content-sections')
  const gh = cs?.gallery_hero
  const gc = cs?.gallery_cta

  const dbItems: GalleryItem[] = (data?.categories ?? []).flatMap((cat) =>
    cat.items
      .filter((item) => item.fileUrl && item.mediaType !== 'video')
      .map((item) => ({
        src: item.fileUrl as string,
        name: item.title || item.caption || cat.name,
        category: cat.name,
      }))
  )
  const usingDb = dbItems.length > 0
  const items = usingDb ? dbItems : galleryItems
  const tabs = usingDb
    ? ['All', ...Array.from(new Set(dbItems.map((i) => i.category)))]
    : fallbackTabs

  const tabsRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const tabsInView = useInView(tabsRef, { once: true, margin: '-80px' })
  const statsInView = useInView(statsRef, { once: true, margin: '-40px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-80px' })

  const categoryCounts: Record<string, number> = { All: items.length }
  for (const tab of tabs) {
    if (tab !== 'All') {
      categoryCounts[tab] = items.filter(i => i.category === tab).length
    }
  }

  const tabIcons: Record<string, React.ReactNode> = {
    All: <LayoutGrid className="w-3.5 h-3.5" />,
    Projects: <Building2 className="w-3.5 h-3.5" />,
    Development: <HardHat className="w-3.5 h-3.5" />,
    Amenities: <Sparkles className="w-3.5 h-3.5" />,
  }

  const filteredItems =
    currentTab === 'All'
      ? items
      : items.filter((item) => item.category === currentTab)

  const handlePrev = () => {
    if (lightboxIndex !== null) {
      const filtered = currentTab === 'All'
        ? items
        : items.filter((i) => i.category === currentTab)
      setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length)
    }
  }

  const handleNext = () => {
    if (lightboxIndex !== null) {
      const filtered = currentTab === 'All'
        ? items
        : items.filter((i) => i.category === currentTab)
      setLightboxIndex((lightboxIndex + 1) % filtered.length)
    }
  }

  const currentFiltered =
    currentTab === 'All'
      ? items
      : items.filter((i) => i.category === currentTab)

  const currentImage = lightboxIndex !== null ? currentFiltered[lightboxIndex] : null

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightboxIndex(null); return }
      if (e.key === 'ArrowLeft') { handlePrev(); return }
      if (e.key === 'ArrowRight') { handleNext(); return }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  return (
    <main className="page-enter">
      {/* Chapter opener */}
      <PageHero
        plotNo="Sheet 03"
        eyebrow={gh?.subtitle ?? 'The Land'}
        title={
          gh?.title ? (
            gh.title
          ) : (
            <>
              See what we&apos;re <span className="accent-word-gold">building</span>
            </>
          )
        }
        subtitle={gh?.content ?? 'A visual record of our developments — aerials, roads, green corridors, and the families who made them home.'}
      />

      {/* Gallery Stats Bar */}
      <section className="py-6 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex items-center justify-center gap-6 sm:gap-10 text-sm"
          >
            <span className="flex items-center gap-2 text-[#4A564E]">
              <Camera className="w-4 h-4 text-[#1E6B3A]" />
              <span>{items.length} {t('pages.gallery.statPhotos')}</span>
            </span>
            <span className="text-[#1E6B3A]/40 text-xs">◆</span>
            <span className="flex items-center gap-2 text-[#4A564E]">
              <FolderOpen className="w-4 h-4 text-[#1E6B3A]" />
              <span>{tabs.length - 1} {t('pages.gallery.statCategories')}</span>
            </span>
            <span className="text-[#1E6B3A]/40 text-xs">◆</span>
            <span className="flex items-center gap-2 text-[#4A564E]">
              <Building2 className="w-4 h-4 text-[#1E6B3A]" />
              <span>{t('pages.gallery.statAllProjects')}</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Tabs */}
          <div ref={tabsRef} className="flex justify-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={tabsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <Tabs value={currentTab} onValueChange={(v) => { setCurrentTab(v); setLightboxIndex(null) }}>
                <TabsList className="bg-[#FFFFFF] border border-border rounded-xl p-1.5">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-[#1E6B3A] data-[state=active]:text-[#FFFFFF] text-[#4A564E] px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2"
                    >
                      {tabIcons[tab] || <FolderOpen className="w-3.5 h-3.5" />}
                      <span>{tab}</span>
                      <span className="text-xs opacity-60">({categoryCounts[tab]})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </motion.div>
          </div>

          {/* Masonry Grid */}
          <div>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={`${item.name}-${item.category}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="break-inside-avoid group relative overflow-hidden rounded-xl cursor-pointer border border-transparent hover:border-[#1E6B3A]/40 transition-all duration-500"
                    style={{ height: index % 3 === 0 ? '320px' : index % 3 === 1 ? '260px' : '280px' }}
                    onClick={() => openLightbox(index)}
                  >
                    <Image
                      src={item.src}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover rounded-xl transition-transform duration-700 group-hover:scale-110"
                      placeholder="blur"
                      blurDataURL={shimmerBlurDataURL()}
                    />
                    {/* Category badge - top right on hover */}
                    <span className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-xs font-medium px-2.5 py-1 rounded-full bg-[#1E6B3A]/90 text-white">
                      {item.category}
                    </span>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500 flex items-center justify-center rounded-xl">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-center">
                        <div className="w-12 h-12 rounded-full border-2 border-[#1E6B3A]/60 flex items-center justify-center mx-auto mb-2">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-white font-medium text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-80">{item.name}</p>
                      </div>
                    </div>
                    {/* Name label - slides up from bottom on hover */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-3 opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0 transition-all duration-500 rounded-b-xl">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => { if (!open) closeLightbox() }}>
        <DialogContent
          showCloseButton={false}
          className="bg-white border-[#E2E8F0] max-w-4xl w-[calc(100%-2rem)] p-0 overflow-hidden"
        >
          <DialogTitle className="sr-only">{currentImage?.name ?? t('pages.gallery.dialogTitleFallback')}</DialogTitle>

          {currentImage && (
            <div className="relative">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 z-30 h-0.5 bg-[#F4F2EC]">
                <motion.div
                  className="h-full bg-[#1E6B3A]"
                  initial={false}
                  animate={{ width: `${((lightboxIndex ?? 0) + 1) / currentFiltered.length * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Image */}
              <div className="relative w-full h-[75vh] flex items-center justify-center bg-white">
                <Image
                  src={currentImage.src}
                  alt={currentImage.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-contain"
                  priority
                />
              </div>

              {/* Title bar */}
              <div className="px-6 py-4 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[#131B16] font-medium text-sm sm:text-base">{currentImage.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1E6B3A]/15 text-[#1E6B3A] border border-[#1E6B3A]/20">
                    {currentImage.category}
                  </span>
                </div>
                <p className="text-[#4A564E] text-xs mb-3">
                  {t('pages.gallery.lightboxHint')}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-[#4A564E] text-xs sm:text-sm">
                    {lightboxIndex !== null ? lightboxIndex + 1 : 0} / {currentFiltered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="w-9 h-9 rounded-full bg-[#F4F2EC] border border-[#E2E8F0] flex items-center justify-center hover:border-[#1E6B3A]/50 transition-colors"
                      aria-label={t('pages.gallery.ariaPrevious')}
                    >
                      <ChevronLeft className="w-4 h-4 text-[#131B16]" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="w-9 h-9 rounded-full bg-[#F4F2EC] border border-[#E2E8F0] flex items-center justify-center hover:border-[#1E6B3A]/50 transition-colors"
                      aria-label={t('pages.gallery.ariaNext')}
                    >
                      <ChevronRight className="w-4 h-4 text-[#131B16]" />
                    </button>
                    <button
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = currentImage.src
                        a.download = currentImage.name || 'gallery-image'
                        a.target = '_blank'
                        a.rel = 'noopener noreferrer'
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }}
                      className="w-9 h-9 rounded-full bg-[#F4F2EC] border border-[#E2E8F0] flex items-center justify-center hover:border-[#1E6B3A]/50 transition-colors"
                      aria-label={t('pages.gallery.ariaDownload')}
                    >
                      <Download className="w-4 h-4 text-[#131B16]" />
                    </button>
                    <button
                      onClick={closeLightbox}
                      className="w-9 h-9 rounded-full bg-[#F4F2EC] border border-[#E2E8F0] flex items-center justify-center hover:border-red-500/50 transition-colors ml-1"
                      aria-label={t('pages.gallery.ariaClose')}
                    >
                      <X className="w-4 h-4 text-[#131B16]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Projects CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="premium-card relative p-10 sm:p-14 text-center overflow-hidden"
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-r from-[#1E6B3A]/0 via-[#1E6B3A]/40 to-[#1E6B3A]/0 animate-[spin_4s_linear_infinite] opacity-50" style={{ backgroundSize: '200% 200%' }} />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#131B16] mb-4">
                {gc?.title ? (
                  gc.title
                ) : (
                  <>
                    Want to see these projects <span className="text-[#1E6B3A]">in person?</span>
                  </>
                )}
              </h2>
              <RichText
                className="text-[#4A564E] text-base sm:text-lg mb-8 max-w-lg mx-auto"
                html={gc?.content ?? 'Book a free site visit and experience our developments firsthand'}
              />
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/site-visit"
                  className="btn-premium px-8 py-3 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-all duration-300"
                >
                  {t('pages.gallery.ctaBookVisit')}
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/projects"
                  className="px-8 py-3 rounded-lg text-sm font-semibold text-[#1E6B3A] border border-[#1E6B3A]/30 hover:border-[#1E6B3A]/60 hover:bg-[#1E6B3A]/5 inline-flex items-center gap-2 transition-all duration-300"
                >
                  {t('pages.gallery.ctaBrowseProjects')}
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}