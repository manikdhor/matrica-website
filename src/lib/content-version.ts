/**
 * Cross-route cache invalidation for the in-memory caches in the public
 * content APIs (hero-slides, gallery, team, testimonials, site-settings, …).
 *
 * Every authorized admin write bumps `lastBumpAt` (wired into
 * requirePermission). A public route's cached payload is only served when it
 * was stored *after* the last write — so an edit in the admin panel appears on
 * the next public request instead of waiting out the 60s TTL.
 *
 * The whole app runs as a single standalone Node process, so this module state
 * is shared between admin and public route handlers.
 */

let lastBumpAt = 0

// The bump is wired into requirePermission and fires at the START of a mutation
// handler — before the write actually commits to the (remote, ~0.5-1s) DB. A
// public GET that lands in that window would cache the pre-edit rows and, since
// they were stored *after* this bump, pass cacheValidSince and serve stale for
// the full TTL. A second delayed bump invalidates anything cached during the
// commit window so it self-heals within seconds instead of a minute.
const COMMIT_WINDOW_MS = 3_000

/** Mark all public content caches as stale as of now (and again shortly after). */
export function bumpContentVersion(): void {
  lastBumpAt = Date.now()
  const t = setTimeout(() => {
    lastBumpAt = Date.now()
  }, COMMIT_WINDOW_MS)
  // Don't keep the process alive just for a cache bump.
  if (typeof t.unref === 'function') t.unref()
}

/**
 * True when a cache entry stored at `storedAt` predates no admin write —
 * i.e. it is still safe to serve. Ties (same millisecond) resolve stale so a
 * write is never masked by a cache stored in the same tick.
 */
export function cacheValidSince(storedAt: number): boolean {
  return storedAt > lastBumpAt
}
