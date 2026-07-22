import type { Metadata } from "next"
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import PrivacyPage from "@/components/PrivacyPage"

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/privacy',
    title: `Privacy Policy | ${name}`,
    description: `Read ${name}'s privacy policy. Learn how we collect, use, and protect your personal information.`,
  })
}

export default function Page() {
  return <PrivacyPage />
}