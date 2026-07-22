import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import { getGalleryPayload } from '@/lib/gallery-data'
import { getContentSectionsMap } from '@/lib/content-sections-data'
import GalleryPage from '@/components/GalleryPage'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/gallery',
    title: `Gallery | ${name}`,
    description: "View our project gallery — construction progress, events, and completed developments in Purbachal, Dhaka.",
  })
}

// ISR — matches the 60s in-memory cache TTL in gallery-data.ts.
export const revalidate = 60

// Server-fetched so the masonry grid renders real images on first paint
// instead of waiting on a client /api/gallery round-trip.
export default async function Gallery() {
  const [gallery, contentSections] = await Promise.all([
    getGalleryPayload(),
    getContentSectionsMap(),
  ])
  return <GalleryPage initialGallery={gallery} initialContentSections={contentSections} />
}