'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar } from 'lucide-react'
import PropertySearchBar from './PropertySearchBar'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import type { PublicHeroSlidesPayload } from '@/app/api/hero-slides/route'

/* Background imagery rotates; the message stays constant. */
const slides = [
  '/images/hero-slide-1.webp',
  '/images/hero-slide-2.webp',
  '/images/hero-slide-3.webp',
]

export default function HeroSection() {
  const t = useT()

  // DB-driven slides (admin-managed) — hardcoded content stays as fallback
  const { data } = usePublicData<PublicHeroSlidesPayload>('/api/hero-slides')
  const dbSlides = data?.slides && data.slides.length > 0 ? data.slides : null

  const current = dbSlides ? dbSlides[0] : null
  const cta1Text = current ? current.cta1Text || current.ctaText : null
  const cta1Href = current ? current.cta1Href || current.ctaLink : null
  const heroImage = current?.imageUrl || current?.backgroundImage || slides[0]

  return (
    <section
      id="home"
      className="relative h-screen min-h-[700px] max-h-[1100px] w-full bg-[#071410]"
    >
      {/* Clip the background layers only — the search bar must overflow the
          section bottom (translate-y-1/2), so no overflow-hidden on section */}
      {/* ═══════ BACKGROUND — crossfading stills ═══════ */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover hero-img-fade"
          unoptimized={!heroImage.startsWith('/')}
        />
      </div>

      {/* Dark overlay + side vignette — one compositing layer, heavier at
          the bottom for search bar readability */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.4) 100%), linear-gradient(180deg, rgba(7,20,16,0.55) 0%, rgba(7,20,16,0.38) 40%, rgba(7,20,16,0.62) 80%, rgba(7,20,16,0.9) 100%)',
        }}
      />

      {/* ═══════ CONTENT — one message, no carousel circus ═══════ */}
      <div
        className="relative z-[3] h-full flex flex-col justify-start items-center"
        style={{ paddingTop: 'clamp(6.5rem, 18vh, 12rem)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full text-center">
          {/* Eyebrow — quiet, letterspaced */}
          <p
            className="hero-fade-up text-[0.66rem] sm:text-[0.7rem] tracking-[0.34em] uppercase text-white/60 mb-7 sm:mb-9"
            style={{ animationDelay: '0.05s' }}
          >
            {current?.label || <>Purbachal&ensp;·&ensp;Dhaka</>}
          </p>

          {/* Headline — white serif, one italic accent. Transform-only
              entrance: this is the LCP element, its paint is never delayed */}
          <h1 className="hero-rise display-hero text-white mb-7 sm:mb-9">
            {current ? (
              current.title
            ) : (
              <>
                Transforming land
                <br />
                into <em className="font-normal">landmarks</em>
              </>
            )}
          </h1>

          {/* Description */}
          <p
            className="hero-fade-up text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed font-light"
            style={{ animationDelay: '0.15s' }}
          >
            <RichText
              as="span"
              html={
                current
                  ? current.description || current.subtitle
                  : 'Master-planned residential plots in Purbachal — planned in line with RAJUK policy, beside RAJUK Purbachal New Town. The patience a permanent address deserves.'
              }
            />
          </p>

          {/* CTAs */}
          <div
            className="hero-fade-up flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5"
            style={{ animationDelay: '0.25s' }}
          >
            <Link
              href={cta1Href || '/projects'}
              className="btn-premium text-base"
            >
              {cta1Text || 'Explore Projects'}
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link
              href={(current && current.cta2Href) || '/site-visit'}
              className="btn-premium-outline text-base"
            >
              <Calendar className="w-4.5 h-4.5" />
              {(current && current.cta2Text) || 'Book a Site Visit'}
            </Link>
          </div>
        </div>

        {/* One honest line — no invented numbers */}
        <p
          className="hero-fade-in mt-12 sm:mt-16 text-[0.64rem] sm:text-[0.68rem] tracking-[0.28em] uppercase text-white/50"
          style={{ animationDelay: '0.45s' }}
        >
          {t('home.hero.trustline')}
        </p>

      </div>

      {/* ═══════ SEARCH BAR (overlapping next section) ═══════ */}
      <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-1/2">
        <PropertySearchBar />
      </div>
    </section>
  )
}
