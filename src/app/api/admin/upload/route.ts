import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { requireAuth } from '@/lib/admin-auth'
import { getUploadRoot } from '@/lib/upload-dir'

export const runtime = 'nodejs'

// Raster formats we downscale/recompress once at upload time. Doing it here
// (a one-time CPU cost) means the LVE-capped host never re-encodes per request
// and every visitor downloads a sized image instead of a multi-MB original.
const RESIZABLE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const MAX_DIMENSION = 1920 // px, longest edge

/** Downscale + recompress a raster image buffer. Returns the original on failure. */
async function optimizeImage(buf: Buffer, ext: string): Promise<Buffer> {
  // Hard kill-switch for hosts where sharp cannot run at all. On the CloudLinux
  // shared host the prebuilt libvips SIGABRTs (glibc too old) and — because the
  // Turbopack build treats sharp as an external module — a failed `import('sharp')`
  // throws in a way the try/catch below does NOT catch, so it 500s every upload
  // instead of falling back to the original. When DISABLE_IMAGE_OPTIMIZE=1 we
  // never touch sharp: uploads succeed and just store the original bytes
  // (images are served unoptimized, which is the same as this host already did).
  if (process.env.DISABLE_IMAGE_OPTIMIZE === '1') return buf
  try {
    // Imported lazily: on a host where the libvips binary is missing, a
    // top-level import would fail module init and 500 every upload. Here it
    // only costs the optimization step.
    const sharp = (await import('sharp')).default
    // The host is CloudLinux LVE-capped on threads and memory; libvips' default
    // thread pool and tile cache are enough to get the process killed mid-upload.
    sharp.concurrency(1)
    sharp.cache(false)
    const img = sharp(buf, { failOn: 'none' }).rotate() // honor EXIF orientation
    const meta = await img.metadata()
    if ((meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION) {
      img.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    }
    if (ext === '.png') return await img.png({ compressionLevel: 9 }).toBuffer()
    if (ext === '.webp') return await img.webp({ quality: 82 }).toBuffer()
    if (ext === '.avif') return await img.avif({ quality: 55 }).toBuffer()
    return await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
  } catch {
    return buf // never block an upload on optimization
  }
}

// Extension allowlist + max size. SVG excluded on purpose (XSS vector when
// served inline). Media lives on the server disk — no Supabase Storage.
const ALLOWED_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}
const MAX_BYTES = 15 * 1024 * 1024 // 15MB

function safeBaseName(original: string): string {
  const ext = path.extname(original).toLowerCase()
  const stem = path
    .basename(original, path.extname(original))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file'
  // Random suffix prevents collisions and filename guessing
  const suffix = crypto.randomBytes(4).toString('hex')
  return `${stem}-${suffix}${ext}`
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof Response) return auth

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'multipart/form-data body required' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field required' }, { status: 400 })
  }

  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED_EXT[ext]) {
    return NextResponse.json(
      { error: `File type not allowed. Allowed: ${Object.keys(ALLOWED_EXT).join(', ')}` },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 })
  }

  // Group by month so the folder never grows unbounded in one directory
  const now = new Date()
  const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const name = safeBaseName(file.name)
  const root = getUploadRoot()
  const dir = path.join(root, folder)

  try {
    await mkdir(dir, { recursive: true })
    let buf = Buffer.from(await file.arrayBuffer())
    if (RESIZABLE.has(ext)) buf = await optimizeImage(buf, ext)
    await writeFile(path.join(dir, name), buf)
  } catch (err) {
    // The generic message hid the cause (EACCES vs ENOSPC vs ENOENT) and made
    // prod upload failures undebuggable. Log the real error, return the code.
    const code = (err as NodeJS.ErrnoException)?.code
    console.error('[upload] write failed', { root, dir, code, err })
    return NextResponse.json(
      { error: `Failed to write file to disk${code ? ` (${code})` : ''}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, url: `/api/uploads/${folder}/${name}` })
}
