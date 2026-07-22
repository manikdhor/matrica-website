import { NextRequest } from 'next/server'

// Best-effort in-memory rate limiter (per process). Sufficient for a
// single-instance deployment; swap for a shared store (Redis) if scaled out.
declare global {
  var __rateLimitStore: Map<string, { count: number; resetAt: number }> | undefined
}
const store = globalThis.__rateLimitStore ?? new Map()
globalThis.__rateLimitStore = store

// Number of trusted reverse proxies in front of the app (cPanel/Apache/Passenger
// terminates and appends the real client IP as the LAST hop of X-Forwarded-For).
// Never trust the left-most value — it is client-supplied and lets an attacker
// mint a fresh rate-limit bucket per request by spoofing the header.
const TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? '1')

export function getClientIp(req: NextRequest | Request): string {
  const h = req.headers
  // x-real-ip is set by the proxy itself and cannot be spoofed past it.
  const real = h.get('x-real-ip')
  if (real) return real.trim()
  const fwd = h.get('x-forwarded-for')
  if (fwd) {
    const parts = fwd.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length) {
      // Take the hop just before our trusted proxies (right side of the list).
      const idx = Math.max(0, parts.length - TRUSTED_PROXY_HOPS)
      return parts[idx] ?? parts[parts.length - 1]
    }
  }
  return 'unknown'
}

/**
 * Fixed-window limiter. Returns { ok, remaining, retryAfter(seconds) }.
 * @param key   unique bucket key (e.g. `login:${ip}`)
 * @param limit max requests per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): {
  ok: boolean
  remaining: number
  retryAfter: number
} {
  const now = Date.now()
  // Opportunistic sweep (~1% of calls) so spoofed/one-off keys don't accumulate.
  if (store.size > 1000 && (now & 127) === 0) sweepRateLimit()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { ok: true, remaining: limit - entry.count, retryAfter: 0 }
}

// Opportunistic cleanup so the map does not grow unbounded.
export function sweepRateLimit(): void {
  const now = Date.now()
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k)
  }
}
