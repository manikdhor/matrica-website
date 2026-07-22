'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useSiteSettings } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'

interface CounterItem {
  value: number
  suffix: string
  label: string
}

/* Every number here is verifiable today. Nothing borrowed, nothing inflated.
   These are the fallbacks when the admin "Stats Section Values" settings are absent. */
const FALLBACK_STATS: CounterItem[] = [
  { value: 500, suffix: '+', label: 'Bigha Under Development' },
  { value: 2, suffix: '', label: 'Master-Planned Projects' },
  { value: 100, suffix: '%', label: 'RAJUK-Approved Plots' },
  { value: 40, suffix: ' ft', label: 'Wide Internal Roads' },
]

/**
 * Parse an admin-entered stat value like "500+", "100%", "40 ft", "2"
 * into a numeric counter value + suffix. Falls back to the hardcoded
 * item when the setting is empty or not parseable.
 */
function parseStat(raw: string | undefined, fallback: CounterItem): CounterItem {
  if (!raw || !raw.trim()) return fallback
  const match = raw.trim().match(/^([\d,]+)\s*(.*)$/)
  if (!match) return fallback
  const value = parseInt(match[1].replace(/,/g, ''), 10)
  if (isNaN(value)) return fallback
  const rest = match[2]
  // Word suffixes ("ft") keep a leading space; symbol suffixes ("+", "%") don't
  const suffix = rest ? (/^[a-zA-Z]/.test(rest) ? ` ${rest}` : rest) : ''
  return { value, suffix, label: fallback.label }
}

/**
 * Parse an admin content-section stat ({ value: "500+", label: "..." })
 * into a counter item. Returns null when the entry is empty or unparseable
 * so the settings-driven fallback stays in place.
 */
function parseDbStat(item: { value?: string; label?: string }): CounterItem | null {
  if (!item?.label?.trim() || !item?.value) return null
  const match = String(item.value).trim().match(/^([\d,]+)\s*(.*)$/)
  if (!match) return null
  const value = parseInt(match[1].replace(/,/g, ''), 10)
  if (isNaN(value)) return null
  const rest = match[2]
  const suffix = rest ? (/^[a-zA-Z]/.test(rest) ? ` ${rest}` : rest) : ''
  return { value, suffix, label: item.label.trim() }
}

function AnimatedCounter({
  value,
  suffix,
  isInView: visible,
}: {
  value: number
  suffix: string
  isInView: boolean
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!visible) return

    const duration = 2000
    const startTime = performance.now()
    let rafId: number

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(eased * value)

      setCount(current)

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        setCount(value)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [visible, value])

  return (
    <span
      className="font-heading block tabular-nums leading-none text-white"
      style={{
        fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
        letterSpacing: '-0.02em',
        fontWeight: 400,
      }}
    >
      {count.toLocaleString()}
      {suffix && (
        <span className="text-[#C7AE79]" style={{ fontSize: '0.5em' }}>
          {suffix}
        </span>
      )}
    </span>
  )
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const settings = useSiteSettings()
  const t = useT()

  // Admin content section `stats_section` overrides everything when it has
  // valid stats ({ stats: [{ value, label }] }); otherwise the settings-driven
  // numbers (and ultimately the hardcoded fallbacks) render unchanged.
  const { data: sections } =
    usePublicData<Record<string, { title?: string; subtitle?: string; content?: string; config?: string | null }>>('/api/content-sections')

  // Section header copy (eyebrow / heading / sub-paragraph) — admin-managed
  // via the `stats_header` content section; literals stay as fallback.
  const header = sections?.stats_header

  let dbStats: CounterItem[] = []
  const statsSection = sections?.stats_section
  if (statsSection?.config) {
    try {
      const cfg = JSON.parse(statsSection.config) as {
        stats?: { value?: string; label?: string }[]
      }
      dbStats = (cfg.stats ?? [])
        .map(parseDbStat)
        .filter((s): s is CounterItem => s !== null)
    } catch { /* malformed config — keep fallback */ }
  }

  // Admin "Stats Section Values" settings drive the numbers; labels stay fixed.
  const stats: CounterItem[] = dbStats.length > 0 ? dbStats : [
    parseStat(settings.statYears, FALLBACK_STATS[0]),
    parseStat(settings.statProjects, FALLBACK_STATS[1]),
    parseStat(settings.statFamilies, FALLBACK_STATS[2]),
    parseStat(settings.statPlots, FALLBACK_STATS[3]),
  ]

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-28 md:py-40 bg-[#0A120E]"
    >
      {/* Single brass hairline marks the dark band */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(169,139,79,0.45) 50%, transparent 90%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="eyebrow-plot eyebrow-plot-dark mb-5">
            {header?.subtitle ?? 'The Numbers'}
          </span>
          <h2 className="display-title display-title-dark mt-4">
            {header?.title ? (
              header.title
            ) : (
              <>
                We&rsquo;re new.
                <br />
                Our standards <em className="font-normal">aren&rsquo;t</em>.
              </>
            )}
          </h2>
          <RichText
            className="text-white/55 text-base sm:text-lg max-w-xl mx-auto mt-6 font-light leading-relaxed"
            html={header?.content ??
              'No borrowed history, no inflated milestones — only what stands on the ground today, and the discipline behind it.'}
          />
        </motion.div>

        {/* Stats ledger */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-14 gap-x-6 md:gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className="text-center relative"
            >
              <div className="mb-4">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  isInView={isInView}
                />
              </div>

              <p className="text-white/55 text-[0.62rem] sm:text-[0.68rem] tracking-[0.24em] uppercase">
                {stat.label}
              </p>

              {index < stats.length - 1 && (
                <div className="hidden md:block absolute top-2 -right-4 lg:-right-6 h-20 w-px bg-white/10" />
              )}
            </motion.div>
          ))}
        </div>

        {/* One verifiable claim, plainly made */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 md:mt-28 text-center text-white/40 text-[0.66rem] tracking-[0.3em] uppercase"
        >
          {t('home.stats.recordline')}
        </motion.p>
      </div>
    </section>
  )
}
