'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, X } from 'lucide-react'
import { useT } from '@/lib/use-ui-strings'
import { shimmerBlurDataURL } from '@/lib/blur-placeholder'

/**
 * Location map image with click-to-enlarge lightbox.
 * Shared by the homepage location section and the project detail page.
 * Images live at public/images/maps/<slug>-location-map.webp — replace
 * the placeholder with the real map under the same name.
 */
export default function MapImageViewer({ src, alt }: { src: string; alt: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative block w-full aspect-[16/10] overflow-hidden border border-[#121814]/10 bg-white group cursor-zoom-in"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
          placeholder="blur"
          blurDataURL={shimmerBlurDataURL()}
        />
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-[#0A120E]/85 text-white text-[0.62rem] tracking-[0.16em] uppercase px-3.5 py-2">
          <Eye className="w-3.5 h-3.5" />
          {t('projects.map.enlarge')}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/90" />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label={t('projects.map.closeAria')}
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={src}
              alt={alt}
              className="relative z-10 max-w-[95vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
