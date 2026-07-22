'use client'

import { useEffect, useState } from 'react'

/**
 * Mounts children only after the main thread goes idle (or a short timeout).
 * For floating widgets — chat, back-to-top, cookie banner — whose hydration
 * has no business competing with first paint.
 */
export default function DeferUntilIdle({
  children,
  timeoutMs = 2500,
}: {
  children: React.ReactNode
  /** Max wait before forcing mount even if the main thread never goes idle. */
  timeoutMs?: number
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => setReady(true), { timeout: timeoutMs })
      return () => cancelIdleCallback(id)
    }
    const t = setTimeout(() => setReady(true), Math.min(timeoutMs, 1500))
    return () => clearTimeout(t)
  }, [timeoutMs])

  return ready ? <>{children}</> : null
}
