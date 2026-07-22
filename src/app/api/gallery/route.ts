import { NextResponse } from 'next/server'
import { getGalleryPayload } from '@/lib/gallery-data'

export type { PublicGalleryItem, PublicGalleryCategory, PublicGalleryPayload } from '@/lib/gallery-data'

export async function GET() {
  return NextResponse.json(await getGalleryPayload())
}
