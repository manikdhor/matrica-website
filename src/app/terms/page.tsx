import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import TermsPage from "@/components/TermsPage"

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/terms',
    title: `Terms & Conditions | ${name}`,
    description: `Read the terms and conditions for ${name}'s real estate services and property purchases.`,
  })
}

export default function Page() {
  return <TermsPage />
}