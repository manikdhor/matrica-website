'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Smooths the route swap itself — the outgoing page fades out over 80ms
 * before the new one mounts, instead of an instant hard cut. 80ms is below
 * the ~100ms threshold where a delay reads as sluggish, so this buys the
 * smoothing without a perceptible speed cost. The incoming page pops in at
 * full opacity immediately (`initial={false}`) so it doesn't double up with
 * each page's own `.page-enter` CSS entrance animation.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.08, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
