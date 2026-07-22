'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import { shimmerBlurDataURL } from '@/lib/blur-placeholder'
import type { PublicGalleryPayload } from '@/app/api/gallery/route'

/* 5 unique images — mosaic: 2×2 hero tile + 4 singles fills the grid exactly */
const galleryImages = [
  { src: '/images/project-chandrachaya-v2.webp', name: 'Chandra Chaya', category: 'Aerial', large: true },
  { src: '/images/project-ventura.webp', name: 'Ventura City', category: 'Entrance' },
  { src: '/images/project-greenvalley.webp', name: 'Green Corridors', category: 'Landscape' },
  { src: '/images/project-riverside.webp', name: 'Lakeside Plots', category: 'Development' },
  { src: '/images/gallery-event.webp', name: 'Handover Ceremony', category: 'Community' },
]

export default function GalleryPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const t = useT()

  // DB-driven gallery (admin-managed) — hardcoded mosaic stays as fallback.
  // Flatten enabled items across enabled categories, first 5 fill the mosaic.
  const { data } = usePublicData<PublicGalleryPayload>('/api/gallery')

  // Section header copy — admin-managed via the `gallery_preview` content
  // section (subtitle = eyebrow, title = heading); literals stay as fallback.
  const { data: cs } =
    usePublicData<Record<string, { title?: string; subtitle?: string; content?: string }>>('/api/content-sections')
  const gp = cs?.gallery_preview
  const dbImages = (data?.categories ?? [])
    .flatMap((cat) =>
      cat.items
        .filter((item) => item.fileUrl && item.mediaType !== 'video')
        .map((item) => ({
          src: item.fileUrl as string,
          name: item.title || item.caption || cat.name,
          category: cat.name,
        }))
    )
    .slice(0, 5)
    .map((img, i) => ({ ...img, large: i === 0 }))

  const images = dbImages.length > 0 ? dbImages : galleryImages

  return (
    <section id="gallery" className="py-24 md:py-32 bg-[#FBFAF7]" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 md:mb-20"
        >
          <span className="eyebrow-plot mb-5">
            {gp?.subtitle ?? 'The Land'}
          </span>
          <h2 className="display-title mt-4">
            {gp?.title ? (
              gp.title
            ) : (
              <>
                See what we&apos;re <span className="accent-word">building</span>
              </>
            )}
          </h2>
        </motion.div>

        {/* Mosaic grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] sm:auto-rows-[220px] gap-4 md:gap-5">
          {images.map((image, index) => (
            <motion.div
              key={`${image.src}-${index}`}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className={image.large ? 'col-span-2 row-span-2' : ''}
            >
              <Link
                href="/gallery"
                className="group relative block w-full h-full overflow-hidden rounded-xl"
              >
                <Image
                  src={image.src}
                  alt={image.name}
                  fill
                  sizes={image.large ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1024px) 50vw, 25vw'}
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.05]"
                  placeholder="blur"
                  blurDataURL={shimmerBlurDataURL()}
                  // Admin gallery URLs can point anywhere — only same-origin
                  // assets go through the image optimizer
                  unoptimized={!image.src.startsWith('/')}
                />
                {/* Duotone-toward-brand hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071410]/70 via-[#071410]/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="font-data text-[0.55rem] tracking-[0.2em] uppercase text-[#C7AE79] mb-1">
                    {image.category}
                  </p>
                  <p className="text-white font-medium text-sm sm:text-base">
                    {image.name}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-14"
        >
          <Link href="/gallery" className="btn-premium-outline-light">
            {t('home.gallery.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
