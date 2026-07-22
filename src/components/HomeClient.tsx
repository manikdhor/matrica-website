'use client'

import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import WhatsAppButton from '@/components/WhatsAppButton'
import AnnouncementBar from '@/components/AnnouncementBar'
import LazySection from '@/components/LazySection'
import DeferUntilIdle from '@/components/DeferUntilIdle'

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-[#0F2B1A]" />,
})
import { SkeletonCard, SkeletonBox } from '@/components/SkeletonPulse'
import { useSiteSettings, parseHomepageSections } from '@/lib/use-site-settings'
import { seedPublicData } from '@/lib/use-public-data'
import type { PublicHeroSlidesPayload } from '@/lib/hero-slides'
import type { PublicContentSectionsMap } from '@/lib/content-sections-data'

const FeaturedProjects = dynamic(() => import('@/components/FeaturedProjects'), {
  ssr: true,
  loading: () => (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          <SkeletonBox className="h-3 w-32 mx-auto" />
          <SkeletonBox className="h-10 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </section>
  ),
})
const StatsSection = dynamic(() => import('@/components/StatsSection'), {
  ssr: true,
  loading: () => (
    <section className="py-24 md:py-32" style={{ background: 'linear-gradient(160deg,#05210F,#0D4A22 60%,#08300F)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-3">
              <div className="h-10 w-20 mx-auto rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-28 mx-auto rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
})
const HowItWorks = dynamic(() => import('@/components/HowItWorks'), {
  ssr: true,
  loading: () => (
    <div className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          <SkeletonBox className="h-3 w-32 mx-auto" />
          <SkeletonBox className="h-10 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
})
const WhyChooseUs = dynamic(() => import('@/components/WhyChooseUs'), {
  ssr: true,
  loading: () => (
    <div className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          <SkeletonBox className="h-3 w-32 mx-auto" />
          <SkeletonBox className="h-10 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
})

const NeighborhoodGuide = dynamic(() => import('@/components/NeighborhoodGuide'), {
  ssr: false,
  loading: () => (
    <div className="py-20 md:py-28 bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
})
const GalleryPreview = dynamic(() => import('@/components/GalleryPreview'), {
  ssr: false,
  loading: () => (
    <div className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
})
const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'), {
  ssr: false,
  loading: () => (
    <div className="py-20 md:py-28 bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          <SkeletonBox className="h-3 w-32 mx-auto" />
          <SkeletonBox className="h-10 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
})
const FAQSection = dynamic(() => import('@/components/FAQSection'), {
  ssr: false,
  loading: () => (
    <div className="py-20 md:py-28 bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          <SkeletonBox className="h-3 w-32 mx-auto" />
          <SkeletonBox className="h-10 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
})
const LatestBlogPosts = dynamic(() => import('@/components/LatestBlogPosts'), {
  ssr: false,
  loading: () => (
    <div className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
})
const CTASection = dynamic(() => import('@/components/CTASection'), {
  ssr: false,
  loading: () => (
    <div className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
})

/** Map of homepage section keys → components (order/visibility driven by the `homepage_sections` setting) */
const SECTION_COMPONENTS: Record<string, ComponentType> = {
  hero: HeroSection,
  featuredProjects: FeaturedProjects,
  stats: StatsSection,
  whyChooseUs: WhyChooseUs,
  howItWorks: HowItWorks,
  neighborhood: NeighborhoodGuide,
  gallery: GalleryPreview,
  testimonials: TestimonialsSection,
  faq: FAQSection,
  blog: LatestBlogPosts,
  cta: CTASection,
}

/** Approximate rendered heights for the below-fold placeholders (px) */
const SECTION_MIN_HEIGHTS: Record<string, number> = {
  featuredProjects: 900,
  stats: 420,
  whyChooseUs: 800,
  howItWorks: 800,
  neighborhood: 700,
  gallery: 800,
  testimonials: 700,
  faq: 700,
  blog: 700,
  cta: 500,
}

export default function HomeClient({
  heroSlides,
  initialContentSections,
}: {
  heroSlides?: PublicHeroSlidesPayload
  initialContentSections?: PublicContentSectionsMap
}) {
  // Seed before any descendant reads usePublicData('/api/hero-slides') —
  // HeroSection sees loaded data on the first render (SSR and hydration),
  // so the LCP hero image is server-rendered instead of fetch-gated.
  if (heroSlides) seedPublicData('/api/hero-slides', heroSlides)
  if (initialContentSections) seedPublicData('/api/content-sections', initialContentSections)

  const settings = useSiteSettings()
  // Falls back to the hardcoded canonical order when the setting is absent/malformed
  const sectionConfig = parseHomepageSections(settings.homepageSections)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      <main className="flex-1">
        <AnnouncementBar />
        {sectionConfig.map(({ key, enabled }) => {
          if (!enabled) return null
          const Section = SECTION_COMPONENTS[key]
          if (!Section) return null
          // Hero paints immediately; everything below the fold mounts (and
          // downloads its chunk) only as the viewport approaches it.
          if (key === 'hero') return <Section key={key} />
          return (
            <LazySection key={key} minHeight={SECTION_MIN_HEIGHTS[key] ?? 480}>
              <Section />
            </LazySection>
          )
        })}
      </main>
      <LazySection minHeight={400}>
        <Footer />
      </LazySection>
      <DeferUntilIdle>
        <WhatsAppButton />
      </DeferUntilIdle>
    </div>
  )
}