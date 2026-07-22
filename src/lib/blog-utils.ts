/** Shared helpers for the public blog API routes. */

/** Estimate reading time from HTML content (~200 wpm). */
export function estimateReadTime(html: string | null): string {
  if (!html) return '3 min read'
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}
