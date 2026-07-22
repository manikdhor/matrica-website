import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import AboutPage from '@/components/AboutPage'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/about',
    title: `About Us | ${name}`,
    description: `Learn about ${name} — a Dhaka-based land developer building master-planned communities in Purbachal, planned in line with RAJUK policy, beside RAJUK Purbachal New Town.`,
  })
}

export default function About() {
  return <AboutPage />
}