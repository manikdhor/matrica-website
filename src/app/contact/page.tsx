import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import { getContentSectionsMap } from '@/lib/content-sections-data'
import ContactPage from '@/components/ContactPage'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/contact',
    title: `Contact Us | ${name}`,
    description: `Get in touch with ${name}. Visit our office in Gulshan-2, Dhaka or call us for premium plot inquiries in Purbachal.`,
  })
}

// ISR — matches the 60s in-memory cache TTL in content-sections-data.ts.
export const revalidate = 60

export default async function Contact() {
  const contentSections = await getContentSectionsMap()
  return <ContactPage initialContentSections={contentSections} />
}