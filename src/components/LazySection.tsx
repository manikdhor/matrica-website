'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Defers mounting (and therefore chunk download + hydration) of a below-fold
 * section until the viewport approaches it. Renders a fixed-height placeholder
 * until then — the generous rootMargin means the swap happens well below the
 * visible viewport, so it never registers as layout shift.
 */
export default function LazySection({
  children,
  minHeight = 480,
}: {
  children: React.ReactNode
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (show) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '700px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [show])

  if (show) return <>{children}</>
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />
}
