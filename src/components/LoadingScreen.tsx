'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSiteSettings } from '@/lib/use-site-settings'
import { useT } from '@/lib/use-ui-strings'

const SEEN_KEY = 'matrica-loading-seen'

export default function LoadingScreen() {
  const s = useSiteSettings()
  const t = useT()
  const tagline = s.companyTagline.split(' in ')[1] || s.companyTagline || 'Premium Land Developer'
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Once per session — repeat views (and client-side navs) skip straight in
    if (sessionStorage.getItem(SEEN_KEY)) {
      setVisible(false)
      return
    }
    sessionStorage.setItem(SEEN_KEY, '1')
    const timer = setTimeout(() => setVisible(false), 900)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] bg-[#FFFFFF] flex flex-col items-center justify-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <span className="text-3xl font-bold tracking-wider text-gradient-animated">
              {t('chrome.loading.wordmark')}
            </span>
            <p className="text-[#475569] text-xs tracking-[0.3em] uppercase mt-2">
              {tagline}
            </p>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="h-[2px] rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #1E6B3A, #166B34, #1E6B3A, transparent)',
            }}
          />

          {/* Gold dot pulse */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            className="mt-6 w-2 h-2 rounded-full bg-[#1E6B3A] pulse-glow-gold"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}