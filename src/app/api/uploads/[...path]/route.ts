import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = segments.join('/')

  // Vercel has a read-only filesystem. Redirect to the static file in /public.
  // Vercel's global CDN will handle caching and serving the image perfectly.
  return NextResponse.redirect(new URL(`/uploads/${filePath}`, request.url))
}