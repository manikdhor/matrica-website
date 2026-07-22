'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useSiteSettings } from '@/lib/use-site-settings'
import { useT } from '@/lib/use-ui-strings'

const ANNOUNCEMENT_DISMISSED_KEY = 'matrica-announcement-dismissed'

export default function AnnouncementBar() {
  // Visible by default so the bar is in the SSR HTML and never pushes
  // content down after hydration (CLS). Dismissal only ever hides it.
  const [visible, setVisible] = useState(true)
  const s = useSiteSettings()
  const t = useT()

  useEffect(() => {
    if (sessionStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY)) {
      setVisible(false)
    }
  }, [])

  function handleDismiss() {
    sessionStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY, 'true')
    setVisible(false)
  }

  if (!visible || !s.announcementEnabled || !s.announcementText) return null

  // Static, calm strip — no marquee. One message, centered, dismissible.
  const content = (
    <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide truncate">
      {s.announcementText}
    </span>
  )

  return (
    <div className="relative h-9 bg-[#0C271B] flex items-center justify-center px-10 mt-16 md:mt-20">
      <span className="hidden sm:block w-5 h-px bg-[#A98B4F]/50 mr-3" />
      {s.announcementLink ? (
        <a href={s.announcementLink} className="hover:underline underline-offset-2 min-w-0">
          {content}
        </a>
      ) : (
        content
      )}
      <span className="hidden sm:block w-5 h-px bg-[#A98B4F]/50 ml-3" />

      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={t('home.announcement.dismissAria')}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}