'use client'

import PageHero from '@/components/PageHero'
import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ChevronRight, FileText, CreditCard, Calendar, Building, Scale, AlertTriangle, Gavel, RefreshCw, MessageSquare, Handshake, MapPin, Mail, Phone } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useSiteSettings, getPhoneLink, getMailtoLink } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'

const sections = [
  {
    id: 'agreement-to-terms',
    icon: Handshake,
    title: '1. Agreement to Terms',
    content: [
      {
        heading: 'Acceptance',
        text: 'By accessing the MATRICA REAL ESTATE LTD website, visiting our project sites, engaging our services, or entering into any property purchase agreement, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use our services or website.'
      },
      {
        heading: 'Eligibility',
        text: 'You must be at least 18 years of age and possess the legal capacity to enter into binding agreements under the laws of Bangladesh. All property purchasers must provide valid identification (National ID or Passport) and comply with Bangladeshi property ownership regulations.'
      },
      {
        heading: 'Modifications',
        text: 'MATRICA REAL ESTATE LTD reserves the right to modify these terms at any time. Changes will be effective immediately upon posting on our website. Continued use of our services after such changes constitutes your acceptance of the revised terms. We encourage you to review this page periodically.'
      }
    ]
  },
  {
    id: 'property-information',
    icon: Building,
    title: '2. Property Information',
    content: [
      {
        heading: 'Accuracy of Information',
        text: 'We strive to provide accurate and up-to-date information about our projects, including plot sizes, pricing, location maps, development plans, and amenities. However, all information presented on our website, brochures, and marketing materials is provided for informational purposes only and does not constitute a legal offering or warranty.'
      },
      {
        heading: 'RAJUK Approval & Compliance',
        text: 'All MATRICA projects are developed in compliance with RAJUK (Rajdhani Unnayan Kartripakkha) regulations and relevant Bangladeshi building codes. Plot dimensions, road widths, and utility connections are subject to final RAJUK-approved plans. Minor variations in plot sizes (within permissible limits as per RAJUK guidelines) may occur during final survey and demarcation.'
      },
      {
        heading: 'Project Renders & Visuals',
        text: 'Architectural renders, site plans, and visual representations of our projects are artistic impressions intended to convey the design concept. Actual development may vary in detail. Furniture, landscaping, and accessories shown in renders are for illustration purposes and are not included in the plot purchase unless explicitly stated in the sales agreement.'
      }
    ]
  },
  {
    id: 'pricing-payment',
    icon: CreditCard,
    title: '3. Pricing & Payment Terms',
    content: [
      {
        heading: 'Pricing',
        text: 'All prices are quoted in Bangladeshi Taka (BDT) unless otherwise specified. Prices are subject to change without prior notice until a booking agreement is signed and the booking deposit is received. Government taxes, registration fees, utility connection charges, and other statutory costs are additional and borne by the purchaser unless otherwise agreed in writing.'
      },
      {
        heading: 'Payment Schedule',
        text: 'Payment terms are specified in individual sales agreements and vary by project. Standard payment plans typically include a booking deposit (non-refundable, as specified in the booking terms), down payment within 30–90 days of booking, and equal monthly or quarterly installments over the agreed tenure. Early payment incentives may be available — please consult our sales team for details.'
      },
      {
        heading: 'Late Payment',
        text: 'If payment is not received within 15 days of the due date, a late payment penalty of 2% per month on the overdue amount may be applied, as specified in the sales agreement. Persistent non-payment may result in cancellation of the booking as outlined in the Cancellation Policy section below. MATRICA reserves the right to suspend work on allotted plots for accounts with significant outstanding dues.'
      }
    ]
  },
  {
    id: 'booking-cancellation',
    icon: Calendar,
    title: '4. Booking & Cancellation Policy',
    content: [
      {
        heading: 'Booking Process',
        text: 'To book a plot, the purchaser must submit a completed booking form along with the required booking deposit, valid identification documents, and passport-size photographs. Upon receipt, MATRICA will issue a booking confirmation letter and a provisional allotment letter within 7 working days.'
      },
      {
        heading: 'Booking Deposit',
        text: 'The booking deposit is a commitment to purchase and may be partially or fully non-refundable depending on the project and timing of cancellation. The specific refund policy applicable to your booking is detailed in the booking agreement and project-specific terms provided at the time of booking.'
      },
      {
        heading: 'Cancellation by Purchaser',
        text: 'A purchaser may request cancellation by submitting a written application to MATRICA. If cancelled within 7 days of booking (cooling-off period), a full refund of the booking deposit minus any processing fees will be issued within 30 working days. Cancellations after the cooling-off period are subject to the cancellation terms specified in the sales agreement, which may include forfeiture of a portion or all of the booking deposit.'
      },
      {
        heading: 'Cancellation by MATRICA',
        text: 'MATRICA reserves the right to cancel a booking in cases of: misrepresentation or fraud by the purchaser, failure to complete payment as per the agreed schedule, breach of any terms in the sales agreement, or force majeure events that make project development unfeasible. In such cases, refunds (if applicable) will be processed within 90 working days as per the terms of the agreement.'
      }
    ]
  },
  {
    id: 'site-visit',
    icon: Gavel,
    title: '5. Site Visit Terms',
    content: [
      {
        heading: 'Site Visit Booking',
        text: 'Site visits can be booked through our website, by phone, or by visiting our sales office. MATRICA provides complimentary transportation for pre-booked site visits from designated pickup points in Dhaka. We request at least 24 hours advance notice for site visit bookings.'
      },
      {
        heading: 'Safety & Liability',
        text: 'Construction sites and under-development areas may present inherent hazards. Visitors must be accompanied by an authorized MATRICA representative at all times during the site visit. Visitors are required to wear safety equipment provided by MATRICA (hard hats, safety vests) and follow all safety instructions. MATRICA shall not be liable for any injury, loss, or damage sustained during a site visit, except where caused by our gross negligence.'
      },
      {
        heading: 'Site Visit Cancellation',
        text: 'We appreciate at least 4 hours advance notice for cancellation of a booked site visit. Repeated no-shows without cancellation may result in restricted access to complimentary transportation services for future visits.'
      }
    ]
  },
  {
    id: 'intellectual-property',
    icon: FileText,
    title: '6. Intellectual Property',
    content: [
      {
        heading: 'Ownership',
        text: 'All content on the MATRICA REAL ESTATE LTD website, including but not limited to text, graphics, logos, images, architectural designs, floor plans, site plans, project names, and the overall website design, is the exclusive intellectual property of MATRICA REAL ESTATE LTD or its licensors and is protected by Bangladeshi and international copyright, trademark, and intellectual property laws.'
      },
      {
        heading: 'Permitted Use',
        text: 'You may view and download content from our website for personal, non-commercial use only. You may not reproduce, distribute, modify, create derivative works from, publicly display, or commercially exploit any content from this website without prior written consent from MATRICA REAL ESTATE LTD.'
      }
    ]
  },
  {
    id: 'limitation-liability',
    icon: AlertTriangle,
    title: '7. Limitation of Liability',
    content: [
      {
        heading: 'Website Disclaimer',
        text: 'The MATRICA website and all content are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the website will be uninterrupted, error-free, or free of viruses or other harmful components.'
      },
      {
        heading: 'Limitation',
        text: 'To the fullest extent permitted by applicable law, MATRICA REAL ESTATE LTD, its directors, officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising out of or in connection with the use of our website or services.'
      },
      {
        heading: 'Total Liability',
        text: 'In no event shall our total aggregate liability exceed the amount paid by you to MATRICA REAL ESTATE LTD in the twelve (12) months preceding the claim, except in cases of gross negligence or willful misconduct.'
      }
    ]
  },
  {
    id: 'governing-law',
    icon: Scale,
    title: '8. Governing Law',
    content: [
      {
        heading: 'Applicable Law',
        text: 'These Terms & Conditions and any disputes arising from them shall be governed by and construed in accordance with the laws of the People\'s Republic of Bangladesh, including but not limited to the Transfer of Property Act 1882, the Registration Act 1908, the Specific Relief Act 1877, and the Real Estate Development and Management Act (if applicable).'
      },
      {
        heading: 'Jurisdiction',
        text: 'Any legal proceedings arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh. The parties irrevocably submit to the jurisdiction of these courts and waive any objection to the venue of such proceedings.'
      }
    ]
  },
  {
    id: 'dispute-resolution',
    icon: RefreshCw,
    title: '9. Dispute Resolution',
    content: [
      {
        heading: 'Amicable Resolution',
        text: 'In the event of any dispute, claim, or controversy arising out of or relating to these terms or any property transaction with MATRICA, the parties shall first attempt to resolve the matter through good faith negotiation. Either party may initiate this process by providing written notice to the other party detailing the nature of the dispute.'
      },
      {
        heading: 'Mediation',
        text: 'If the dispute cannot be resolved through negotiation within 30 days, either party may refer the matter to mediation. The mediation shall be conducted by a mutually agreed-upon mediator in Dhaka, Bangladesh. The costs of mediation shall be borne equally by both parties unless otherwise agreed.'
      },
      {
        heading: 'Arbitration',
        text: 'If mediation fails to resolve the dispute within 60 days, the matter shall be referred to arbitration in accordance with the Arbitration Act 2001 of Bangladesh. The arbitration shall be conducted by a sole arbitrator appointed by mutual agreement of the parties, or in the absence of agreement, by the Bangladesh International Arbitration Centre (BIAC). The arbitral award shall be final and binding on both parties.'
      }
    ]
  },
  {
    id: 'amendments',
    icon: MessageSquare,
    title: '10. Amendments',
    content: [
      {
        heading: 'Right to Amend',
        text: 'MATRICA REAL ESTATE LTD reserves the right to amend, update, or revise these Terms & Conditions at any time without prior written notice. Amendments will be posted on our website and will take effect immediately upon posting. The date of the most recent revision will be indicated at the top of this page.'
      },
      {
        heading: 'Continued Use',
        text: 'Your continued use of our website, services, or any ongoing property transactions after the posting of amended terms constitutes your acceptance of such changes. For existing property purchase agreements, the terms specified in the signed agreement shall prevail over any subsequent general website terms unless both parties agree in writing to adopt the revised terms.'
      }
    ]
  },
  {
    id: 'contact',
    icon: MessageSquare,
    title: '11. Contact',
    content: [
      {
        heading: 'Questions & Concerns',
        text: 'If you have any questions, concerns, or require clarification regarding these Terms & Conditions, please contact us using the information provided below. Our legal and customer service teams are available to assist you during business hours (Saturday–Thursday, 9:00 AM – 6:00 PM BST).'
      }
    ]
  }
]

/* Admin-authored rich text is trusted-ish, but strip anything executable
   before rendering it with dangerouslySetInnerHTML. */
function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return ''
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
    FORBID_ATTR: ['style'],
  })
}

export default function TermsPage() {
  const s = useSiteSettings()
  const t = useT()
  const cn = s.companyName

  // Admin-managed legal content (terms_content section) — the hardcoded
  // sections below stay as fallback when no content has been saved.
  const { data: contentSections } =
    usePublicData<Record<string, { content: string | null }>>('/api/content-sections')
  const dbContent = contentSections?.terms_content?.content?.trim()
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })
  const contentRef = useRef<HTMLDivElement>(null)
  const contentInView = useInView(contentRef, { once: true, margin: '-50px' })

  return (
    <main className="page-enter">
      {/* Chapter opener */}
      <div ref={heroRef}>
        <PageHero
          plotNo="Appendix B"
          eyebrow={t('pages.terms.heroEyebrow')}
          title={<>{t('pages.terms.heroTitlePre')} <span className="accent-word-gold">{t('pages.terms.heroTitleAccent')}</span>{t('pages.terms.heroTitlePost')}</>}
          subtitle={t('pages.terms.heroSubtitle')}
        />
      </div>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" ref={contentRef}>
          {/* Last Updated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={contentInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-12 flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-[#1E6B3A]" />
            <span className="text-[#4A564E] text-sm">{t('pages.terms.lastUpdated')} {s.termsUpdated || 'July 2025'}</span>
          </motion.div>

          {dbContent ? (
            /* Admin-managed content */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={contentInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <article
                className="prose-legal"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(dbContent) }}
              />
            </motion.div>
          ) : (
            <>
              {/* Introduction */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={contentInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-16"
              >
                <p className="text-[#4A564E] text-base sm:text-lg leading-relaxed">
                  {`Welcome to ${cn}. These Terms & Conditions govern your use of our website, services, and any property transactions with our company. We strongly encourage you to read these terms thoroughly before engaging with our services, as they contain important information about your rights, obligations, and legal protections.`}
                </p>
              </motion.div>

              {/* Sections */}
              <article className="space-y-16">
                {sections.map((section, sectionIndex) => {
                  const Icon = section.icon
                  return (
                    <SectionBlock
                      key={section.id}
                      section={section}
                      Icon={Icon}
                      index={sectionIndex}
                      companyName={cn}
                    />
                  )
                })}
              </article>
            </>
          )}

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="mt-16"
          >
            <div className="gold-line mb-10" />
            <div className="gold-border-card bg-white border border-gray-100 rounded-2xl p-8 md:p-10">
              <h3 className="text-xl sm:text-2xl font-bold text-[#131B16] mb-6">{t('pages.terms.contactHeading')}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-[#1E6B3A] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[#131B16] font-medium">{s.companyName}</p>
                    <p className="text-[#4A564E] leading-relaxed">{s.companyAddress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="w-5 h-5 text-[#1E6B3A] flex-shrink-0" />
                  <a href={getMailtoLink(s)} className="text-[#4A564E] hover:text-[#1E6B3A] transition-colors">{s.companyEmail}</a>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5 text-[#1E6B3A] flex-shrink-0" />
                  <a href={getPhoneLink(s)} className="text-[#4A564E] hover:text-[#1E6B3A] transition-colors">{s.companyPhone}</a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DB-authored legal HTML (admin textarea output has bare tags) */}
      <style jsx global>{`
        .prose-legal {
          color: #4A564E;
        }
        .prose-legal h1,
        .prose-legal h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #131B16;
          margin: 3rem 0 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(30, 107, 58, 0.15);
          line-height: 1.25;
        }
        @media (min-width: 640px) {
          .prose-legal h1,
          .prose-legal h2 { font-size: 1.5rem; }
        }
        .prose-legal h1:first-child,
        .prose-legal h2:first-child { margin-top: 0; }
        .prose-legal h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1E6B3A;
          margin: 1.75rem 0 0.5rem;
        }
        .prose-legal p {
          font-size: 1rem;
          line-height: 1.75;
          margin-bottom: 1.25rem;
        }
        .prose-legal ul,
        .prose-legal ol {
          margin: 0 0 1.25rem 1.5rem;
        }
        .prose-legal ul { list-style: disc; }
        .prose-legal ol { list-style: decimal; }
        .prose-legal li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .prose-legal a {
          color: #1E6B3A;
          text-decoration: underline;
        }
        .prose-legal strong { color: #131B16; }
      `}</style>
    </main>
  )
}

function SectionBlock({
  section,
  Icon,
  index,
  companyName,
}: {
  section: { id: string; title: string; content: { heading?: string; text: string }[] }
  Icon: React.ComponentType<{ className?: string }>
  index: number
  companyName: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      id={section.id}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.05 }}
    >
      {/* Section header with gold left border accent */}
      <div className="flex items-start gap-4 mb-6 pb-4 border-b border-[#1E6B3A]/15">
        <div className="w-10 h-10 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-5 h-5 text-[#1E6B3A]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#131B16] pt-1.5">{section.title}</h2>
      </div>

      {/* Subsections */}
      <div className="space-y-6 pl-0 sm:pl-14">
        {section.content.map((item, i) => (
          <div key={i}>
            {item.heading && (
              <h3 className="text-[#1E6B3A] font-semibold text-base mb-2">{item.heading}</h3>
            )}
            <p className="text-[#4A564E] text-base leading-relaxed">{item.text.replace(/MATRICA REAL ESTATE LTD/g, companyName)}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}