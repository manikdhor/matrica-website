'use client'

import PageHero from '@/components/PageHero'
import { useState, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useSiteSettings, getPhoneLink, getWhatsAppLink } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import type { PublicFaqsPayload } from '@/app/api/faqs/route'
import {
  ChevronRight,
  Search,
  Phone,
  MessageCircle,
  ArrowRight,
  Building2,
  ShoppingCart,
  Scale,
  CreditCard,
  Car,
  Calendar,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Diamond,
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  // Projects
  {
    id: 'p1',
    category: 'Projects',
    question: 'What projects does Matrica currently have?',
    answer:
      'Matrica currently has 2 premium projects in Purbachal: Chandra Chaya and Ventura City (both ongoing). Each project is carefully planned with RAJUK approval, modern infrastructure, and premium amenities to deliver an exceptional living experience.',
  },
  {
    id: 'p2',
    category: 'Projects',
    question: 'Where are Matrica\'s projects located?',
    answer:
      'All our projects are strategically located in Purbachal New Town, Dhaka\'s fastest-growing residential area. Purbachal offers excellent connectivity via the Dhaka-Purbachal Expressway, 300-foot main roads, and upcoming metro rail extensions, making it the ideal location for residential investment.',
  },
  {
    id: 'p3',
    category: 'Projects',
    question: 'What plot sizes are available?',
    answer:
      'We offer various plot sizes to suit different needs. Specific sizes vary by project. Please contact us for detailed information about available plot sizes, pricing, and payment options for each of our projects.',
  },
  {
    id: 'p4',
    category: 'Projects',
    question: 'What amenities are included in Matrica projects?',
    answer:
      'Our projects feature wide paved roads, underground electricity, water supply systems, drainage networks, green spaces, community areas, and 24/7 security. Each project is designed following RAJUK guidelines to ensure a premium living environment.',
  },

  // Buying Process
  {
    id: 'b1',
    category: 'Buying Process',
    question: 'How do I buy a plot from Matrica?',
    answer:
      'The process is simple: 1) Browse our projects online, 2) Book a free site visit to see the land in person, 3) Select your preferred plot with our advisor, 4) Complete documentation and legal procedures, 5) Begin your flexible payment plan. Our team guides you through every step.',
  },
  {
    id: 'b2',
    category: 'Buying Process',
    question: 'Can I visit the project site before buying?',
    answer:
      'Absolutely! We encourage all potential buyers to visit our sites. We offer free transportation from our Gulshan-2 office to the project site. Our experienced advisors will accompany you and provide detailed information about every aspect of the project.',
  },
  {
    id: 'b3',
    category: 'Buying Process',
    question: 'How long does the buying process take?',
    answer:
      'The entire process from your first visit to receiving all documentation typically takes 7-14 working days, depending on the project and your preferred payment plan. Our team works efficiently to ensure a smooth and timely experience.',
  },
  {
    id: 'b4',
    category: 'Buying Process',
    question: 'Can I buy a plot as an NRI (Non-Resident Bangladeshi)?',
    answer:
      'Yes, NRIs can purchase plots from Matrica. We have streamlined processes for NRI buyers, including digital documentation, video consultations, and power of attorney arrangements. Contact our team for specific NRI buying procedures.',
  },

  // Legal
  {
    id: 'l1',
    category: 'Legal',
    question: 'Are your projects planned according to RAJUK rules?',
    answer:
      "Yes. Ventura City and Chandra Chaya are planned in line with RAJUK's policies, and both sit within the RAJUK Purbachal New Town growth corridor — Ventura City is a one-minute walk from RAJUK Purbachal New Town, and Chandra Chaya is next to Sector 21. You can inspect the full document chain at our Gulshan-2 office before booking.",
  },
  {
    id: 'l2',
    category: 'Legal',
    question: 'What documents will I receive?',
    answer:
      "Because each project's land is bought in Matrica Real Estate Ltd.'s own name, your registered deed (দলিল) follows immediately after payment, along with mutation (নামজারি) documents, tax clearance, khatian and all relevant registration papers — every document properly registered with the appropriate government authorities.",
  },
  {
    id: 'l3',
    category: 'Legal',
    question: 'Is the land free from any disputes?',
    answer:
      'Yes, all Matrica project lands are thoroughly verified and free from any legal disputes. We conduct comprehensive due diligence before acquiring any land, including title verification, encumbrance checks, and boundary surveys.',
  },

  // Payments
  {
    id: 'pay1',
    category: 'Payments',
    question: 'What payment plans are available?',
    answer:
      'We offer flexible payment plans including down payment + monthly installments spread over 1-5 years. Specific plans vary by project. Contact our sales team for detailed payment schedules, interest-free options, and early payment benefits.',
  },
  {
    id: 'pay2',
    category: 'Payments',
    question: 'Is there any hidden cost?',
    answer:
      'No. Matrica believes in complete transparency. All costs are clearly communicated upfront with no hidden charges. The price you see includes all applicable fees. We provide a detailed cost breakdown before you make any commitment.',
  },
  {
    id: 'pay3',
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer:
      'We accept bank transfers, cheques, and cash payments. For NRI buyers, we also facilitate international wire transfers. All payments are properly documented with official receipts for your records.',
  },
  {
    id: 'pay4',
    category: 'Payments',
    question: 'Can I get a refund if I cancel my booking?',
    answer:
      'Our refund policy varies based on the stage of your purchase and the specific terms agreed upon. We recommend discussing cancellation terms with our sales advisor before making your booking decision. We always strive to be fair and transparent.',
  },

  // Site Visits
  {
    id: 'sv1',
    category: 'Site Visits',
    question: 'How do I book a site visit?',
    answer:
      'You can book through our website\'s "Book a Site Visit" page, call our hotline, or message us on WhatsApp. We\'ll arrange free transport from our Gulshan-2 office and have an expert advisor ready to show you around the project site.',
  },
  {
    id: 'sv2',
    category: 'Site Visits',
    question: 'Is the site visit free?',
    answer:
      'Yes, site visits are completely free including complimentary transportation from our Gulshan-2 office. There is absolutely no obligation to purchase after the visit. We want you to make an informed decision at your own pace.',
  },
  {
    id: 'sv3',
    category: 'Site Visits',
    question: 'What should I bring to a site visit?',
    answer:
      'Just bring a valid photo ID. We recommend wearing comfortable shoes as you\'ll be walking around the project site. Our team will provide all necessary information, project brochures, and answer any questions you may have during the visit.',
  },
]

const faqCategories = [
  'All',
  'Projects',
  'Buying Process',
  'Legal',
  'Payments',
  'Site Visits',
]

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Projects': Building2,
  'Buying Process': ShoppingCart,
  'Legal': Scale,
  'Payments': CreditCard,
  'Site Visits': Car,
}

const popularQuestions = [
  'p1',
  'b1',
  'l1',
  'pay2',
]

/* DB categories are stored lowercase (e.g. "general") — display them title-cased */
const titleCase = (value: string) =>
  value.replace(/\b\w/g, (c) => c.toUpperCase())

export default function FAQPage() {
  const s = useSiteSettings()
  const t = useT()

  // DB-driven FAQs (admin-managed) — hardcoded items stay as fallback
  const { data } = usePublicData<PublicFaqsPayload>('/api/faqs')
  const dbFaqs = useMemo<FAQItem[] | null>(() => {
    if (!data?.faqs || data.faqs.length === 0) return null
    return data.faqs.map((f) => ({
      id: f.id,
      category: titleCase(f.category || 'General'),
      question: f.question,
      answer: f.answer,
    }))
  }, [data])

  const faqList = dbFaqs ?? faqs
  const categoriesList = dbFaqs
    ? ['All', ...Array.from(new Set(dbFaqs.map((f) => f.category)))]
    : faqCategories
  const popularIds = dbFaqs
    ? dbFaqs.slice(0, 4).map((f) => f.id)
    : popularQuestions
  const mostAskedCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const f of faqList) counts[f.category] = (counts[f.category] || 0) + 1
    return (
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Projects'
    )
  }, [faqList])

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const topRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(topRef, { once: true, margin: '-80px' })

  const handleFeedback = (faqId: string, type: string) => {
    setFeedback(prev => ({ ...prev, [faqId]: type }))
    toast.success(type === 'yes' ? t('pages.faq.feedbackYes') : t('pages.faq.feedbackNo'))
  }

  const filteredFaqs = useMemo(() => {
    return faqList.filter((faq) => {
      const matchesCategory =
        activeCategory === 'All' || faq.category === activeCategory
      const matchesSearch =
        searchQuery.trim() === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [faqList, searchQuery, activeCategory])

  return (
    <main className="min-h-screen page-enter">
      {/* Chapter opener */}
      <div ref={topRef}>
        <PageHero
          plotNo="Sheet 05"
          eyebrow={t('pages.faq.heroEyebrow')}
          title={
            <>
              {t('pages.faq.heroTitlePre')} <span className="accent-word-gold">{t('pages.faq.heroTitleAccent')}</span>
            </>
          }
          subtitle={t('pages.faq.heroSubtitle')}
        />
      </div>

      {/* Search & Filters */}
      <section className="py-12 md:py-16 bg-[#FFFFFF]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative mb-8"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A564E]" />
            <Input
              type="text"
              placeholder={t('pages.faq.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 premium-input text-base rounded-xl"
            />
          </motion.div>

          {/* Popular Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="glass-card rounded-xl border border-[#1E6B3A]/20 p-5 sm:p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-[#1E6B3A]" />
              <h3 className="text-sm font-semibold text-[#1E6B3A] uppercase tracking-wider">
                {t('pages.faq.popularQuestions')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularIds.map((pqId) => {
                const pq = faqList.find((f) => f.id === pqId)
                if (!pq) return null
                const IconComp = categoryIconMap[pq.category]
                return (
                  <button
                    key={pqId}
                    onClick={() => {
                      const el = document.getElementById(pqId)
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        // Trigger click on the accordion trigger to open it
                        const trigger = el.querySelector('[data-state]')?.closest('button')
                        if (trigger) trigger.click()
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#1E6B3A]/25 text-[#131B16] text-xs sm:text-sm hover:border-[#1E6B3A]/60 hover:bg-[#1E6B3A]/5 transition-all cursor-pointer group"
                  >
                    {IconComp && <IconComp className="w-3.5 h-3.5 text-[#1E6B3A]/70 group-hover:text-[#1E6B3A]" />}
                    <span>{pq.question}</span>
                    <ArrowRight className="w-3 h-3 text-[#1E6B3A]/50 group-hover:text-[#1E6B3A] ml-1" />
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-10"
          >
            <Tabs
              value={activeCategory}
              onValueChange={setActiveCategory}
              className="w-full"
            >
              <TabsList className="bg-[#FFFFFF] border border-border w-full justify-start overflow-x-auto p-1 h-auto gap-1">
                {categoriesList.map((cat) => {
                  const IconComp = cat !== 'All' ? categoryIconMap[cat] : null
                  return (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="data-[state=active]:bg-[#1E6B3A] data-[state=active]:text-[#FFFFFF] text-[#4A564E] text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5"
                    >
                      {IconComp && <IconComp className="w-3.5 h-3.5" />}
                      {cat}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Stats Bar */}
          {searchQuery.trim() === '' && activeCategory === 'All' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-0 mb-8"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#1E6B3A]/15 text-[#1E6B3A] text-xs font-medium">
                <span className="text-[#131B16] font-bold">{filteredFaqs.length}</span> {t('pages.faq.statQuestions')}
              </span>
              <Diamond className="w-3 h-3 text-[#1E6B3A]/40 hidden sm:block" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#1E6B3A]/15 text-[#1E6B3A] text-xs font-medium">
                <span className="text-[#131B16] font-bold">{categoriesList.length - 1}</span> {t('pages.faq.statCategories')}
              </span>
              <Diamond className="w-3 h-3 text-[#1E6B3A]/40 hidden sm:block" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#1E6B3A]/15 text-[#1E6B3A] text-xs font-medium">
                {t('pages.faq.statMostAsked')} <span className="text-[#131B16] font-bold">{mostAskedCategory}</span>
              </span>
            </motion.div>
          )}

          {/* FAQ Accordion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {filteredFaqs.length > 0 ? (
                <Accordion type="multiple" className="space-y-3">
                  {filteredFaqs.map((faq, index) => {
                    const CatIcon = categoryIconMap[faq.category]
                    return (
                      <motion.div
                        key={faq.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{ delay: index * 0.04, duration: 0.4 }}
                      >
                        <AccordionItem
                          value={faq.id}
                          id={faq.id}
                          className="bg-white border border-gray-100 rounded-xl px-5 sm:px-6 overflow-hidden data-[state=open]:border-[#1E6B3A]/30 data-[state=open]:border-l-2 data-[state=open]:border-l-[#1E6B3A] transition-colors"
                        >
                          <AccordionTrigger className="text-left text-[#131B16] font-semibold text-sm sm:text-base hover:text-[#1E6B3A] hover:no-underline py-5">
                            <div className="flex items-center gap-3 pr-4">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1E6B3A]/10 border border-[#1E6B3A]/30 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1E6B3A]" />
                              </span>
                              <Badge
                                variant="outline"
                                className="border-[#1E6B3A]/30 text-[#1E6B3A] text-[10px] sm:text-xs whitespace-nowrap flex-shrink-0 gap-1"
                              >
                                {CatIcon && <CatIcon className="w-3 h-3" />}
                                {faq.category}
                              </Badge>
                              <span>{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-5 pt-0">
                            <RichText
                              html={faq.answer}
                              className="text-[#4A5568] text-sm leading-[1.8] tracking-wide"
                            />
                            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
                              <span className="text-[#4A564E] text-xs">{t('pages.faq.wasHelpful')}</span>
                              <button
                                onClick={() => handleFeedback(faq.id, 'yes')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${feedback[faq.id] === 'yes' ? 'border-[#1E6B3A]/40 text-[#1E6B3A] bg-[#1E6B3A]/10' : 'border-border text-[#4A564E] hover:border-[#1E6B3A]/40 hover:text-[#1E6B3A]'}`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                {t('pages.faq.yes')}
                              </button>
                              <button
                                onClick={() => handleFeedback(faq.id, 'no')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${feedback[faq.id] === 'no' ? 'border-red-500/40 text-red-500 bg-red-500/10' : 'border-border text-[#4A564E] hover:border-[#1E6B3A]/40 hover:text-[#1E6B3A]'}`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                                {t('pages.faq.no')}
                              </button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    )
                  })}
                </Accordion>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-white border border-gray-100 flex items-center justify-center mx-auto mb-5">
                    <Search className="w-9 h-9 text-[#4A564E]/40" />
                  </div>
                  <p className="text-[#131B16] text-lg font-medium mb-2">{t('pages.faq.noResultsTitle')}</p>
                  <p className="text-[#4A564E] text-sm mb-6">
                    {t('pages.faq.noResultsSubtitle')}
                  </p>
                  <div className="mb-6">
                    <p className="text-[#4A564E] text-xs uppercase tracking-wider mb-3">{t('pages.faq.tryTheseTopics')}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {categoriesList.filter(c => c !== 'All').map((cat) => {
                        const CatIcon = categoryIconMap[cat]
                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              setSearchQuery('')
                              setActiveCategory(cat)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#1E6B3A]/25 text-[#1E6B3A] text-xs hover:border-[#1E6B3A]/60 hover:bg-[#1E6B3A]/5 transition-all cursor-pointer"
                          >
                            {CatIcon && <CatIcon className="w-3 h-3" />}
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button
                      size="sm"
                      className="btn-premium bg-[#1E6B3A] text-[#FFFFFF] hover:bg-[#166B34] font-semibold px-5"
                    >
                      {t('pages.faq.askUsDirectly')}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <div className="gold-line" />

      {/* Still Have Questions CTA */}
      <section className="py-16 md:py-20 bg-[#F4F2EC]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="animated-gradient-border rounded-2xl p-[1px] mb-0">
              <div className="bg-[#F4F2EC] rounded-2xl px-6 sm:px-10 py-10 sm:py-14">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#131B16] mb-3">
                  {t('pages.faq.ctaTitle')}
                </h2>
                <p className="text-[#4A564E] text-sm sm:text-base mb-8 max-w-lg mx-auto">
                  {t('pages.faq.ctaSubtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 mb-8">
                  {s.companyPhone && (
                  <a
                    href={getPhoneLink(s)}
                    className="flex items-center gap-2 text-[#1E6B3A] hover:text-[#166B34] transition-colors text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    {s.companyPhone}
                  </a>
                  )}
                  {s.companyPhone && getWhatsAppLink(s) !== '#' && (
                  <Diamond className="w-3 h-3 text-[#1E6B3A]/40 hidden sm:block mx-4 rotate-45" />
                  )}
                  {getWhatsAppLink(s) !== '#' && (
                  <a
                    href={getWhatsAppLink(s)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#1E6B3A] hover:text-[#166B34] transition-colors text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {t('pages.faq.whatsappUs')}
                  </a>
                  )}
                  <Diamond className="w-3 h-3 text-[#1E6B3A]/40 hidden sm:block mx-4 rotate-45" />
                  <Link
                    href="/site-visit"
                    className="flex items-center gap-2 text-[#1E6B3A] hover:text-[#166B34] transition-colors text-sm font-medium"
                  >
                    <Calendar className="w-4 h-4" />
                    {t('pages.faq.bookSiteVisit')}
                  </Link>
                </div>

                <Link href="/contact">
                  <Button
                    size="lg"
                    className="btn-premium bg-[#1E6B3A] text-[#FFFFFF] hover:bg-[#166B34] font-semibold px-8"
                  >
                    {t('pages.faq.contactUs')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}