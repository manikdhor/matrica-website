import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata, stripHtml, clampDescription } from '@/lib/seo'
import { getPublishedProjectBySlug } from '@/lib/projects-data'
import JsonLd from '@/components/JsonLd'
import ProjectDetailPage from '@/components/ProjectDetailPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const s = await getSiteSettings()
  const p = await getPublishedProjectBySlug(slug)
  // Fall back to a title-cased slug when the project isn't in the DB yet.
  const name = p?.name || slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const desc =
    clampDescription(p?.summary || p?.tagline || p?.description || '') ||
    `Discover ${name} by ${s.companyName}. Residential plots in ${p?.location || 'Purbachal, Dhaka'}, planned in line with RAJUK policy, beside RAJUK Purbachal New Town, with modern amenities.`
  return buildPageMetadata({
    path: `/projects/${slug}`,
    title: `${name} | ${s.companyName}`,
    description: desc,
    ogImage: p?.heroImage || p?.cardImage || undefined,
  })
}

// ISR — matches the 60s in-memory cache TTL in projects-data.ts.
export const revalidate = 60

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const s = await getSiteSettings()
  const p = await getPublishedProjectBySlug(slug)

  const jsonLd = p
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: stripHtml(p.summary || p.tagline || p.description || '') || undefined,
        image: p.heroImage || p.cardImage || undefined,
        brand: { '@type': 'Brand', name: s.companyName },
        category: 'Residential Land',
        ...(p.location || p.address
          ? {
              areaServed: {
                '@type': 'Place',
                name: p.location || p.address,
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: p.address || undefined,
                  addressLocality: p.location || 'Dhaka',
                  addressCountry: 'BD',
                },
              },
            }
          : {}),
        ...(p.priceStart || p.priceRange
          ? {
              offers: {
                '@type': 'Offer',
                priceCurrency: 'BDT',
                price: p.priceStart || undefined,
                ...(p.priceRange ? { description: p.priceRange } : {}),
                availability: 'https://schema.org/InStock',
                url: `${s.siteUrl}/projects/${slug}`,
              },
            }
          : {}),
      }
    : null

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <ProjectDetailPage slug={slug} initialProject={p ?? undefined} />
    </>
  )
}
