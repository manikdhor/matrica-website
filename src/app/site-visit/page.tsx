import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import SiteVisitPage from '@/components/SiteVisitPage'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/site-visit',
    title: `Book a Site Visit | ${name}`,
    description: `Schedule a free site visit to ${name}'s projects in Purbachal, Dhaka — beside RAJUK Purbachal New Town. Walk the land before you decide.`,
  })
}

export default function Page() {
  return <SiteVisitPage />
}