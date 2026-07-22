import type { Metadata } from "next"
import { db } from '@/lib/db'
import { getSiteSettings } from '@/app/api/site-settings/route'
import { buildPageMetadata, stripHtml } from '@/lib/seo'
import JsonLd from '@/components/JsonLd'
import FAQPage from '@/components/FAQPage'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const name = s.companyName
  return buildPageMetadata({
    path: '/faq',
    title: `FAQ | ${name}`,
    description: `Find answers to frequently asked questions about ${name}'s land plots, payment plans, RAJUK approval, site visits, and more.`,
  })
}

/** FAQPage structured data — the canonical /faq surface for answer engines. */
async function getFaqJsonLd() {
  try {
    const faqs = await db.fAQ.findMany({
      where: { enabled: true, status: 'active' },
      orderBy: { sortOrder: 'asc' },
      select: { question: true, answer: true },
    })
    if (!faqs.length) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.answer) },
      })),
    }
  } catch {
    return null
  }
}

export default async function Page() {
  const jsonLd = await getFaqJsonLd()
  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <FAQPage />
    </>
  )
}
