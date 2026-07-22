'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Target, Eye, ChevronRight, Heart, Lightbulb, Gem, ShieldCheck, Leaf, Users, Building2, Droplets, Zap, Flame, Landmark, Building, Factory, Globe, Home } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHero from '@/components/PageHero'
import { useSiteSettings } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import { Icon } from '@/lib/icons'
import RichText from '@/components/RichText'

/* Approval and utility bodies our projects are planned around — nothing ceremonial. */
const partnerItems = [
  { name: 'RAJUK', icon: <Building2 className="w-5 h-5 text-[#1A5C33]" /> },
  { name: 'Dhaka WASA', icon: <Droplets className="w-5 h-5 text-[#1A5C33]" /> },
  { name: 'DPDC', icon: <Zap className="w-5 h-5 text-[#1A5C33]" /> },
  { name: 'Titas Gas', icon: <Flame className="w-5 h-5 text-[#1A5C33]" /> },
]

/* Status-based, not year-inflated — we are a young company and say so. */
const timelineItems = [
  { year: 'Day One', title: 'Founded on a Simple Premise', description: 'MATRICA REAL ESTATE LTD was established to do land development the hard way: papers first, promises second.' },
  { year: 'The Land', title: '550+ Bigha Assembled', description: 'Land acquired and consolidated beside Zinda Park and central Purbachal — chosen for connectivity, not convenience.' },
  { year: 'The Papers', title: 'RAJUK Approvals Secured', description: 'Every plot in both projects approved before a single one was offered for sale.' },
  { year: 'Now', title: 'Infrastructure Underway', description: 'Roads 25–40 ft wide, drainage, utilities, and green corridors being built across Chandra Chaya and Ventura City.' },
  { year: 'Ahead', title: 'First Handovers', description: 'Plot handovers with registration support — each one published to our public delivery record.' },
]

const stats = [
  { value: 550, suffix: '+', label: 'Bigha Master-Planned' },
  { value: 2, suffix: '', label: 'Purbachal Projects' },
  { value: 30, suffix: '%', label: 'Green & Public Land' },
  { value: 3, suffix: '', label: 'Plot Sizes — 3, 5 & 10 Katha' },
]

/* Shape returned by /api/content-sections — a map keyed by sectionKey.
   The admin "About Page" tab manages about_partners / about_timeline /
   about_stats; the hardcoded arrays above stay as fallback. */
interface PublicSection {
  sectionKey: string
  title: string | null
  subtitle: string | null
  content: string | null
  icon: string | null
  image: string | null
  config: string | null
}
type PublicSectionsMap = Record<string, PublicSection>

function sectionConfig<T>(sections: PublicSectionsMap | null, key: string): T | null {
  const raw = sections?.[key]?.config
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

/* Icon names an admin can assign to partner rows, resolved to the lucide
   components bundled on this page — unknown names fall back to Building2. */
const partnerIconMap: Record<string, LucideIcon> = {
  Building2, Droplets, Zap, Flame, Landmark, Building, Factory, Globe, Home,
  ShieldCheck, Leaf, Users, Target, Eye, Heart, Lightbulb, Gem,
}

/* Management speeches — the letters that carry the company's word.
   Add a `photo` path (e.g. '/images/team/chairman.webp') when real
   portraits arrive; until then an engraved monogram panel renders. */
interface ManagementEntry {
  name: string
  designation: string
  initials: string
  photo?: string
  pull: string
  speech: string[]
}

interface TeamEntry {
  name: string
  designation: string
  initials: string
  photo?: string
}

/* Shape returned by /api/team */
interface DbTeamMember {
  id: string
  name: string
  designation: string
  photo: string | null
  bio: string | null
  message: string | null
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

const management: ManagementEntry[] = [
  {
    name: 'Mohammad Shabuddin Miah',
    designation: 'Chairman',
    initials: 'MSM',
    pull: 'Land is the one purchase a family makes with its whole heart — we build the address first, and sell it second.',
    speech: [
      "As Chairman, my expectation of Matrica is plain: buy each project's land in the company's own name, put the papers in the buyer's hand before a single taka changes hands, and build the roads, utilities and open space a permanent address deserves.",
      'Come to our Gulshan-2 office, bring your own lawyer, and hold us to it.',
    ],
  },
  {
    name: 'Moshiur Rahman',
    designation: 'Managing Director',
    initials: 'MR',
    pull: "Over a decade in Bangladesh's real estate sector, with 500+ flats handed over across the Badda and Gulshan areas.",
    speech: [
      "My focus is simple: each project's land is bought in the company's own name, the documents are yours to verify before you pay, and the infrastructure is built on the ground.",
      'Visit our Gulshan-2 office, bring your own lawyer, and check everything. A project done right has nothing to fear from scrutiny.',
    ],
  },
]

const teamMembers: TeamEntry[] = [
  { name: 'Farzana Hak', designation: 'Director', initials: 'FH' },
  { name: 'Sadia Farjana Nishi', designation: 'Director', initials: 'SFN' },
]

const values = [
  {
    icon: Heart,
    title: 'Integrity',
    description: 'Honest dealings and transparent processes in everything we do.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Embracing modern techniques and forward-thinking development.',
  },
  {
    icon: Gem,
    title: 'Quality',
    description: 'Uncompromising standards in infrastructure and community planning.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparency',
    description: 'Clear documentation, fair pricing, and open communication.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'Eco-conscious development with green spaces and responsible planning.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building neighborhoods where families thrive together.',
  },
]

function AnimatedCounter({ value, suffix, visible }: { value: number; suffix: string; visible: boolean }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!visible) return
    let start = 0
    const duration = 2000
    const startTime = performance.now()
    let rafId: number
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(eased * value))
      if (progress < 1) rafId = requestAnimationFrame(animate)
      else setCount(value)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [visible, value])
  return <span className="counter-number">{count}{suffix}</span>
}

export default function AboutPage() {
  const s = useSiteSettings()
  const t = useT()
  const companyName = s.companyName

  /* Team from DB — falls back to the hardcoded content above when the
     API reports fallback (DB unreachable) or returns no members. */
  const [dbTeam, setDbTeam] = useState<{ leadership: DbTeamMember[]; team: DbTeamMember[] } | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/team')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || data.fallback) return
        const leadership: DbTeamMember[] = Array.isArray(data.leadership) ? data.leadership : []
        const team: DbTeamMember[] = Array.isArray(data.team) ? data.team : []
        if (leadership.length + team.length > 0) setDbTeam({ leadership, team })
      })
      .catch(() => {
        /* keep hardcoded fallback */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const managementToRender: ManagementEntry[] =
    dbTeam && dbTeam.leadership.length > 0
      ? dbTeam.leadership.map((m) => ({
          name: m.name,
          designation: m.designation,
          initials: initialsOf(m.name),
          photo: m.photo || undefined,
          pull: m.bio || '',
          // message is admin-authored rich HTML — keep it intact and let
          // RichText render it; no newline-splitting (HTML carries its own
          // paragraph structure).
          speech: m.message ? [m.message] : [],
        }))
      : management

  const teamToRender: TeamEntry[] =
    dbTeam && dbTeam.team.length > 0
      ? dbTeam.team.map((m) => ({
          name: m.name,
          designation: m.designation,
          initials: initialsOf(m.name),
          photo: m.photo || undefined,
        }))
      : teamMembers

  /* Partners / timeline / stats from DB (admin Content → About Page tab) —
     hardcoded arrays above stay as fallback when rows don't exist yet. */
  const { data: contentSections } = usePublicData<PublicSectionsMap>('/api/content-sections')

  const dbPartners = sectionConfig<{ partners?: { name: string; icon: string }[] }>(contentSections, 'about_partners')?.partners
  const partnersToRender =
    dbPartners && dbPartners.length > 0
      ? dbPartners.map((p) => {
          const Icon = partnerIconMap[p.icon] || Building2
          return { name: p.name, icon: <Icon className="w-5 h-5 text-[#1A5C33]" /> }
        })
      : partnerItems

  const dbTimeline = sectionConfig<{ items?: { year: string; title: string; description: string }[] }>(contentSections, 'about_timeline')?.items
  const timelineToRender = dbTimeline && dbTimeline.length > 0 ? dbTimeline : timelineItems

  const dbStats = sectionConfig<{ stats?: { value: number; suffix?: string; label: string }[] }>(contentSections, 'about_stats')?.stats
  const statsToRender =
    dbStats && dbStats.length > 0
      ? dbStats.map((st) => ({ value: Number(st.value) || 0, suffix: st.suffix || '', label: st.label }))
      : stats

  /* Hero / Story / Mission / Vision / Values copy from DB (admin Content →
     About Page tab) — every literal below stays as fallback. */
  const aboutHero = contentSections?.about_hero
  const aboutStory = contentSections?.about_story
  const aboutMission = contentSections?.about_mission
  const aboutVision = contentSections?.about_vision

  // Values: admin config.values (icon names → lib <Icon>), otherwise the
  // hardcoded lucide-component list. Normalised to a common render shape.
  const dbValues = sectionConfig<{ values?: { icon: string; title: string; description: string }[] }>(contentSections, 'about_values')?.values
  const valuesToRender: { icon: React.ReactNode; title: string; description: string }[] =
    dbValues && dbValues.length > 0
      ? dbValues.map((v) => ({
          icon: <Icon name={v.icon} className="w-5 h-5 text-[#1E6B3A]" />,
          title: v.title,
          description: v.description,
        }))
      : values.map((v) => {
          const I = v.icon
          return { icon: <I className="w-5 h-5 text-[#1E6B3A]" />, title: v.title, description: v.description }
        })

  const storyRef = useRef<HTMLDivElement>(null)
  const storyInView = useInView(storyRef, { once: true, margin: '-80px' })

  const mvRef = useRef<HTMLDivElement>(null)
  const mvInView = useInView(mvRef, { once: true, margin: '-80px' })

  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-50px' })

  const leaderRef = useRef<HTMLDivElement>(null)
  const leaderInView = useInView(leaderRef, { once: true, margin: '-80px' })

  const valuesRef = useRef<HTMLDivElement>(null)
  const valuesInView = useInView(valuesRef, { once: true, margin: '-80px' })

  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineInView = useInView(timelineRef, { once: true, margin: '-80px' })

  return (
    <main className="page-enter">
      {/* Chapter opener */}
      <PageHero
        plotNo="Sheet 02"
        eyebrow={aboutHero?.subtitle ?? 'The Company'}
        title={
          aboutHero?.title ? (
            aboutHero.title
          ) : (
            <>
              Built on land.
              <br />
              Measured in <span className="accent-word-gold">trust</span>.
            </>
          )
        }
        subtitle={aboutHero?.content ?? 'A company holding itself to an old-fashioned standard of proof.'}
      />

      {/* Company Story */}
      <section ref={storyRef} className="py-20 md:py-28 bg-[#FBFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={storyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="eyebrow-plot eyebrow-plot-left">{t('pages.about.storyEyebrow')}</span>
              <h2
                className="text-3xl sm:text-4xl text-[#121814] mb-6 mt-3"
              >
                {aboutStory?.title ?? 'New Name. Old-Fashioned Rigor.'}
              </h2>
              <div className="space-y-5 text-[#4A544E] text-base leading-relaxed">
                {aboutStory?.content?.trim() ? (
                  <RichText html={aboutStory.content} />
                ) : (
                  <>
                    <p>
                      {companyName + ' is a young company, and we treat that as an'}
                      advantage: no legacy shortcuts, no inherited habits — every
                      process designed from scratch around one question. Would we
                      buy this plot ourselves, on these papers, at this price?
                    </p>
                    <p>
                      We began with the land, not the marketing. More than 500
                      bigha in Purbachal — Dhaka&apos;s planned eastward expansion —
                      was assembled, surveyed, and taken through RAJUK approval
                      before the first plot was ever offered. Infrastructure comes
                      first: roads, drainage, utilities, and green corridors are
                      built ahead of handover, not promised after it.
                    </p>
                    <p>
                      We have no decades of history to point to. What we have is
                      a record being written right now, in public — every approval,
                      every milestone, every handover documented and verifiable.
                    </p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Right - Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={storyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="corner-ticks rounded-2xl overflow-hidden elev-md">
                <img
                  src={aboutStory?.image || '/images/project-chandrachaya.webp'}
                  alt="MATRICA Our Story"
                  className="w-full h-[350px] lg:h-[450px] object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section ref={mvRef} className="py-20 md:py-28 bg-[#F4F2EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={mvInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="premium-card rounded-2xl p-8 md:p-10"
            >
              <div className="relative w-14 h-14 rounded-xl bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-xl bg-[#1E6B3A]/15 blur-xl" />
                <Target className="relative w-7 h-7 text-[#1E6B3A]" />
              </div>
              <h3
                className="text-2xl font-bold text-[#131B16] mb-4"

              >
                {aboutMission?.title ?? 'Our Mission'}
              </h3>
              <RichText
                className="text-[#4A564E] text-base leading-relaxed"
                html={aboutMission?.content ??
                  'To transform undeveloped land into thriving, well-planned communities that families are proud to call home.'}
              />
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={mvInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="premium-card rounded-2xl p-8 md:p-10"
            >
              <div className="relative w-14 h-14 rounded-xl bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-xl bg-[#1E6B3A]/15 blur-xl" />
                <Eye className="relative w-7 h-7 text-[#1E6B3A]" />
              </div>
              <h3
                className="text-2xl font-bold text-[#131B16] mb-4"

              >
                {aboutVision?.title ?? 'Our Vision'}
              </h3>
              <RichText
                className="text-[#4A564E] text-base leading-relaxed"
                html={aboutVision?.content ??
                  "To be Bangladesh's most trusted land developer, setting new standards in transparency, quality, and customer satisfaction."}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="relative py-16 md:py-20 bg-[#FBFAF7]">
        <div className="gold-line" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-18">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {statsToRender.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E6B3A] mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} visible={statsInView} />
                </div>
                <p className="text-[#4A564E] text-sm sm:text-base">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="gold-line" />
      </section>

      {/* Company Timeline */}
      <section ref={timelineRef} className="py-20 md:py-28 bg-[#FBFAF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={timelineInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <span className="eyebrow-plot">
              {t('pages.about.journeyEyebrow')}
            </span>
            <h2
              className="text-3xl sm:text-4xl text-[#121814] mb-4"
            >
              {t('pages.about.journeyTitle')}
            </h2>
            <p className="text-[#4A544E] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {t('pages.about.journeySubtitle')}
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#1E6B3A]/30 to-transparent" />

            {timelineToRender.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn(
                  'relative flex items-start gap-6 md:gap-0 mb-12 last:mb-0',
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                )}
              >
                {/* Dot on timeline */}
                <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-[#1E6B3A] -translate-x-1/2 mt-1.5 z-10" />

                {/* Content card */}
                <div className={cn('ml-10 md:ml-0 md:w-[45%]', index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12')}>
                  <span className="text-[#A98B4F] text-sm font-bold">{item.year}</span>
                  <h3 className="text-[#131B16] font-semibold text-base mt-1">{item.title}</h3>
                  <p className="text-[#4A564E] text-sm mt-1"><RichText as="span" html={item.description.replace(/MATRICA REAL ESTATE LTD/g, companyName)} /></p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership — management speeches, then the wider team */}
      <section ref={leaderRef} className="py-20 md:py-32 bg-[#F3F1EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={leaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="section-header !mb-16 md:!mb-24"
          >
            <span className="eyebrow-plot">{t('pages.about.leadershipEyebrow')}</span>
            <h2 className="display-title mt-4 mb-4">
              {t('pages.about.leadershipTitlePre')} <em className="font-normal">{t('pages.about.leadershipTitleEm')}</em>
            </h2>
            <p className="text-[#4A544E] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-light">
              {t('pages.about.leadershipSubtitle')}
            </p>
          </motion.div>

          {/* Management speeches — editorial letters, alternating */}
          <div className="space-y-20 md:space-y-28 mb-24 md:mb-32">
            {managementToRender.map((person, index) => {
              const reversed = index % 2 === 1
              return (
                <motion.article
                  key={person.name}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start"
                >
                  {/* Portrait panel — photo when provided, engraved monogram until then */}
                  <div className={cn('lg:col-span-4', reversed && 'lg:order-2')}>
                    <div className="relative aspect-[4/5] max-w-sm mx-auto lg:mx-0 overflow-hidden bg-[#0A120E]">
                      {person.photo ? (
                        <img
                          src={person.photo}
                          alt={`${person.name}, ${person.designation}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-heading text-6xl text-[#C7AE79]">
                            {person.initials}
                          </span>
                          <span className="mt-5 w-10 h-px bg-[#A98B4F]/60" />
                        </div>
                      )}
                      {/* Brass baseline */}
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#A98B4F]/50" />
                    </div>
                    <div className="max-w-sm mx-auto lg:mx-0 mt-5">
                      <p className="font-heading text-xl text-[#121814]">{person.name}</p>
                      <p className="text-[0.66rem] tracking-[0.24em] uppercase text-[#707A72] mt-1">
                        {person.designation}
                      </p>
                    </div>
                  </div>

                  {/* The speech */}
                  <div className={cn('lg:col-span-8', reversed && 'lg:order-1')}>
                    <span className="eyebrow-plot eyebrow-plot-left mb-6">
                      {t('pages.about.fromThe')} {person.designation}
                    </span>
                    {person.pull && (
                      <blockquote className="font-heading not-italic text-2xl sm:text-3xl leading-snug text-[#121814] mt-4 mb-8 max-w-2xl">
                        &ldquo;<RichText as="span" html={person.pull} />&rdquo;
                      </blockquote>
                    )}
                    {person.speech.length > 0 && (
                      <div className="space-y-5 max-w-2xl">
                        {person.speech.map((para) => (
                          <RichText
                            key={para.slice(0, 32)}
                            html={para}
                            className="text-[#4A544E] leading-relaxed font-light"
                          />
                        ))}
                      </div>
                    )}
                    {/* Sign-off */}
                    <div className="mt-8 flex items-center gap-4">
                      <span className="w-12 h-px bg-[#A98B4F]" />
                      <span className="font-heading italic text-lg text-[#121814]">
                        {person.name}
                      </span>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>

          {/* Wider team — quiet grid */}
          <div>
            <span className="eyebrow-plot eyebrow-plot-left mb-8">{t('pages.about.teamEyebrow')}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#121814]/10 border border-[#121814]/10 mt-6">
              {teamToRender.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-[#FAF9F6] p-7 flex items-center gap-5"
                >
                  <div className="w-14 h-14 shrink-0 bg-[#0A120E] flex items-center justify-center overflow-hidden">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-heading text-lg text-[#C7AE79]">{member.initials}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-[#121814]">{member.name}</h3>
                    <p className="text-[0.64rem] tracking-[0.22em] uppercase text-[#707A72] mt-0.5">
                      {member.designation}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section ref={valuesRef} className="py-20 md:py-28 bg-[#FBFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <span className="eyebrow-plot">
              {t('pages.about.valuesEyebrow')}
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#131B16] mb-4"

            >
              {t('pages.about.valuesTitle')}
            </h2>
            <p className="text-[#4A564E] text-base sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              {t('pages.about.valuesSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {valuesToRender.map((value, index) => {
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="premium-card-accent rounded-2xl p-6 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 w-11 h-11 rounded-lg bg-[#1E6B3A]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative w-11 h-11 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center group-hover:bg-[#1E6B3A]/20 transition-colors">
                        {value.icon}
                      </div>
                    </div>
                    <div>
                      <h3
                        className="text-[#131B16] font-semibold text-base mb-1.5"

                      >
                        {value.title}
                      </h3>
                      <p className="text-[#4A564E] text-sm leading-relaxed"><RichText as="span" html={value.description} /></p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Approvals & utilities — static, no marquee theatrics */}
      <section className="py-16 md:py-24 bg-[#F3F1EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-header !mb-10">
            <span className="eyebrow-plot">
              {t('pages.about.approvalsEyebrow')}
            </span>
            <h2 className="text-2xl md:text-3xl text-[#121814] mb-3">
              {t('pages.about.approvalsTitle')}
            </h2>
            <p className="text-[#4A544E] text-sm max-w-lg mx-auto">
              {t('pages.about.approvalsSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
            {partnersToRender.map((p) => (
              <div key={p.name} className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity duration-500">
                <div className="w-10 h-10 rounded-md bg-white border border-[#121814]/10 flex items-center justify-center">
                  {p.icon}
                </div>
                <span className="text-[#121814] text-sm font-medium whitespace-nowrap">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}