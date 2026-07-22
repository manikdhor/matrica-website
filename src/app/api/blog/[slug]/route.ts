import { NextResponse } from 'next/server'
import { getPublishedBlogBySlug } from '@/lib/blog-data'

export type { PublicBlogPostDetail, PublicBlogPostPayload } from '@/lib/blog-data'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  return NextResponse.json(await getPublishedBlogBySlug(slug))
}
