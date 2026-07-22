'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { useSiteSettings } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import type { PublicFaqsPayload } from '@/app/api/faqs/route'

const faqItems = [
  {
    question: 'Are the projects planned according to RAJUK rules?',
    answer:
      "Yes. Chandra Chaya and Ventura City are planned in line with RAJUK's policies and sit within the RAJUK Purbachal New Town corridor. Because each project's land is bought in the company's own name, your registered deed (দলিল), mutation (নামজারি) and khatian papers are handed over after payment.",
  },
  {
    question: 'What plot sizes are available?',
    answer:
      'We offer residential plots in 3 Katha, 5 Katha, and 10 Katha sizes across both our projects. Custom combinations are also available for larger requirements.',
  },
  {
    question: 'Do you offer installment payment plans?',
    answer:
      'Absolutely! We offer flexible EMI plans with 0% interest for up to 36 months. You can also choose from our down payment options starting from just 20% of the total price.',
  },
  {
    question: 'How do I book a site visit?',
    answer:
      'You can book a free site visit through our website, by calling us, or via WhatsApp. We provide complimentary pickup from our Gulshan-2 office. No obligation, no pressure.',
  },
  {
    question: 'What is the current status of development?',
    answer:
      'Both Chandra Chaya (500 Bigha) and Ventura City are ongoing projects with active development. Road construction, utility connections, and landscaping are progressing on schedule.',
  },
  {
    question: 'Is Purbachal a good investment?',
    answer:
      'Purbachal is Dhaka\'s largest planned residential area with government investment in infrastructure including the Purbachal Expressway, water treatment plant, and central park. Property values have appreciated 200-300% over the last decade.',
  },
]

export default function FAQSection() {
  const s = useSiteSettings()
  const t = useT()

  const { data } = usePublicData<PublicFaqsPayload>('/api/faqs')
  const items =
    data?.faqs && data.faqs.length > 0
      ? data.faqs.slice(0, 8).map((f) => ({ question: f.question, answer: f.answer }))
      : faqItems

  const { data: cs } = usePublicData<Record<string, { title?: string; subtitle?: string; content?: string }>>('/api/content-sections')
  const fs = cs?.faq_section

  const officeArea = s.companyAddress.split(',').map(p => p.trim()).find(p => /^[A-Za-z]/.test(p) && !/House|Road/.test(p)) || s.companyAddress.split(',')[2]?.trim() || 'our office'
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().replace('Gulshan-2 office', officeArea + ' office'),
      },
    })),
  }

  return (
    <section className="py-24 md:py-32 bg-[#F4F2EC] relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="eyebrow-plot mb-5">
            {fs?.subtitle ?? 'The Answers'}
          </span>
          <h2 className="display-title mt-4">
            {fs?.title ? (
              fs.title
            ) : (
              <>
                Everything you need to <span className="accent-word">know</span>
              </>
            )}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto mt-12 space-y-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="premium-card overflow-hidden transition-colors duration-300"
                style={{
                  borderLeft: isOpen
                    ? '3px solid #1E6B3A'
                    : '3px solid transparent',
                }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-[#131B16] font-semibold text-sm sm:text-base leading-relaxed group-hover:text-[#1E6B3A] transition-colors">
                    {item.question}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#334155] group-hover:text-[#1E6B3A] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>

                {isOpen && (
                  <div className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                      <div className="border-t border-[#E2E8F0] pt-4">
                        <RichText
                          html={item.answer.replace('Gulshan-2 office', officeArea + ' office')}
                          className="text-[#334155] text-sm sm:text-base leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <RichText
            className="text-[#334155] text-base sm:text-lg mb-3"
            html={fs?.content ?? 'Still have questions?'}
          />
          <Link href="/contact" className="link-premium">
            {t('home.faq.contactLink')}
            <ArrowRight className="w-4 h-4 link-arrow" />
          </Link>
        </div>
      </div>
    </section>
  )
}