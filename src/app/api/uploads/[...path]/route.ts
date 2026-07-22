import { NextRequest, NextResponse } from 'next/server'
import { stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import path from 'node:path'
import { getUploadRoot } from '@/lib/upload-dir'

export const runtime = 'nodejs'

// Public read-side of the local-disk media store (see /api/admin/upload).
const CONTENT_TYPES: Record<string, string> = {
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

function streamFile(filePath: string, start?: number, end?: number): ReadableStream {
  const nodeStream = createReadStream(filePath, start !== undefined ? { start, end } : undefined)
  // Node Readable -> Web ReadableStream (Node runtime).
  return Readable.toWeb(nodeStream) as unknown as ReadableStream
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const root = getUploadRoot()
  const filePath = path.resolve(root, ...segments)

  // Path traversal guard — resolved path must stay inside the upload root
  if (!filePath.startsWith(path.resolve(root) + path.sep)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()]
  if (!contentType) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let info
  try {
    info = await stat(filePath)
    if (!info.isFile()) throw new Error('not a file')
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const lastModified = info.mtime.toUTCString()
  const etag = `"${info.size}-${info.mtimeMs}"`

  // Conditional request — cheap 304 when the client already has it.
  const ifNoneMatch = request.headers.get('if-none-match')
  const ifModifiedSince = request.headers.get('if-modified-since')
  if (
    (ifNoneMatch && ifNoneMatch === etag) ||
    (ifModifiedSince && new Date(ifModifiedSince).getTime() >= Math.floor(info.mtimeMs / 1000) * 1000)
  ) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, 'Last-Modified': lastModified, 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  }

  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    ETag: etag,
    'Last-Modified': lastModified,
    // Filenames carry a random suffix, so contents are effectively immutable.
    'Cache-Control': 'public, max-age=31536000, immutable',
  }

  // Range request (video seeking, resumable downloads) — serve 206 partial.
  const range = request.headers.get('range')
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
    if (match) {
      const size = info.size
      let start = match[1] ? parseInt(match[1], 10) : 0
      let end = match[2] ? parseInt(match[2], 10) : size - 1
      if (Number.isNaN(start)) start = 0
      if (Number.isNaN(end) || end >= size) end = size - 1
      if (start > end || start >= size) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' },
        })
      }
      return new NextResponse(streamFile(filePath, start, end), {
        status: 206,
        headers: {
          ...baseHeaders,
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Content-Length': String(end - start + 1),
        },
      })
    }
  }

  return new NextResponse(streamFile(filePath), {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(info.size) },
  })
}
