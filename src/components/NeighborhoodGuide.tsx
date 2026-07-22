'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useSiteProjectsOrdered } from '@/lib/use-projects'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import { Icon } from '@/lib/icons'
import MapImageViewer from './MapImageViewer'

type ContentSections = Record<string, { title?: string; subtitle?: string; content?: string; image?: string; config?: string }>

/**
 * Homepage location section — one tab per project (scales automatically
 * as projects are added). Each tab shows that project's real location-map
 * image (click to enlarge) and landmark drive-time ledger, all DB-backed.
 */
export default function NeighborhoodGuide() {
  const ref = useRef<HTMLDivElement>(null)
  const t = useT()
  const { projects: siteProjects } = useSiteProjectsOrdered()
  const { data: cs } = usePublicData<ContentSections>('/api/content-sections')
  const header = cs?.['neighborhood_guide']
  const [activeSlug, setActiveSlug] = useState(siteProjects[0]?.slug ?? '')
  const project = siteProjects.find((p) => p.slug === activeSlug) ?? siteProjects[0]

  return (
    <section className="py-24 md:py-32 bg-[#FAF9F6]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <span className="eyebrow-plot mb-5">{header?.subtitle ?? 'The Location'}</span>
          <h2 className="display-title mt-4">
            {header?.title ?? (
              <>
                Everything you need,
                <br />
                <em className="font-normal">within reach</em>
              </>
            )}
          </h2>
        </div>

        {/* Project switcher — one tab per project, scales automatically */}
        <div className="flex items-center justify-center mb-12 md:mb-16">
          <div className="inline-flex border border-[#121814]/15">
            {siteProjects.map((p) => (
              <button
                key={p.slug}
                onClick={() => setActiveSlug(p.slug)}
                className={`px-6 sm:px-8 py-3 text-[0.66rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                  p.slug === activeSlug
                    ? 'bg-[#0A120E] text-white'
                    : 'bg-transparent text-[#707A72] hover:text-[#121814]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Location map image — switches with the active project */}
          <div className="lg:col-span-7">
            <MapImageViewer
              key={project.slug}
              src={project.mapImage}
              alt={`${project.name} location map`}
            />
            <p className="mt-3 text-[0.66rem] tracking-[0.18em] uppercase text-[#707A72]">
              {t('home.neighborhood.clickMap')}
            </p>
          </div>

          {/* Amenity ledger — keyed remount on project switch */}
          <div className="lg:col-span-5">
            <div
              key={project.slug}
            >
              <p className="text-[#4A544E] leading-relaxed font-light mb-8 max-w-md">
                {project.name}{t('home.neighborhood.introSuffix')}
              </p>

              <ul>
                {project.landmarks.map((a, i) => (
                  <li
                    key={a.name}
                    className="group flex items-center gap-4 py-3.5 border-b border-dashed border-[#121814]/10 last:border-b-0"
                  >
                    <span className="flex-shrink-0 w-9 h-9 border border-[#121814]/10 bg-white flex items-center justify-center text-[#A98B4F]">
                      <Icon name={a.icon} className="w-4 h-4" />
                    </span>
                    <span className="text-[#121814] text-sm flex-1">{a.name}</span>
                    <span className="font-data text-[#1A5C33] text-xs tracking-[0.12em] group-hover:text-[#A98B4F] transition-colors duration-300">
                      {a.minutes} {t('home.neighborhood.minutes')}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/projects/${project.slug}#location`}
                className="inline-flex items-center gap-2 mt-8 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[#121814] border-b border-[#A98B4F] pb-1 hover:text-[#1A5C33] transition-colors"
              >
                {t('home.neighborhood.explorePrefix')} {project.name}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
