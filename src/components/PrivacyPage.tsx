'use client'

import PageHero from '@/components/PageHero'
import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ChevronRight, Shield, Lock, Eye, Share2, Cookie, Mail, Phone, MapPin, FileText } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useSiteSettings, getPhoneLink, getMailtoLink } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'

const sections = [
  {
    id: 'information-we-collect',
    icon: Eye,
    title: '1. Information We Collect',
    content: [
      {
        heading: 'Personal Information',
        text: 'When you interact with our services — whether through our website, during a site visit, or by contacting our sales team — we may collect personal details including your full name, phone number, email address, mailing address, and National ID (NID) number. This information is essential for processing property inquiries, booking site visits, and facilitating purchase agreements.'
      },
      {
        heading: 'Financial Information',
        text: 'To process bookings, payments, and installment plans, we collect banking details, payment history, and financial documents as required by Bangladeshi real estate regulations. All financial data is handled with the highest level of security and confidentiality.'
      },
      {
        heading: 'Technical Information',
        text: 'Our website automatically collects certain technical data when you visit, including your IP address, browser type, device information, operating system, pages visited, time spent on pages, and referring URLs. This data helps us improve your browsing experience and website performance.'
      },
      {
        heading: 'Communication Records',
        text: 'We maintain records of all communications between you and our team, including emails, phone call logs, WhatsApp messages, and meeting notes. These records help us provide consistent and personalized service throughout your property journey.'
      }
    ]
  },
  {
    id: 'how-we-use-information',
    icon: FileText,
    title: '2. How We Use Your Information',
    content: [
      {
        heading: 'Service Delivery',
        text: 'Your information enables us to respond to your property inquiries, schedule and conduct site visits, process booking applications, manage payment plans, prepare sales agreements, and provide ongoing customer support after your purchase.'
      },
      {
        heading: 'Communication',
        text: 'We use your contact details to send project updates, payment reminders, event invitations, and promotional materials about our latest developments. You may opt out of non-essential communications at any time by contacting us or clicking the unsubscribe link in our emails.'
      },
      {
        heading: 'Legal & Regulatory Compliance',
        text: 'We may use your information to comply with applicable Bangladeshi laws, including but not limited to RAJUK regulations, land registration requirements, tax obligations, and anti-money laundering (AML) requirements as mandated by Bangladesh Bank.'
      },
      {
        heading: 'Improvement & Analysis',
        text: 'Aggregated, anonymized data helps us analyze market trends, improve our services, enhance website functionality, and develop new projects that meet the evolving needs of our customers.'
      }
    ]
  },
  {
    id: 'information-sharing',
    icon: Share2,
    title: '3. Information Sharing',
    content: [
      {
        heading: 'Who We Share With',
        text: 'We do not sell, trade, or rent your personal information to third parties. We may share your data with: authorized government agencies (RAJUK, Land Revenue Office, Tax authorities) as required by law; our legal counsel and financial partners for transaction processing; construction partners and utility providers involved in your project; and service providers who assist in operating our website and business (under strict confidentiality agreements).'
      },
      {
        heading: 'Business Transfers',
        text: 'In the event of a merger, acquisition, or sale of company assets, your personal information may be transferred as part of the transaction. We will notify you of any such change and ensure your data continues to be protected under the same standards.'
      }
    ]
  },
  {
    id: 'data-security',
    icon: Lock,
    title: '4. Data Security',
    content: [
      {
        heading: 'Protection Measures',
        text: 'We implement industry-standard security measures to protect your personal information, including SSL/TLS encryption for all data transmitted through our website, secure server infrastructure with firewalls and intrusion detection systems, restricted access to personal data on a need-to-know basis, regular security audits and vulnerability assessments, and secure physical storage for paper documents at our corporate office.'
      },
      {
        heading: 'Data Retention',
        text: 'We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, or as required by Bangladeshi law. Property transaction records are retained for a minimum of 10 years as per regulatory requirements. You may request the deletion of non-essential data by contacting our privacy officer.'
      }
    ]
  },
  {
    id: 'your-rights',
    icon: Shield,
    title: '5. Your Rights',
    content: [
      {
        heading: 'Access & Correction',
        text: 'You have the right to request access to the personal information we hold about you and to request corrections if any details are inaccurate or incomplete. To exercise this right, please submit a written request to our privacy officer with valid identification.'
      },
      {
        heading: 'Data Deletion',
        text: 'You may request the deletion of your personal data, subject to legal retention requirements. Please note that certain records related to property transactions cannot be deleted due to regulatory obligations. We will clearly communicate any data that must be retained and explain the legal basis for doing so.'
      },
      {
        heading: 'Opt-Out Rights',
        text: 'You can opt out of marketing communications at any time. However, you will continue to receive transactional communications related to your property purchase, payment schedules, and important project updates regardless of your marketing preferences.'
      }
    ]
  },
  {
    id: 'cookie-policy',
    icon: Cookie,
    title: '6. Cookie Policy',
    content: [
      {
        heading: 'What Are Cookies',
        text: 'Cookies are small data files stored on your device when you visit our website. We use both session cookies (temporary, deleted when you close your browser) and persistent cookies (remain on your device for a set period) to enhance your browsing experience and collect analytical data.'
      },
      {
        heading: 'Types of Cookies We Use',
        text: 'Essential cookies are required for the website to function properly, including session management and security features. Analytics cookies (such as Google Analytics) help us understand how visitors interact with our website, collecting data on page views, bounce rates, and navigation patterns. Marketing cookies may be used by third-party advertising platforms to deliver relevant advertisements. You can manage your cookie preferences through your browser settings at any time.'
      }
    ]
  },
  {
    id: 'contact-us',
    icon: Mail,
    title: '7. Contact Us',
    content: [
      {
        heading: 'Privacy Inquiries',
        text: 'If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal information, please do not hesitate to reach out. We are committed to addressing your privacy concerns promptly and transparently.'
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

export default function PrivacyPage() {
  const s = useSiteSettings()
  const t = useT()
  const cn = s.companyName

  // Admin-managed legal content (privacy_content section) — the hardcoded
  // sections below stay as fallback when no content has been saved.
  const { data: contentSections } =
    usePublicData<Record<string, { content: string | null }>>('/api/content-sections')
  const dbContent = contentSections?.privacy_content?.content?.trim()
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })
  const contentRef = useRef<HTMLDivElement>(null)
  const contentInView = useInView(contentRef, { once: true, margin: '-50px' })

  return (
    <main className="page-enter">
      {/* Chapter opener */}
      <div ref={heroRef}>
        <PageHero
          plotNo="Appendix A"
          eyebrow={t('pages.privacy.heroEyebrow')}
          title={<>{t('pages.privacy.heroTitlePre')} <span className="accent-word-gold">{t('pages.privacy.heroTitleAccent')}</span></>}
          subtitle={t('pages.privacy.heroSubtitle')}
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
            <span className="text-[#4A564E] text-sm">{t('pages.privacy.lastUpdated')} {s.privacyUpdated || 'July 2025'}</span>
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
                  {`At ${cn}, we are committed to protecting the privacy and security of your personal information. This Privacy Policy outlines the types of information we collect, how we use and protect it, and your rights regarding your data. By using our website or engaging our services, you agree to the practices described in this policy.`}
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
              <h3 className="text-xl sm:text-2xl font-bold text-[#131B16] mb-6">{t('pages.privacy.contactHeading')}</h3>
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
}: {
  section: { id: string; title: string; content: { heading?: string; text: string }[] }
  Icon: React.ComponentType<{ className?: string }>
  index: number
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
            <p className="text-[#4A564E] text-base leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}