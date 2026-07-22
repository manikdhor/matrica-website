import path from 'node:path'

/**
 * Root directory for uploaded media (images, documents).
 *
 * Deliberately OUTSIDE .next/ and public/ so uploads survive rebuilds and
 * are never bundled — media is stored on the server's own disk (no Supabase
 * Storage; the project stays inside the Supabase free tier which is used for
 * Postgres only). Files are served back through /api/uploads/[...path].
 *
 * - dev:        <project-root>/upload
 * - standalone: server may run with cwd = .next/standalone — strip the
 *               suffix so both modes resolve to the same folder
 * - override:   UPLOAD_DIR env var (absolute path) wins
 */
export function getUploadRoot(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR
  let base = process.cwd()
  const marker = path.join('.next', 'standalone')
  if (base.endsWith(marker)) {
    base = base.slice(0, base.length - marker.length - 1)
  }
  return path.join(base, 'upload')
}
