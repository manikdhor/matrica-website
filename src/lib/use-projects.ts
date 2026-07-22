'use client'

import { useState, useEffect } from 'react'
import { FALLBACK_PROJECTS, type PublicProject } from '@/lib/project-shape'

export type { PublicProject } from '@/lib/project-shape'

export interface OrderedProjects {
  /** All published projects, ordered by admin sortOrder. */
  projects: PublicProject[]
  /** Subset flagged featured (falls back to the ordered list when none). */
  featured: PublicProject[]
}

function toOrdered(rows: unknown): OrderedProjects {
  if (!Array.isArray(rows) || rows.length === 0)
    return { projects: FALLBACK_PROJECTS, featured: FALLBACK_PROJECTS }
  const projects = rows as PublicProject[]
  const featured = projects.filter((p) => p.featured)
  return { projects, featured: featured.length > 0 ? featured : projects }
}

// Module-level singleton — shared across all components
let shared: OrderedProjects | null = null
let sharedPromise: Promise<OrderedProjects> | null = null
let fetchTime = 0
const STALE_TIME = 60_000

/**
 * Seed the shared cache with server-fetched projects (same pattern as
 * seedSiteSettings/seedPublicData). Call during render of a client component
 * that received the list as a server-component prop — consumers see real
 * data on the very first render (SSR and hydration), no client fetch wait.
 */
export function seedProjects(rows: unknown): void {
  shared = toOrdered(rows)
  fetchTime = Date.now()
}

// Per-slug cache for useProject — same seeding pattern.
const projectCache = new Map<string, PublicProject>()
const projectFetchTime = new Map<string, number>()

export function seedProject(slug: string, project: PublicProject): void {
  projectCache.set(slug, project)
  projectFetchTime.set(slug, Date.now())
}

async function fetchProjects(): Promise<OrderedProjects> {
  try {
    const res = await fetch('/api/projects')
    if (!res.ok) return { projects: FALLBACK_PROJECTS, featured: FALLBACK_PROJECTS }
    return toOrdered(await res.json())
  } catch {
    return { projects: FALLBACK_PROJECTS, featured: FALLBACK_PROJECTS }
  }
}

/** Full published projects in admin order + featured subset. Shared cache. */
export function useSiteProjectsOrdered(): OrderedProjects {
  const [, setTick] = useState(0)

  useEffect(() => {
    const now = Date.now()
    if (shared && now - fetchTime < STALE_TIME) return
    if (!sharedPromise) {
      sharedPromise = fetchProjects().then((data) => {
        shared = data
        fetchTime = Date.now()
        sharedPromise = null
        setTick((t) => t + 1)
        return data
      })
    }
    sharedPromise.then(() => setTick((t) => t + 1))
  }, [])

  return shared || { projects: FALLBACK_PROJECTS, featured: FALLBACK_PROJECTS }
}

/** Single project by slug (dedicated endpoint; unpublished direct-URL works). */
export function useProject(slug: string): { project: PublicProject | null; loaded: boolean } {
  const seeded = projectCache.get(slug)
  const seededFresh = seeded && Date.now() - (projectFetchTime.get(slug) ?? 0) < STALE_TIME
  const [state, setState] = useState<{ project: PublicProject | null; loaded: boolean }>(
    seededFresh ? { project: seeded, loaded: true } : { project: null, loaded: false }
  )

  useEffect(() => {
    const fresh = projectCache.has(slug) && Date.now() - (projectFetchTime.get(slug) ?? 0) < STALE_TIME
    if (fresh) {
      setState({ project: projectCache.get(slug) ?? null, loaded: true })
      return
    }
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`)
        const project = res.ok ? ((await res.json()) as PublicProject) : FALLBACK_PROJECTS.find((p) => p.slug === slug) ?? null
        if (project) { projectCache.set(slug, project); projectFetchTime.set(slug, Date.now()) }
        if (alive) setState({ project, loaded: true })
      } catch {
        if (alive) setState({ project: FALLBACK_PROJECTS.find((p) => p.slug === slug) ?? null, loaded: true })
      }
    })()
    return () => { alive = false }
  }, [slug])

  return state
}
