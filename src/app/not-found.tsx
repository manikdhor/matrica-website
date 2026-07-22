import type { Metadata } from 'next'
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata } from '@/lib/seo'
import NotFoundContent from '@/components/NotFoundContent'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return buildPageMetadata({
    path: '/404',
    title: `Page Not Found | ${s.companyName}`,
    description: 'The page you are looking for does not exist. Browse our projects or return to the homepage.',
  })
}

export default function NotFound() {
  return <NotFoundContent />
}