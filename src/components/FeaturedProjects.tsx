'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, MapPin } from 'lucide-react'
import { useSiteProjectsOrdered, type PublicProject } from '@/lib/use-projects'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import { shimmerBlurDataURL } from '@/lib/blur-placeholder'

/* DB-backed — the admin panel controls which projects are featured and
   their order (falls back to the bundled defaults when the DB is
   unavailable). See src/lib/use-projects.ts. */

type ContentSections = Record<string, { title?: string; subtitle?: string; content?: string; image?: string; config?: string }>

function ProjectRow({
  project,
  index,
}: {
  project: PublicProject
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const t = useT()
  const reversed = index % 2 === 1

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
    >
      {/* Image — the bigger voice */}
      <Link
        href={`/projects/${project.slug}`}
        className={`group relative block lg:col-span-7 ${reversed ? 'lg:order-2' : ''}`}
      >
        <div className="corner-ticks relative overflow-hidden rounded-2xl">
          <div className="relative h-72 sm:h-96 lg:h-[480px] overflow-hidden">
            <Image
              src={project.cardImage}
              alt={project.name}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
              placeholder="blur"
              blurDataURL={shimmerBlurDataURL()}
            />
            {/* Grade toward brand */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#071410]/45 via-transparent to-transparent" />
          </div>

          {/* Status chip */}
          <span className="absolute top-5 left-5 font-data text-[0.6rem] tracking-[0.2em] uppercase text-white bg-[#1E6B3A]/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {project.status}
          </span>

          {/* Plot label — bottom left, surveyor voice */}
          <span className="absolute bottom-5 left-5 font-data text-[0.62rem] tracking-[0.24em] uppercase text-[#C7AE79]">
            {t('home.featured.plotLabel')}&thinsp;0{index + 1}&ensp;·&ensp;{t('home.featured.plotArea')}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className={`lg:col-span-5 ${reversed ? 'lg:order-1' : ''}`}>
        {/* Project wordmark on a quiet white plate */}
        <span className="inline-flex items-center bg-white border border-[#121814]/10 px-3.5 py-2.5 mb-5">
          <img
            src={project.logo}
            alt={`${project.name} logo`}
            className="h-8 sm:h-9 w-auto object-contain"
            loading="lazy"
          />
        </span>

        <h3 className="font-heading text-3xl sm:text-4xl font-bold text-[#131B16] mb-3">
          <Link
            href={`/projects/${project.slug}`}
            className="hover:text-[#1E6B3A] transition-colors duration-300"
          >
            {project.name}
          </Link>
        </h3>

        <p className="flex items-center gap-1.5 text-[#4A564E] text-sm mb-5">
          <MapPin className="w-3.5 h-3.5 text-[#1E6B3A]" />
          {project.location}
        </p>

        <p className="text-[#4A564E] text-base leading-relaxed mb-7 max-w-md">
          {project.tagline}
        </p>

        {/* Spec ledger — mono data voice */}
        <dl className="mb-8 max-w-sm">
          {project.specs.map((spec) => (
            <div key={spec.label} className="spec-row">
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>

        <Link href={`/projects/${project.slug}`} className="link-premium">
          {t('home.featured.viewPrefix')} {project.name}
          <ArrowRight className="w-4 h-4 link-arrow" />
        </Link>
      </div>
    </motion.div>
  )
}

export default function FeaturedProjects() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const { featured: projects } = useSiteProjectsOrdered()
  const { data: cs } = usePublicData<ContentSections>('/api/content-sections')
  const header = cs?.['featured_projects']

  return (
    <section
      id="projects"
      className="relative py-24 md:py-36 bg-[#FBFAF7]"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="eyebrow-plot mb-5">
            {header?.subtitle ?? 'Our Projects'}
          </span>
          <h2 className="display-title mt-4">
            {header?.title ?? (
              <>
                Every address.
                <br />
                One <em className="font-normal">standard</em>.
              </>
            )}
          </h2>
        </motion.div>

        {/* Editorial rows */}
        <div className="space-y-20 md:space-y-28">
          {projects.map((project, index) => (
            <ProjectRow key={project.slug} project={project} index={index} />
          ))}
        </div>

        {/* View all */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-16 md:mt-20"
        >
          <Link href="/projects" className="btn-premium-outline-light">
            {header?.content ?? 'View All Projects'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
