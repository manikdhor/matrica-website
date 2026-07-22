import type { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'
import { buildPageMetadata } from '@/lib/seo'
import { getSiteSettings } from '@/app/api/site-settings/route'
import { getHeroSlides } from '@/lib/hero-slides'
import { getContentSectionsMap } from '@/lib/content-sections-data'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return buildPageMetadata({
    path: '/',
    title: `${s.companyName} | Premium Land Developer in Dhaka`,
    description:
      s.seoDescription ||
      `${s.companyName} develops master-planned residential plots in Purbachal, Dhaka — planned in line with RAJUK policy, beside RAJUK Purbachal New Town, with verifiable documentation and transparent pricing.`,
  })
}

// ISR — matches the 60s in-memory cache TTL in hero-slides.ts/site-settings
// so a static prod build (this app's deploy model) still picks up admin
// edits within a minute instead of staying frozen until the next redeploy.
export const revalidate = 60

export default async function Home() {
  // Server-fetched so the first hero image is in the initial HTML — the
  // browser preloads it immediately instead of waiting for hydration + a
  // client /api/hero-slides round-trip (the old dark-flash-then-image).
  const heroSlides = await getHeroSlides()
  const contentSections = await getContentSectionsMap()
  return <HomeClient heroSlides={heroSlides} initialContentSections={contentSections} />
}
