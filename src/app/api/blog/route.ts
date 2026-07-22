import { NextResponse } from 'next/server'
import { getPublishedBlogList } from '@/lib/blog-data'

export type { PublicBlogPost, PublicBlogListPayload } from '@/lib/blog-data'

export async function GET() {
  return NextResponse.json(await getPublishedBlogList())
}
