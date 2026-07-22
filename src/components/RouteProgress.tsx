'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Slim top-of-page progress bar for client-side navigations — the App Router
 * gives no built-in "navigation started" signal, so we start the bar on an
 * internal-link click (capture phase) and finish it when the pathname settles.
 *
 * Brand-gradient, GPU-only transforms, and it self-hides at rest, so it costs
 * nothing until the user actually navigates. Honors reduced-motion via the
 * global switch already applied on <html data-anim>.
 */
export default function RouteProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (trickle.current) {
      clearInterval(trickle.current)
      trickle.current = null
    }
  }

  // Start the bar when the user clicks a link that will navigate in-app.
  useEffect(() => {
    const start = () => {
      clearTimers()
      setActive(true)
      setProgress(8)
      // Ease toward 90% while the route loads; never reach 100 until complete.
      trickle.current = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.max(0.5, (90 - p) * 0.12) : p))
      }, 200)
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      const target = anchor.getAttribute('target')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (target && target !== '_self') return
      if (anchor.hasAttribute('download')) return
      // External URL → real browser navigation, no SPA transition to track.
      try {
        const url = new URL(href, window.location.href)
        if (url.origin !== window.location.origin) return
        if (url.pathname === window.location.pathname && url.search === window.location.search) return
      } catch {
        return
      }
      start()
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  // Pathname changed → navigation finished. Snap to full, then fade out.
  useEffect(() => {
    if (!active) return
    clearTimers()
    setProgress(100)
    timers.current.push(
      setTimeout(() => setActive(false), 250),
      setTimeout(() => setProgress(0), 500),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => clearTimers, [])

  if (!active && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[200] h-[3px] pointer-events-none"
    >
      <div
        className="h-full origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: active ? 1 : 0,
          transition: 'transform 200ms ease-out, opacity 300ms ease-out',
          background:
            'linear-gradient(90deg, var(--brand, #1E6B3A), var(--gold, #C9A24B), var(--brand, #1E6B3A))',
          boxShadow: '0 0 8px rgba(201,162,75,0.5)',
        }}
      />
    </div>
  )
}
