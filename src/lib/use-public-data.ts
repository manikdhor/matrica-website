'use client'

import { useState, useEffect } from 'react'

/**
 * Generic module-level cached fetcher for public content APIs.
 * Same pattern as use-site-settings / use-menu: one shared fetch per URL,
 * 60s stale time, all consumers re-render when data arrives.
 *
 * Returns `data: null` while loading or when the request fails —
 * components keep their hardcoded fallback content in that case.
 * `loaded` becomes true once a fetch attempt has completed (ok or not).
 */

interface CacheEntry {
  data: unknown
  time: number
  loaded: boolean
  promise: Promise<void> | null
}

const cache = new Map<string, CacheEntry>()
const STALE_TIME = 60_000 // 1 minute

function getEntry(url: string): CacheEntry {
  let entry = cache.get(url)
  if (!entry) {
    entry = { data: null, time: 0, loaded: false, promise: null }
    cache.set(url, entry)
  }
  return entry
}

/**
 * Seed the cache with server-fetched data (same pattern as seedSiteSettings).
 * Called during render of a client component that received the payload as a
 * server-component prop — consumers see `loaded: true` with real data on the
 * very first render (SSR and hydration), so nothing waits on a client fetch.
 */
export function seedPublicData(url: string, data: unknown): void {
  const entry = getEntry(url)
  entry.data = data
  entry.time = Date.now()
  entry.loaded = true
}

export function usePublicData<T>(url: string): { data: T | null; loaded: boolean } {
  const [, setTick] = useState(0)

  useEffect(() => {
    const entry = getEntry(url)
    const now = Date.now()
    // Fresh cached data — nothing to do
    if (entry.loaded && now - entry.time < STALE_TIME) return

    // Deduplicate concurrent fetches
    if (!entry.promise) {
      entry.promise = (async () => {
        try {
          const res = await fetch(url)
          entry.data = res.ok ? await res.json() : null
        } catch {
          entry.data = null
        }
        entry.time = Date.now()
        entry.loaded = true
        entry.promise = null
      })()
    }

    entry.promise.then(() => setTick(t => t + 1))
  }, [url])

  const entry = cache.get(url)
  return {
    data: (entry?.data ?? null) as T | null,
    loaded: entry?.loaded ?? false,
  }
}
