'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  MapPin,
  ChevronRight,
  Download,
  Loader2,
  Eye,
  LayoutGrid,
  MapIcon,
  BookOpen,
  ArrowRight,
  X,
  ChevronLeft,
  Phone,
  MessageCircle,
  ExternalLink,
  Check,
  CircleDashed,
  Circle,
} from 'lucide-react'
import { toast } from 'sonner'
import VirtualTourSection from '@/components/VirtualTourSection'
import MapImageViewer from '@/components/MapImageViewer'
import { useSiteSettings, getPhoneLink, getWhatsAppLink } from '@/lib/use-site-settings'
import { useProject, useSiteProjectsOrdered, seedProject, type PublicProject } from '@/lib/use-projects'
import { Icon } from '@/lib/icons'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import { shimmerBlurDataURL } from '@/lib/blur-placeholder'

/* Project data is DB-backed — see src/lib/use-projects.ts. The current
   project renders from useProject(slug); the related strip follows admin
   order/visibility via useSiteProjectsOrdered(). */

const DOC_LEAD_KEY = 'matrica-doc-lead'

/* Display shape for a downloadable document. DB documents carry no icon/desc,
   so those are derived from docType; everything else comes from the DB row. */
type DisplayDoc = {
  key: string
  docType: string
  title: string
  desc: string
  icon: React.ReactNode
  file: string
  viewable: boolean
  gated: boolean
}

const DOC_META: Record<'layout' | 'location' | 'brochure', { title: string; desc: string; icon: React.ReactNode }> = {
  layout: {
    title: 'Layout Plan',
    desc: 'The full master plan — roads, plot grid, and reserved amenity blocks.',
    icon: <LayoutGrid className="w-8 h-8" />,
  },
  location: {
    title: 'Location Map',
    desc: 'Where the project sits and how to reach it, with key landmarks marked.',
    icon: <MapIcon className="w-8 h-8" />,
  },
  brochure: {
    title: 'Project Brochure',
    desc: 'The complete overview — specifications, amenities, pricing, and terms.',
    icon: <BookOpen className="w-8 h-8" />,
  },
}

function docMetaFor(docType: string): { title: string; desc: string; icon: React.ReactNode } {
  const t = docType.toLowerCase()
  if (t.includes('layout')) return DOC_META.layout
  if (t.includes('location') || t.includes('map')) return DOC_META.location
  return DOC_META.brochure
}

/* UI-strings key for a document's (always-static) description, by docType. */
function docDescKey(docType: string): string {
  const t = docType.toLowerCase()
  if (t.includes('layout')) return 'projects.detail.docDescLayout'
  if (t.includes('location') || t.includes('map')) return 'projects.detail.docDescLocation'
  return 'projects.detail.docDescBrochure'
}

/* Fallback when the DB has no documents (offline / unreachable). */
const FALLBACK_DOCS: DisplayDoc[] = [
  { key: 'layout', docType: 'layout', ...DOC_META.layout, file: '#', viewable: true, gated: true },
  { key: 'location', docType: 'location', ...DOC_META.location, file: '#', viewable: true, gated: true },
  { key: 'brochure', docType: 'brochure', ...DOC_META.brochure, file: '#', viewable: true, gated: true },
]

function toDisplayDocs(project: PublicProject): DisplayDoc[] {
  const enabled = project.documents.filter((d) => d.enabled)
  if (enabled.length === 0) return FALLBACK_DOCS
  return enabled.map((d) => {
    const meta = docMetaFor(d.docType)
    return {
      key: d.id || d.docType,
      docType: d.docType,
      title: d.label || meta.title,
      desc: meta.desc,
      icon: meta.icon,
      file: d.fileUrl || '#',
      viewable: d.viewable,
      gated: d.gated,
    }
  })
}

/* Office area for the "pickup from our … office" line — first meaningful
   segment of the company address (skips house/road numbers). */
function officeAreaFrom(address: string): string {
  const parts = address.split(',').map((x) => x.trim()).filter(Boolean)
  const area = parts.find(
    (p) => !/^(house|road|plot|flat|level|floor|block)\b/i.test(p) && !/^\d/.test(p),
  )
  return area || parts[0] || 'Gulshan-2'
}

/* Plot-size <option>s derived from a "3 · 5 · 10 Katha" style string. */
function plotSizeOptions(plotSizes: string): string[] {
  const raw = plotSizes.split(/[·,]/).map((s) => s.trim()).filter(Boolean)
  if (raw.length === 0) return ['3 Katha', '5 Katha', '10 Katha']
  const last = raw[raw.length - 1]
  const unitMatch = last.match(/[a-zA-Z].*/)
  const unit = unitMatch ? unitMatch[0].trim() : ''
  return raw.map((r) => (/[a-zA-Z]/.test(r) ? r : unit ? `${r} ${unit}` : r))
}

const sections = [
  { id: 'overview', labelKey: 'projects.detail.navOverview' },
  { id: 'amenities', labelKey: 'projects.detail.navAmenities' },
  { id: 'location', labelKey: 'projects.detail.navLocation' },
  { id: 'gallery', labelKey: 'projects.detail.navGallery' },
  { id: 'downloads', labelKey: 'projects.detail.navDownloads' },
  { id: 'faq', labelKey: 'projects.detail.navFaq' },
]

/* ══════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════ */

export default function ProjectDetailPage({ slug, initialProject }: { slug: string; initialProject?: PublicProject }) {
  const t = useT()
  const s = useSiteSettings()
  /* Server-fetched (page.tsx already queried it for metadata/JSON-LD) — seed
     the shared cache so the hero renders real data on first paint instead of
     an empty state waiting on a client /api/projects/[slug] round-trip. */
  if (initialProject) seedProject(slug, initialProject)
  /* Current project renders from its dedicated DB endpoint (direct URL access
     works even if unpublished); only the related strip follows admin
     order/visibility. */
  const { project, loaded } = useProject(slug)
  const { projects: orderedSiteProjects } = useSiteProjectsOrdered()
  const relatedProjects = orderedSiteProjects.filter((p) => p.slug !== slug)

  const [activeSection, setActiveSection] = useState('overview')
  const [showMobileBar, setShowMobileBar] = useState(false)

  /* Doc lead-gate: one small ask, once, then everything is unlocked. */
  const [gate, setGate] = useState<{ doc: DisplayDoc; mode: 'download' | 'view' } | null>(null)

  const runDocAction = useCallback((doc: DisplayDoc, mode: 'download' | 'view') => {
    if (mode === 'view') {
      window.open(doc.file, '_blank', 'noopener')
    } else {
      const a = document.createElement('a')
      a.href = doc.file
      a.download = `${slug}-${doc.key}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  }, [slug])

  const requestDoc = useCallback(
    (doc: DisplayDoc, mode: 'download' | 'view') => {
      let unlocked = false
      try {
        unlocked = !!localStorage.getItem(DOC_LEAD_KEY)
      } catch {}
      if (unlocked) runDocAction(doc, mode)
      else setGate({ doc, mode })
    },
    [runDocAction],
  )

  /* Scroll spy + mobile bar visibility */
  useEffect(() => {
    const onScroll = () => {
      setShowMobileBar(window.scrollY > 500)
      let current = sections[0].id
      for (const sec of sections) {
        const el = document.getElementById(sec.id)
        if (el && el.getBoundingClientRect().top <= 160) current = sec.id
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  if (!loaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 text-[#A98B4F] animate-spin" />
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center px-6">
          <h1 className="font-heading text-4xl text-[#121814] mb-4">{t('projects.detail.notFoundTitle')}</h1>
          <p className="text-[#4A544E] mb-8">{t('projects.detail.notFoundBody')}</p>
          <Link href="/projects" className="btn-premium">
            {t('projects.detail.viewAllProjects')}
          </Link>
        </div>
      </main>
    )
  }

  const docs = toDisplayDocs(project)
  const brochureDoc = docs.find((d) => docMetaFor(d.docType) === DOC_META.brochure) ?? docs[0]
  const layoutDoc = docs.find((d) => docMetaFor(d.docType) === DOC_META.layout) ?? docs[0]
  const locationDoc = docs.find((d) => docMetaFor(d.docType) === DOC_META.location) ?? docs[0]
  const officeArea = officeAreaFrom(s.companyAddress)

  const waLink = getWhatsAppLink(
    s,
    t('projects.detail.waMessage')
      .replace('{company}', s.companyName.replace(/ LTD\.?$/i, ''))
      .replace('{project}', project.name),
  )

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* ── Hero ── */}
      <section className="relative h-[78vh] min-h-[540px] flex items-end overflow-hidden bg-[#0A120E]">
        <Image
          src={project.heroImage}
          alt={project.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL={shimmerBlurDataURL()}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,18,14,0.5) 0%, rgba(10,18,14,0.15) 40%, rgba(10,18,14,0.9) 100%)',
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[0.72rem] tracking-[0.08em] text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">{t('projects.detail.crumbHome')}</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/projects" className="hover:text-white transition-colors">{t('projects.detail.crumbProjects')}</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/85">{project.name}</span>
            </nav>

            <p className="text-[0.66rem] tracking-[0.32em] uppercase text-white/55 mb-4">
              {project.status} · {project.location}
            </p>

            {/* Project wordmark — on a white plate so the colours hold on photography */}
            <span className="inline-flex items-center bg-white px-4 py-3 mb-5">
              <img
                src={project.logo}
                alt={`${project.name} logo`}
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </span>

            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-normal text-white mb-4">
              {project.name}
            </h1>

            <p className="flex items-center gap-2 text-white/70 text-sm mb-2">
              <MapPin className="w-4 h-4 text-[#C7AE79]" />
              {project.location}
            </p>

            <p className="text-white/70 text-base sm:text-lg font-light max-w-xl mb-9">
              {project.tagline}
            </p>

            <div className="flex flex-wrap gap-3.5">
              <button
                className="btn-premium !bg-white !border-white !text-[#121814] hover:!bg-white/85"
                onClick={() => brochureDoc && requestDoc(brochureDoc, 'download')}
              >
                <Download className="w-4 h-4" />
                {t('projects.detail.getBrochure')}
              </button>
              <Link href="/site-visit" className="btn-premium-outline">
                {t('projects.detail.bookSiteVisit')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Spec ribbon ── */}
      <div className="bg-[#0A120E] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {project.specs.map((spec, i) => (
              <div
                key={spec.label}
                className={`py-6 md:py-7 px-2 text-center ${i > 0 ? 'md:border-l md:border-white/10' : ''}`}
              >
                <div className="text-[0.6rem] tracking-[0.26em] uppercase text-white/45 mb-1.5">
                  {spec.label}
                </div>
                <div className="font-heading text-lg md:text-xl text-white">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky section nav ── */}
      <div className="sticky top-16 md:top-20 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#121814]/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center overflow-x-auto scrollbar-none">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className={`relative shrink-0 px-4 py-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] transition-colors ${
                  activeSection === sec.id
                    ? 'text-[#121814]'
                    : 'text-[#707A72] hover:text-[#121814]'
                }`}
              >
                {t(sec.labelKey)}
                {activeSection === sec.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-[#A98B4F]" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => scrollTo('inquire')}
            className="hidden sm:inline-flex shrink-0 items-center px-5 py-2 text-[0.64rem] font-medium uppercase tracking-[0.16em] border border-[#121814] text-[#121814] hover:bg-[#121814] hover:text-white transition-colors"
          >
            {t('projects.detail.inquireNav')}
          </button>
        </div>
      </div>

      {/* ── Overview: editorial two-column ── */}
      <section id="overview" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7">
              <span className="eyebrow-plot eyebrow-plot-left mb-5">{t('projects.detail.overviewEyebrow')}</span>
              <h2 className="display-title mt-4 mb-6">
                {t('projects.detail.aboutPrefix')} <em className="font-normal">{project.name}</em>
              </h2>
              <RichText
                html={project.description}
                className="block text-[#4A544E] text-base sm:text-lg leading-relaxed font-light mb-10 max-w-2xl"
              />

              <ul className="check-list mb-14 max-w-xl">
                {project.highlights.map((h) => (
                  <li key={h.title}>
                    <span>
                      <strong>{h.title}</strong> — <RichText as="span" html={h.detail} />
                    </span>
                  </li>
                ))}
              </ul>

              {/* Development status — honest stages, no invented percentages */}
              <div className="border border-[#121814]/10 bg-white">
                <div className="px-6 py-4 border-b border-[#121814]/10 flex items-center justify-between">
                  <h3 className="font-heading text-lg text-[#121814]">{t('projects.detail.devStatusTitle')}</h3>
                  <span className="text-[0.6rem] tracking-[0.22em] uppercase text-[#707A72]">
                    {t('projects.detail.devStatusNote')}
                  </span>
                </div>
                <div>
                  {project.stages.map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center justify-between px-6 py-3.5 border-b border-dashed border-[#121814]/8 last:border-0"
                    >
                      <span className="text-[#4A544E] text-sm">{p.label}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[0.64rem] tracking-[0.14em] uppercase ${
                          p.stage === 'Complete'
                            ? 'text-[#1A5C33]'
                            : p.stage === 'Underway'
                              ? 'text-[#A98B4F]'
                              : 'text-[#707A72]'
                        }`}
                      >
                        {p.stage === 'Complete' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : p.stage === 'Underway' ? (
                          <CircleDashed className="w-3.5 h-3.5" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        {p.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky sidebar: spec ledger + fast callback */}
            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-40 space-y-6">
                <div className="border border-[#121814]/10 bg-white p-7">
                  <h3 className="font-heading text-lg text-[#121814] mb-4">{t('projects.detail.atAGlance')}</h3>
                  <dl>
                    {project.specs.map((spec) => (
                      <div key={spec.label} className="spec-row">
                        <dt>{spec.label}</dt>
                        <dd>{spec.value}</dd>
                      </div>
                    ))}
                    <div className="spec-row">
                      <dt>{t('projects.detail.specLocation')}</dt>
                      <dd className="!text-right">{project.location}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-col gap-2.5 mt-6">
                    <button
                      onClick={() => layoutDoc && requestDoc(layoutDoc, 'view')}
                      className="btn-premium-outline-light w-full !px-4"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      {t('projects.detail.viewLayoutPlan')}
                    </button>
                    <button
                      onClick={() => brochureDoc && requestDoc(brochureDoc, 'download')}
                      className="btn-premium w-full !px-4"
                    >
                      <Download className="w-4 h-4" />
                      {t('projects.detail.downloadBrochure')}
                    </button>
                  </div>
                </div>

                <CallbackCard projectSlug={project.slug} projectName={project.name} slaHours={s.slaHours} />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Amenities ── */}
      <section id="amenities" className="py-16 md:py-24 bg-[#F3F1EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="eyebrow-plot eyebrow-plot-left mb-5">{t('projects.detail.amenitiesEyebrow')}</span>
          <h2 className="display-title mt-4 mb-4">
            {t('projects.detail.amenitiesTitle')} <em className="font-normal">{t('projects.detail.amenitiesTitleEm')}</em>
          </h2>
          <p className="text-[#4A544E] font-light max-w-xl mb-12">
            {t('projects.detail.amenitiesIntro')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-[#121814]/10 border border-[#121814]/10">
            {project.amenities.map((a) => (
              <div
                key={a.label}
                className="bg-[#FAF9F6] p-6 flex flex-col items-start gap-3"
              >
                <span className="text-[#A98B4F]"><Icon name={a.icon} className="w-5 h-5" /></span>
                <span className="text-[#121814] text-sm">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location: real map image + distances ── */}
      <section id="location" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="eyebrow-plot eyebrow-plot-left mb-5">{t('projects.detail.locationEyebrow')}</span>
          <h2 className="display-title mt-4 mb-12">
            {t('projects.detail.locationTitle')} <em className="font-normal">{t('projects.detail.locationTitleEm')}</em>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <MapImageViewer src={project.mapImage} alt={`${project.name} location map`} />
              <p className="mt-3 text-[0.66rem] tracking-[0.18em] uppercase text-[#707A72]">
                {t('projects.detail.clickMapEnlarge')}
              </p>
            </div>

            <div className="lg:col-span-4">
              <div className="border border-[#121814]/10 bg-white p-7">
                <h3 className="font-heading text-lg text-[#121814] mb-1.5">{t('projects.detail.distancesTitle')}</h3>
                <p className="text-[#707A72] text-xs mb-4">{t('projects.detail.distancesNote')}</p>
                <dl>
                  {project.distances.map((d) => (
                    <div key={d.place} className="spec-row">
                      <dt className="!whitespace-normal">{d.place}</dt>
                      <dd>{d.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-col gap-2.5 mt-6">
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(project.mapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-premium-outline-light w-full !px-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('projects.detail.openGoogleMaps')}
                  </a>
                  <button
                    onClick={() => locationDoc && requestDoc(locationDoc, 'download')}
                    className="btn-premium-outline-light w-full !px-4"
                  >
                    <Download className="w-4 h-4" />
                    {t('projects.detail.downloadLocationMap')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="py-16 md:py-24 bg-[#F3F1EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="eyebrow-plot eyebrow-plot-left mb-5">{t('projects.detail.galleryEyebrow')}</span>
          <h2 className="display-title mt-4 mb-12">
            {t('projects.detail.galleryTitle')} <em className="font-normal">{t('projects.detail.galleryTitleEm')}</em>
          </h2>
          <GalleryGrid images={project.images} projectName={project.name} />
          <div className="mt-16">
            <VirtualTourSection />
          </div>
        </div>
      </section>

      {/* ── Downloads ── */}
      <section id="downloads" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="eyebrow-plot eyebrow-plot-left mb-5">{t('projects.detail.documentsEyebrow')}</span>
          <h2 className="display-title mt-4 mb-4">
            {t('projects.detail.documentsTitle')} <em className="font-normal">{t('projects.detail.documentsTitleEm')}</em>
          </h2>
          <p className="text-[#4A544E] font-light max-w-xl mb-12">
            {t('projects.detail.documentsIntro')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#121814]/10 border border-[#121814]/10">
            {docs.map((doc) => (
              <div key={doc.key} className="bg-[#FAF9F6] p-8 flex flex-col">
                <span className="text-[#A98B4F] mb-6">{doc.icon}</span>
                <h3 className="font-heading text-xl text-[#121814] mb-2">{doc.title}</h3>
                <p className="text-[#4A544E] text-sm font-light leading-relaxed mb-7 flex-1">
                  {t(docDescKey(doc.docType))}
                </p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => requestDoc(doc, 'view')}
                    className="btn-premium-outline-light flex-1 !px-3 !py-3"
                  >
                    <Eye className="w-4 h-4" />
                    {t('projects.detail.docView')}
                  </button>
                  <button
                    onClick={() => requestDoc(doc, 'download')}
                    className="btn-premium flex-1 !px-3 !py-3"
                  >
                    <Download className="w-4 h-4" />
                    {t('projects.detail.docDownload')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 md:py-24 bg-[#F3F1EB]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="eyebrow-plot mb-5 w-full justify-center">{t('projects.detail.faqEyebrow')}</span>
          <h2 className="display-title mt-4 mb-12 text-center">
            {t('projects.detail.faqTitle')} <em className="font-normal">{t('projects.detail.faqTitleEm')}</em>
          </h2>
          <FaqList faqs={project.faqs} />
        </div>
      </section>

      {/* ── Inquire ── */}
      <InquireSection project={project} slaHours={s.slaHours} />

      {/* ── Site visit band ── */}
      <section className="bg-[#0A120E] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl text-white mb-3">
              {t('projects.detail.visitBandTitle')} <em className="font-normal">{t('projects.detail.visitBandTitleEm')}</em>.
            </h2>
            <p className="text-white/55 font-light max-w-md">
              {t('projects.detail.visitBandBody1')} {officeArea} {t('projects.detail.visitBandBody2')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3.5 shrink-0">
            <Link href="/site-visit" className="btn-premium !bg-white !border-white !text-[#121814] hover:!bg-white/85">
              {t('projects.detail.bookSiteVisit')}
            </Link>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-premium-outline">
              <MessageCircle className="w-4 h-4" />
              {t('projects.detail.whatsappUs')}
            </a>
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      {relatedProjects.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="eyebrow-plot eyebrow-plot-left mb-5">{t('projects.detail.relatedEyebrow')}</span>
            <h2 className="display-title mt-4 mb-12">
              {t('projects.detail.relatedTitle')} <em className="font-normal">{t('projects.detail.relatedTitleEm')}</em>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {relatedProjects.map((rp) => (
                <Link key={rp.slug} href={`/projects/${rp.slug}`} className="group block">
                  <div className="relative h-64 sm:h-80 overflow-hidden">
                    <Image
                      src={rp.cardImage}
                      alt={rp.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
                      placeholder="blur"
                      blurDataURL={shimmerBlurDataURL()}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A120E]/60 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-6 right-6">
                      <h3 className="font-heading text-2xl text-white mb-1">{rp.name}</h3>
                      <p className="text-white/65 text-sm">{rp.location}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Mobile sticky action bar ── */}
      <AnimatePresence>
        {showMobileBar && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0A120E] border-t border-white/10 grid grid-cols-3"
          >
            <a
              href={getPhoneLink(s)}
              className="flex items-center justify-center gap-2 py-4 text-white text-[0.66rem] font-medium uppercase tracking-[0.14em]"
            >
              <Phone className="w-4 h-4 text-[#C7AE79]" />
              {t('projects.detail.mobileCall')}
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-4 text-white text-[0.66rem] font-medium uppercase tracking-[0.14em] border-x border-white/10"
            >
              <MessageCircle className="w-4 h-4 text-[#C7AE79]" />
              {t('projects.detail.mobileWhatsapp')}
            </a>
            <button
              onClick={() => brochureDoc && requestDoc(brochureDoc, 'download')}
              className="flex items-center justify-center gap-2 py-4 text-white text-[0.66rem] font-medium uppercase tracking-[0.14em]"
            >
              <Download className="w-4 h-4 text-[#C7AE79]" />
              {t('projects.detail.mobileBrochure')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Doc lead gate modal ── */}
      <DocGateModal
        gate={gate}
        projectName={project.name}
        projectSlug={project.slug}
        onClose={() => setGate(null)}
        onUnlocked={(doc, mode) => {
          setGate(null)
          runDocAction(doc, mode)
        }}
      />
    </main>
  )
}

/* ══════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════ */

/* Compact callback card — lowest-friction lead capture */
function CallbackCard({ projectSlug, projectName, slaHours }: { projectSlug: string; projectName: string; slaHours: string }) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error(t('projects.detail.toastNamePhone'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          projectId: projectSlug,
          source: 'project-callback',
          message: `Callback requested for ${projectName}`,
        }),
      })
      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || t('projects.detail.toastError'))
      }
    } catch {
      toast.error(t('projects.detail.toastNetwork'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0A120E] p-7">
      {done ? (
        <div className="text-center py-4">
          <Check className="w-6 h-6 text-[#C7AE79] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">{t('projects.detail.callbackDoneTitle')}</p>
          <p className="text-white/50 text-sm font-light">{t('projects.detail.callbackDonePrefix')} {slaHours} {t('projects.detail.workingHours')}</p>
        </div>
      ) : (
        <>
          <h3 className="font-heading text-lg text-white mb-1.5">{t('projects.detail.callbackTitle')}</h3>
          <p className="text-white/50 text-sm font-light mb-5">
            {t('projects.detail.callbackDescPrefix')} {slaHours} {t('projects.detail.workingHours')}
          </p>
          <form onSubmit={submit} className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('projects.detail.placeholderName')}
              required
              className="w-full bg-white/[0.06] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#C7AE79] focus:outline-none transition-colors"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={t('projects.detail.placeholderPhone')}
              type="tel"
              required
              className="w-full bg-white/[0.06] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#C7AE79] focus:outline-none transition-colors"
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('projects.detail.placeholderEmailOptional')}
              type="email"
              className="w-full bg-white/[0.06] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#C7AE79] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-premium !bg-white !border-white !text-[#121814] hover:!bg-white/85 w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              {t('projects.detail.requestCallback')}
            </button>
          </form>
          <p className="text-white/35 text-[0.68rem] mt-3.5 leading-relaxed">
            {t('projects.detail.callbackSpamPrefix')} {projectName}{t('projects.detail.callbackSpamSuffix')}
          </p>
        </>
      )}
    </div>
  )
}

/* Gallery grid with lightbox */
function GalleryGrid({ images, projectName }: { images: string[]; projectName: string }) {
  const t = useT()
  const [selected, setSelected] = useState<number | null>(null)
  const goPrev = () =>
    setSelected((s) => (s === null ? null : s === 0 ? images.length - 1 : s - 1))
  const goNext = () =>
    setSelected((s) => (s === null ? null : s === images.length - 1 ? 0 : s + 1))

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((img, i) => (
          <button
            key={img + i}
            onClick={() => setSelected(i)}
            className="relative h-64 md:h-80 overflow-hidden group cursor-zoom-in border border-[#121814]/10"
          >
            <Image
              src={img}
              alt={`${projectName} — photo ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
              placeholder="blur"
              blurDataURL={shimmerBlurDataURL()}
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setSelected(null)}
          >
            <div className="absolute inset-0 bg-black/90" />
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label={t('projects.detail.closeAria')}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="absolute left-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label={t('projects.detail.prevAria')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="absolute right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label={t('projects.detail.nextAria')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <motion.img
              key={selected}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              src={images[selected]}
              alt={`${projectName} — photo ${selected + 1}`}
              className="relative z-10 max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/60 text-sm">
              {selected + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* FAQ accordion — plain, quiet */
function FaqList({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="border-t border-[#121814]/10">
      {faqs.map((f, i) => (
        <div key={f.question} className="border-b border-[#121814]/10">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-6 py-5 text-left group"
          >
            <span className="font-heading text-lg text-[#121814] group-hover:text-[#1A5C33] transition-colors">
              {f.question}
            </span>
            <ChevronRight
              className={`w-4 h-4 shrink-0 text-[#A98B4F] transition-transform duration-300 ${
                open === i ? 'rotate-90' : ''
              }`}
            />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <RichText html={f.answer} className="text-[#4A544E] font-light leading-relaxed pb-6 pr-10" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

/* Full inquiry form — captures intent (plot size) with the lead */
function InquireSection({ project, slaHours }: { project: PublicProject; slaHours: string }) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [loading, setLoading] = useState(false)
  const plotOptions = plotSizeOptions(project.plotSizes)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    plotSize: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error(t('projects.detail.inquireToastNamePhone'))
      return
    }
    setLoading(true)
    try {
      const message = [
        form.plotSize ? `Interested plot size: ${form.plotSize}` : '',
        form.message,
      ]
        .filter(Boolean)
        .join('\n')
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message,
          projectId: project.slug,
          source: 'project-detail',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(`${t('projects.detail.inquireSuccessPrefix')} ${slaHours} ${t('projects.detail.workingHours')}`)
        setForm({ name: '', phone: '', email: '', plotSize: '', message: '' })
      } else {
        toast.error(data.error || t('projects.detail.toastError'))
      }
    } catch {
      toast.error(t('projects.detail.toastNetwork'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full bg-white border border-[#121814]/15 px-4 py-3 text-sm text-[#121814] placeholder:text-[#707A72]/60 focus:border-[#1A5C33] focus:outline-none transition-colors'

  return (
    <section id="inquire" ref={ref} className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-center mb-12">
            <span className="eyebrow-plot mb-5">{t('projects.detail.inquireEyebrow')}</span>
            <h2 className="display-title mt-4 mb-4">
              {t('projects.detail.inquireTitle')} <em className="font-normal">{project.name}</em>?
            </h2>
            <p className="text-[#4A544E] font-light">
              {t('projects.detail.inquireDescPrefix')} {slaHours} {t('projects.detail.workingHours')}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border border-[#121814]/10 bg-white p-7 md:p-10 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="inq-name" className="text-[0.68rem] tracking-[0.14em] uppercase text-[#707A72] mb-2 block">
                  {t('projects.detail.labelName')}
                </label>
                <input
                  id="inq-name"
                  placeholder={t('projects.detail.placeholderFullName')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label htmlFor="inq-phone" className="text-[0.68rem] tracking-[0.14em] uppercase text-[#707A72] mb-2 block">
                  {t('projects.detail.labelPhone')}
                </label>
                <input
                  id="inq-phone"
                  type="tel"
                  placeholder={t('projects.detail.placeholderPhone')}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="inq-email" className="text-[0.68rem] tracking-[0.14em] uppercase text-[#707A72] mb-2 block">
                  {t('projects.detail.labelEmail')}
                </label>
                <input
                  id="inq-email"
                  type="email"
                  placeholder={t('projects.detail.placeholderEmail')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="inq-size" className="text-[0.68rem] tracking-[0.14em] uppercase text-[#707A72] mb-2 block">
                  {t('projects.detail.labelPlotSize')}
                </label>
                <select
                  id="inq-size"
                  value={form.plotSize}
                  onChange={(e) => setForm({ ...form, plotSize: e.target.value })}
                  className={inputCls}
                >
                  <option value="">{t('projects.detail.optionNotSure')}</option>
                  {plotOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                  <option value="10+ Katha / Combined">{t('projects.detail.optionCombined')}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inq-message" className="text-[0.68rem] tracking-[0.14em] uppercase text-[#707A72] mb-2 block">
                {t('projects.detail.labelMessage')}
              </label>
              <textarea
                id="inq-message"
                placeholder={t('projects.detail.placeholderMessage')}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-premium w-full !py-4">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? t('projects.detail.submitting') : t('projects.detail.submitInquiry')}
            </button>
            <p className="text-[#707A72] text-[0.68rem] text-center leading-relaxed">
              {t('projects.detail.consentText')}
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  )
}

/* Lead-gate modal for documents — one small ask, then everything unlocks */
function DocGateModal({
  gate,
  projectName,
  projectSlug,
  onClose,
  onUnlocked,
}: {
  gate: { doc: DisplayDoc; mode: 'download' | 'view' } | null
  projectName: string
  projectSlug: string
  onClose: () => void
  onUnlocked: (doc: DisplayDoc, mode: 'download' | 'view') => void
}) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gate) return
    if (!form.name || !form.phone) {
      toast.error(t('projects.detail.toastNamePhone'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          projectId: projectSlug,
          source: 'document-download',
          message: `Requested ${gate.doc.title} — ${projectName}`,
        }),
      })
      if (res.ok) {
        try {
          localStorage.setItem(DOC_LEAD_KEY, 'true')
        } catch {}
        toast.success(t('projects.detail.gateUnlockedToast'))
        onUnlocked(gate.doc, gate.mode)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || t('projects.detail.toastError'))
      }
    } catch {
      toast.error(t('projects.detail.toastNetwork'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {gate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[#0A120E]/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-[#FAF9F6] p-8 md:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[#707A72] hover:text-[#121814] transition-colors"
              aria-label={t('projects.detail.closeAria')}
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[#A98B4F]">{gate.doc.icon}</span>
            <h3 className="font-heading text-2xl text-[#121814] mt-5 mb-2">
              {gate.doc.title}
            </h3>
            <p className="text-[#4A544E] text-sm font-light leading-relaxed mb-7">
              {t('projects.detail.gateDescPrefix')} {projectName} {t('projects.detail.gateDescSuffix')}
            </p>

            <form onSubmit={submit} className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('projects.detail.placeholderName')}
                required
                className="w-full bg-white border border-[#121814]/15 px-4 py-3 text-sm text-[#121814] placeholder:text-[#707A72]/60 focus:border-[#1A5C33] focus:outline-none transition-colors"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t('projects.detail.placeholderPhone')}
                type="tel"
                required
                className="w-full bg-white border border-[#121814]/15 px-4 py-3 text-sm text-[#121814] placeholder:text-[#707A72]/60 focus:border-[#1A5C33] focus:outline-none transition-colors"
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('projects.detail.placeholderEmailOptional')}
                type="email"
                className="w-full bg-white border border-[#121814]/15 px-4 py-3 text-sm text-[#121814] placeholder:text-[#707A72]/60 focus:border-[#1A5C33] focus:outline-none transition-colors"
              />
              <button type="submit" disabled={loading} className="btn-premium w-full">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : gate.mode === 'download' ? (
                  <Download className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {gate.mode === 'download' ? t('projects.detail.gateDownload') : t('projects.detail.gateView')}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
