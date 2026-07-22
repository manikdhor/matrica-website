'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Play, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/use-ui-strings'
import { shimmerBlurDataURL } from '@/lib/blur-placeholder'

export default function VirtualTourSection() {
  const t = useT()
  const handleRequest = () => {
    toast.info(t('home.tour.toast'))
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#1E6B3A]/20 group">
      {/* Image container */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
        <Image
          src="/images/hero-bg.webp"
          alt="Virtual Tour Preview"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          placeholder="blur"
          blurDataURL={shimmerBlurDataURL()}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-500" />

        {/* Play button */}
        <button
          onClick={handleRequest}
          className="absolute inset-0 flex items-center justify-center z-10"
          aria-label={t('home.tour.playAria')}
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-3 rounded-full bg-[#1E6B3A]/20 blur-md" />
            {/* Main button */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1E6B3A] flex items-center justify-center hover:bg-[#1E6B3A]/90 transition-colors">
              <Play className="w-7 h-7 md:w-8 md:h-8 text-[#FFFFFF] ml-1" fill="currentColor" />
            </div>
          </motion.div>
        </button>

        {/* Coming Soon badge */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-[#1E6B3A]/20">
          <Lock className="w-3 h-3 text-[#1E6B3A]" />
          <span className="text-xs font-medium text-[#1E6B3A]">{t('home.tour.badge')}</span>
        </div>
      </div>

      {/* Text content */}
      <div className="p-5 md:p-6 bg-[#FFFFFF] border-t border-[#1E6B3A]/10">
        <h3 className="text-lg md:text-xl font-bold text-[#1A202C] mb-1">
          {t('home.tour.heading')}
        </h3>
        <p className="text-sm text-[#475569] mb-4">
          {t('home.tour.sub')}
        </p>
        <button
          onClick={handleRequest}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#1E6B3A]/10 text-[#1E6B3A] border border-[#1E6B3A]/20 hover:bg-[#1E6B3A]/20 hover:border-[#1E6B3A]/40 transition-all"
        >
          <Lock className="w-4 h-4" />
          {t('home.tour.request')}
        </button>
      </div>
    </div>
  )
}