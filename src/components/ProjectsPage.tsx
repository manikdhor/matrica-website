'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import {
  MapPin,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  Home,
  Route,
  TreePine,
  Shield,
  Scale,
  Search,
  X,
  Building2,
  Activity,
  Clock,
  LayoutGrid,
  List,
  CalendarCheck,
} from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { CompareProjects } from '@/components/CompareProjects'
import PageHero from '@/components/PageHero'
import { useSiteProjectsOrdered, seedProjects, type PublicProject } from '@/lib/use-projects'
import { usePublicData, seedPublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import { shimmerBlurDataURL } from '@/lib/blur-placeholder'

interface Project {
  name: string
  slug: string
  status: string
  tagline: string
  location: string
  image: string
  logo: string
  highlights: { icon: React.ReactNode; label: string }[]
  statusColor: string
}

/* Derived from the DB-backed projects contract (src/lib/use-projects.ts) —
   published projects appear here in admin order; visibility and order are
   admin-controlled (static fallback when the DB is unavailable). */
const highlightIcons = [
  <MapPin key="a" className="w-4 h-4" />,
  <Home key="b" className="w-4 h-4" />,
  <Route key="c" className="w-4 h-4" />,
  <CheckCircle key="d" className="w-4 h-4" />,
]

const toCardProjects = (list: PublicProject[]): Project[] => list.map((p) => ({
  name: p.name,
  slug: p.slug,
  status: p.status,
  tagline: p.tagline,
  location: p.location,
  image: p.cardImage,
  logo: p.logo,
  statusColor: 'bg-[#1A5C33]/15 text-[#1A5C33] border-[#1A5C33]/25',
  highlights: p.cardHighlights.map((label, i) => ({
    icon: highlightIcons[i % highlightIcons.length],
    label,
  })),
}))

/* Tab set derived from the statuses actually present in the projects.
   Labels are resolved through the UI-strings system at render time. */
const KNOWN_STATUS_TABS = [
  { value: 'ongoing', labelKey: 'projects.list.tabOngoing' },
  { value: 'upcoming', labelKey: 'projects.list.tabUpcoming' },
  { value: 'ready', labelKey: 'projects.list.tabReady' },
  { value: 'completed', labelKey: 'projects.list.tabCompleted' },
]

type ContentSections = Record<string, { title?: string; subtitle?: string; content?: string; image?: string; config?: string }>

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
  }),
}

export default function ProjectsPage({
  initialProjects,
  initialContentSections,
}: {
  initialProjects?: unknown
  initialContentSections?: unknown
} = {}) {
  if (initialProjects) seedProjects(initialProjects)
  if (initialContentSections) seedPublicData('/api/content-sections', initialContentSections)
  return <Suspense fallback={<div className="min-h-screen" />}><ProjectsPageContent /></Suspense>
}

function ProjectsPageContent() {
  const t = useT()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const searchParams = useSearchParams()
  const searchType = searchParams.get('type') || ''
  const searchBudget = searchParams.get('budget') || ''
  const gridRef = useRef<HTMLDivElement>(null)
  const gridInView = useInView(gridRef, { once: true, margin: '-60px' })
  const { projects: orderedSiteProjects } = useSiteProjectsOrdered()
  const projects = useMemo(() => toCardProjects(orderedSiteProjects), [orderedSiteProjects])
  const { data: cs } = usePublicData<ContentSections>('/api/content-sections')
  const heroCopy = cs?.['projects_hero']
  const ctaCopy = cs?.['projects_cta']

  const statusTabs = useMemo(() => {
    const present = new Set(projects.map((p) => p.status.toLowerCase()))
    return [
      { value: 'all', label: t('projects.list.tabAll') },
      ...KNOWN_STATUS_TABS.filter((tab) => present.has(tab.value)).map((tab) => ({
        value: tab.value,
        label: t(tab.labelKey),
      })),
    ]
  }, [projects, t])

  const handleToggleCompare = (slug: string) => {
    setSelectedProjects((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3
          ? [...prev, slug]
          : prev
    )
  }

  const handleClearAll = () => setSelectedProjects([])

  const filteredProjects = projects
    .filter((p) => activeTab === 'all' || p.status.toLowerCase() === activeTab)
    .filter((p) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.highlights.some((h) => h.label.toLowerCase().includes(q))
      )
    })

  const ongoingCount = projects.filter((p) => p.status === 'Ongoing').length
  const upcomingCount = projects.filter((p) => p.status === 'Upcoming').length

  return (
    <main className="min-h-screen page-enter bg-[#FBFAF7]">
      {/* Chapter opener */}
      <PageHero
        plotNo="Sheet 01"
        eyebrow={heroCopy?.subtitle ?? 'Our Projects'}
        title={
          heroCopy?.title ?? (
            <>
              Two addresses.
              <br />
              One <span className="accent-word-gold">standard</span>.
            </>
          )
        }
        subtitle={heroCopy?.content ?? "Residential land developments in Dhaka's most promising locations — planned in line with RAJUK policy, beside RAJUK Purbachal New Town."}
      />

      {/* Search Bar */}
      <section className="py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Params Filter Indicator */}
          {(searchType || searchBudget) && (
            <div className="mb-6 flex items-center justify-center gap-2 flex-wrap">
              <span className="font-data text-[0.62rem] tracking-[0.18em] uppercase text-[#6B776E]">{t('projects.list.filtersLabel')}</span>
              {searchType && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1E6B3A]/10 text-[#1E6B3A] text-xs font-medium">
                  {searchType === 'residential' ? t('projects.list.typeResidential') : searchType === 'commercial' ? t('projects.list.typeCommercial') : searchType}
                </span>
              )}
              {searchBudget && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1E6B3A]/10 text-[#1E6B3A] text-xs font-medium">
                  {t('projects.list.budgetPrefix')} {searchBudget.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              )}
              <Link href="/projects" className="text-xs text-[#6B776E] hover:text-[#1E6B3A] transition-colors underline">{t('projects.list.clearFilters')}</Link>
            </div>
          )}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A564E] pointer-events-none" />
            <input
              type="text"
              placeholder={t('projects.list.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-border rounded-xl pl-12 pr-10 py-3.5 text-sm text-[#131B16] placeholder:text-[#6B776E]/60 focus:outline-none focus:border-[#1E6B3A] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#FFFFFF] border border-border flex items-center justify-center text-[#4A564E] hover:text-[#131B16] hover:border-[#1E6B3A]/30 transition-colors"
                aria-label={t('projects.list.clearSearchAria')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stats Overview Row */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 flex-wrap">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-border text-sm">
              <Building2 className="w-4 h-4 text-[#1E6B3A]" />
              <span className="text-[#131B16] font-medium">{projects.length} {t('projects.list.statProjects')}</span>
            </span>
            <span className="text-[#1E6B3A]/40 text-xs">◆</span>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-border text-sm">
              <Activity className="w-4 h-4 text-[#1E6B3A]" />
              <span className="text-[#131B16] font-medium">{ongoingCount} {t('projects.list.statOngoing')}</span>
            </span>
            <span className="text-[#1E6B3A]/40 text-xs">◆</span>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-border text-sm">
              <Clock className="w-4 h-4 text-[#1E6B3A]" />
              <span className="text-[#131B16] font-medium">{upcomingCount} {t('projects.list.statUpcoming')}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Tab Filter + Project Grid */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs + View Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full max-w-2xl"
            >
              <TabsList className="bg-[#FFFFFF] border border-border p-1 mx-auto w-full flex">
                {statusTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'flex-1 data-[state=active]:bg-[#1E6B3A]/15 data-[state=active]:text-[#1E6B3A] data-[state=active]:border-[#1E6B3A]/30 text-[#4A564E] hover:text-[#131B16] transition-all rounded-md text-sm'
                    )}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#FFFFFF] border border-border rounded-lg p-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-md transition-all',
                  viewMode === 'grid'
                    ? 'bg-[#1E6B3A]/15 text-[#1E6B3A]'
                    : 'text-[#4A564E] hover:text-[#131B16]'
                )}
                aria-label={t('projects.list.gridViewAria')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-md transition-all',
                  viewMode === 'list'
                    ? 'bg-[#1E6B3A]/15 text-[#1E6B3A]'
                    : 'text-[#4A564E] hover:text-[#131B16]'
                )}
                aria-label={t('projects.list.listViewAria')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search result count */}
          {searchQuery.trim() && (
            <p className="text-[#4A564E] text-sm mb-6">
              {t('projects.list.showing')}{' '}
              <span className="text-[#1E6B3A] font-medium">{filteredProjects.length}</span> {t('projects.list.showingOf')}{' '}
              <span className="text-[#131B16]">{projects.length}</span> {t('projects.list.showingProjects')}
            </p>
          )}

          {/* Project Grid */}
          <div ref={gridRef}>
            {filteredProjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <div className="w-20 h-20 rounded-full bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-[#1E6B3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /></svg>
                </div>
                <p className="text-[#1E6B3A] text-lg font-medium mb-2">
                  {t('projects.list.emptyTitle')}{searchQuery ? t('projects.list.emptyTitleSearch') : t('projects.list.emptyTitleCategory')}
                </p>
                <p className="text-[#4A564E] text-sm mb-6">
                  {searchQuery
                    ? t('projects.list.emptyBodySearch')
                    : t('projects.list.emptyBodyCategory')}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/30 text-[#1E6B3A] text-sm font-medium hover:bg-[#1E6B3A]/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {t('projects.list.clearSearch')}
                    </button>
                  )}
                  {activeTab !== 'all' && (
                    <button
                      onClick={() => setActiveTab('all')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFFFFF] border border-border text-[#131B16] text-sm font-medium hover:border-[#1E6B3A]/30 transition-colors"
                    >
                      {t('projects.list.clearFiltersBtn')}
                    </button>
                  )}
                  <Link
                    href="/projects"
                    onClick={() => { setActiveTab('all'); setSearchQuery('') }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFFFFF] border border-border text-[#4A564E] text-sm hover:text-[#131B16] hover:border-[#1E6B3A]/30 transition-colors"
                  >
                    {t('projects.list.viewAllProjects')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                {activeTab !== 'all' && (
                  <div className="mt-8">
                    <p className="text-[#4A564E] text-xs mb-3">{t('projects.list.tryCategories')}</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {['all', 'ongoing', 'upcoming'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs border transition-colors',
                            activeTab === tab
                              ? 'bg-[#1E6B3A]/15 border-[#1E6B3A]/30 text-[#1E6B3A]'
                              : 'bg-[#FFFFFF] border-border text-[#4A564E] hover:text-[#131B16] hover:border-[#1E6B3A]/30'
                          )}
                        >
                          {tab === 'all' ? t('projects.list.tabAll') : tab === 'ongoing' ? t('projects.list.tabOngoing') : t('projects.list.tabUpcoming')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div
                className={cn(
                  'transition-all duration-300',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'flex flex-col gap-4'
                )}
              >
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.slug}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate={gridInView ? 'visible' : 'hidden'}
                  >
                    <Link href={`/projects/${project.slug}`}>
                      <div
                        className={cn(
                          'premium-card-accent group rounded-xl overflow-hidden flex relative',
                          viewMode === 'grid' ? 'flex-col h-full' : 'flex-row h-52'
                        )}
                      >
                        {/* Image */}
                        <div className={cn(
                          'relative overflow-hidden img-parallax-hover shrink-0',
                          viewMode === 'grid' ? 'h-56' : 'w-64 md:w-80'
                        )}>
                          <Image
                            src={project.image}
                            alt={project.name}
                            fill
                            sizes={viewMode === 'grid' ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw' : '320px'}
                            className="project-card-image object-cover"
                            placeholder="blur"
                            blurDataURL={shimmerBlurDataURL()}
                          />
                          {/* Shimmer overlay on hover */}
                          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-transparent to-transparent z-[2]" />
                          <div className="absolute top-3 left-3 z-[3]">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs font-medium px-2.5 py-0.5 backdrop-blur-sm',
                                project.statusColor
                              )}
                            >
                              {project.status}
                            </Badge>
                          </div>
                          {/* Compare Toggle Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleToggleCompare(project.slug)
                            }}
                            className={cn(
                              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all duration-200 z-10',
                              selectedProjects.includes(project.slug)
                                ? 'bg-[#1E6B3A] border-[#1E6B3A] text-[#FFFFFF]'
                                : 'bg-[#FFFFFF]/60 border-border text-[#4A564E] hover:border-[#1E6B3A]/50 hover:text-[#1E6B3A]',
                              selectedProjects.length === 0 && !selectedProjects.includes(project.slug)
                                ? 'pulse-glow-gold'
                                : ''
                            )}
                            aria-label={`${t('projects.list.compareAria')} ${project.name}`}
                          >
                            <Scale className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className={cn(
                          'p-5 flex flex-col',
                          viewMode === 'grid' ? 'flex-1' : 'flex-1 justify-center'
                        )}>
                          {/* Project wordmark */}
                          <span className="self-start inline-flex items-center bg-white border border-[#121814]/10 px-3 py-2 mb-3">
                            <img
                              src={project.logo}
                              alt={`${project.name} logo`}
                              className="h-7 w-auto object-contain"
                              loading="lazy"
                            />
                          </span>

                          <h3 className={cn(
                            'font-heading font-bold text-[#131B16] mb-1 group-hover:text-[#1E6B3A] transition-colors',
                            viewMode === 'grid' ? 'text-xl' : 'text-lg'
                          )}>
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[#4A564E] text-sm mb-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>{project.location}</span>
                          </div>
                          <p className="text-[#4A564E] text-sm mb-3">
                            {project.tagline}
                          </p>

                          {/* Highlights */}
                          <div className={cn(
                            'space-y-2 mb-5',
                            viewMode === 'grid' ? 'flex-1' : 'flex-1 max-h-24 overflow-hidden'
                          )}>
                            {project.highlights.map((h, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-[#131B16]/80"
                              >
                                <span className="text-[#1E6B3A]">{h.icon}</span>
                                <span>{h.label}</span>
                              </div>
                            ))}
                          </div>

                          {/* Action Row */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[#1E6B3A] text-sm font-medium group-hover:gap-3 transition-all">
                              {t('projects.list.viewDetails')}
                              <ArrowRight className="w-4 h-4" />
                            </div>
                            {/* span, not Link — anchors cannot nest inside the card anchor */}
                            <span
                              role="link"
                              tabIndex={0}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push('/site-visit') }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); router.push('/site-visit') } }}
                              className="inline-flex items-center gap-1.5 text-[#4A564E] text-xs hover:text-[#1E6B3A] transition-colors cursor-pointer"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              {t('projects.list.bookVisit')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Quick CTA */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="premium-card rounded-xl p-8 text-center">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-[#131B16] mb-2">
                  {ctaCopy?.title ?? "Can't find what you're looking for?"}
                </h3>
                <RichText
                  className="text-[#4A564E] text-sm mb-5"
                  html={ctaCopy?.content ?? 'Contact our team for personalized recommendations'}
                />
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-[#1E6B3A] text-sm font-medium hover:gap-3 transition-all"
                >
                  {t('projects.list.ctaLink')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Compare Button + Dialog */}
      <CompareProjects
        selectedProjects={selectedProjects}
        onToggleProject={handleToggleCompare}
        onClearAll={handleClearAll}
      />
    </main>
  )
}