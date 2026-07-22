'use client'

import { useState, useEffect } from 'react'
import {
  DEFAULT_HEADER_MENU,
  DEFAULT_FOOTER_MENU,
  type PublicMenuItem,
} from '@/lib/menu-defaults'

export interface PublicMenu {
  header: PublicMenuItem[]
  footer: PublicMenuItem[]
}

const DEFAULTS: PublicMenu = {
  header: DEFAULT_HEADER_MENU,
  footer: DEFAULT_FOOTER_MENU,
}

// Module-level singleton — shared across all components (same pattern as use-site-settings)
let sharedMenu: PublicMenu | null = null
let sharedPromise: Promise<PublicMenu> | null = null
let fetchTime = 0
const STALE_TIME = 60_000 // 1 minute

async function fetchMenu(): Promise<PublicMenu> {
  try {
    const res = await fetch('/api/menu')
    if (!res.ok) return DEFAULTS
    const data = await res.json()
    return {
      header: Array.isArray(data?.header) && data.header.length > 0 ? data.header : DEFAULTS.header,
      footer: Array.isArray(data?.footer) && data.footer.length > 0 ? data.footer : DEFAULTS.footer,
    }
  } catch {
    return DEFAULTS
  }
}

/**
 * React hook to access the site menu (header + footer links).
 * Uses a module-level cache so multiple components share one fetch.
 * Returns hardcoded defaults until loaded / on failure.
 */
export function useMenu(): PublicMenu {
  const [, setTick] = useState(0)

  useEffect(() => {
    const now = Date.now()
    // If we have fresh cached data, use it
    if (sharedMenu && now - fetchTime < STALE_TIME) return

    // Deduplicate concurrent fetches
    if (!sharedPromise) {
      sharedPromise = fetchMenu().then(data => {
        sharedMenu = data
        fetchTime = Date.now()
        sharedPromise = null
        setTick(t => t + 1) // re-render all consumers
        return data
      })
    }

    sharedPromise.then(() => setTick(t => t + 1))
  }, [])

  return sharedMenu || DEFAULTS
}

export function seedMenu(menu: PublicMenu): void {
  sharedMenu = menu
  fetchTime = Date.now()
}
