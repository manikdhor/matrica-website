'use client'

import RichText from '@/components/RichText'

/**
 * Chapter-opener header shared by all inner pages.
 * Dark forest band + survey grid + mono eyebrow + display serif title —
 * the same visual voice as the homepage's dark anchor sections.
 */
export default function PageHero({
  eyebrow,
  plotNo,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  plotNo?: string
  title: React.ReactNode
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28 bg-[#0A120E]">
      {/* Brass hairline at the bottom edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(169,139,79,0.45) 50%, transparent 90%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* CSS entrance (transform-only), not framer-motion: this H1 is the
            inner pages' LCP element — an initial opacity:0 would keep it
            invisible until JS hydrates on slow connections. */}
        <div className="hero-rise">
          <span className="eyebrow-plot eyebrow-plot-dark mb-5">
            {eyebrow}
          </span>

          <h1 className="display-title display-title-dark mt-4 mb-5">
            {title}
          </h1>

          {subtitle && (
            <RichText
              as="span"
              html={subtitle}
              className="block text-white/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            />
          )}

          {children}
        </div>
      </div>
    </section>
  )
}
