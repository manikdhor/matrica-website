'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  Loader2,
  ChevronRight as ChevronRightIcon,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import PageHero from '@/components/PageHero'
import { useSiteSettings, getWhatsAppLink, getMailtoLink } from '@/lib/use-site-settings'
import { usePublicData, seedPublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const subjectOptions = [
  { value: 'general', labelKey: 'pages.contact.subjectGeneral' },
  { value: 'project', labelKey: 'pages.contact.subjectProject' },
  { value: 'visit', labelKey: 'pages.contact.subjectVisit' },
  { value: 'complaint', labelKey: 'pages.contact.subjectComplaint' },
  { value: 'other', labelKey: 'pages.contact.subjectOther' },
]

// tel: URI from a display phone number
const telLink = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, '')}`

export default function ContactPage({ initialContentSections }: { initialContentSections?: unknown } = {}) {
  if (initialContentSections) seedPublicData('/api/content-sections', initialContentSections)

  const s = useSiteSettings()
  const t = useT()

  // Hero copy — admin-managed via the `contact_hero` content section; literals
  // stay as fallback.
  const { data: cs } =
    usePublicData<Record<string, { title?: string; subtitle?: string; content?: string }>>('/api/content-sections')
  const ch = cs?.contact_hero

  const formRef = useRef<HTMLDivElement>(null)
  const formInView = useInView(formRef, { once: true, margin: '-80px' })

  const faqRef = useRef<HTMLDivElement>(null)
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' })

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error(t('pages.contact.errNamePhone'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          source: 'contact',
          message: form.message ? `[${form.subject || 'General'}] ${form.message}` : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t('pages.contact.toastSuccess'))
        setForm({ name: '', phone: '', email: '', subject: '', message: '' })
      } else {
        toast.error(data.error || t('pages.contact.toastGenericError'))
      }
    } catch {
      toast.error(t('pages.contact.toastNetworkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-enter">
      {/* Chapter opener */}
      <PageHero
        plotNo="Sheet 07"
        eyebrow={ch?.subtitle ?? 'Get in Touch'}
        title={
          ch?.title ? (
            ch.title
          ) : (
            <>
              Start the <span className="accent-word-gold">conversation</span>
            </>
          )
        }
        subtitle={ch?.content ?? 'Questions about a plot, a payment plan, or a visit — our team responds within 24 hours.'}
      />

      {/* Contact Form & Info */}
      <section ref={formRef} className="py-20 md:py-28 bg-[#FBFAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left - Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={formInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className="premium-card rounded-2xl p-6 md:p-8">
                <span className="eyebrow-plot eyebrow-plot-left">{t('pages.contact.eyebrow')}</span>
                <h2
                  className="text-2xl font-bold text-[#131B16] mb-2 mt-3"

                >
                  {t('pages.contact.formTitle')}
                </h2>
                <p className="text-[#4A564E] text-sm mb-8">
                  {t('pages.contact.formSubtitle')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="text-sm text-[#4A564E] mb-1.5 block">
                      {t('pages.contact.labelName')} <span className="text-red-400">*</span>
                    </label>
                    <Input
                      id="contact-name"
                      placeholder={t('pages.contact.phName')}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="premium-input text-[#131B16] placeholder:text-[#6B776E]/50 h-11"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="contact-phone" className="text-sm text-[#4A564E] mb-1.5 block">
                      {t('pages.contact.labelPhone')} <span className="text-red-400">*</span>
                    </label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      placeholder={t('pages.contact.phPhone')}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="premium-input text-[#131B16] placeholder:text-[#6B776E]/50 h-11"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="text-sm text-[#4A564E] mb-1.5 block">
                      {t('pages.contact.labelEmail')}
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder={t('pages.contact.phEmail')}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="premium-input text-[#131B16] placeholder:text-[#6B776E]/50 h-11"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="contact-subject" className="text-sm text-[#4A564E] mb-1.5 block">
                      {t('pages.contact.labelSubject')}
                    </label>
                    <Select
                      value={form.subject}
                      onValueChange={(val) => setForm({ ...form, subject: val })}
                    >
                      <SelectTrigger id="contact-subject" className="w-full premium-input text-[#131B16] h-11">
                        <SelectValue placeholder={t('pages.contact.phSubject')} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {subjectOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="text-sm text-[#4A564E] mb-1.5 block">
                      {t('pages.contact.labelMessage')}
                    </label>
                    <Textarea
                      id="contact-message"
                      placeholder={t('pages.contact.phMessage')}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="premium-input text-[#131B16] placeholder:text-[#6B776E]/50 min-h-[120px] resize-none"
                      rows={5}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-premium w-full justify-center h-12 font-semibold text-base"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {loading ? t('pages.contact.sending') : t('pages.contact.sendMessage')}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Right - Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={formInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Info Card */}
              <div className="premium-card rounded-2xl p-6 md:p-8">
                <h2
                  className="text-2xl font-bold text-[#131B16] mb-6"

                >
                  {t('pages.contact.infoTitle')}
                </h2>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#1E6B3A]" />
                    </div>
                    <div>
                      <p className="text-[#4A564E] text-sm mb-0.5">{t('pages.contact.infoAddress')}</p>
                      <p className="text-[#131B16] text-sm leading-relaxed">
                        {s.contactAddress || s.companyAddress}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-[#1E6B3A]" />
                    </div>
                    <div>
                      <p className="text-[#4A564E] text-sm mb-0.5">{t('pages.contact.infoPhone')}</p>
                      <a href={telLink(s.contactPhone1 || s.companyPhone)} className="text-[#131B16] text-sm font-medium hover:text-[#1E6B3A] transition-colors block">
                        {s.contactPhone1 || s.companyPhone}
                      </a>
                      {s.contactPhone2 && (
                        <a href={telLink(s.contactPhone2)} className="text-[#131B16] text-sm font-medium hover:text-[#1E6B3A] transition-colors block mt-0.5">
                          {s.contactPhone2}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[#1E6B3A]" />
                    </div>
                    <div>
                      <p className="text-[#4A564E] text-sm mb-0.5">{t('pages.contact.infoEmail')}</p>
                      <a href={getMailtoLink(s, s.contactEmail1 || s.companyEmail)} className="text-[#131B16] text-sm font-medium hover:text-[#1E6B3A] transition-colors block">
                        {s.contactEmail1 || s.companyEmail}
                      </a>
                      {s.contactEmail2 && (
                        <a href={getMailtoLink(s, s.contactEmail2)} className="text-[#131B16] text-sm font-medium hover:text-[#1E6B3A] transition-colors block mt-0.5">
                          {s.contactEmail2}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#1E6B3A]" />
                    </div>
                    <div>
                      <p className="text-[#4A564E] text-sm mb-0.5">{t('pages.contact.infoHours')}</p>
                      <p className="text-[#131B16] text-sm font-medium">{s.officeHours.split(',').map(p => p.trim()).shift()}</p>
                      {s.officeHours.split(',').length > 1 && (
                        <p className="text-[#4A564E] text-xs mt-0.5">{s.officeHours.split(',').slice(1).join(',').trim()}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* WhatsApp Button */}
                {getWhatsAppLink(s) !== '#' && (
                <a
                  href={getWhatsAppLink(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 h-12 rounded-md bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-base transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t('pages.contact.whatsapp')}
                </a>
                )}
              </div>

              {/* Map Card */}
              <div className="premium-card rounded-2xl overflow-hidden">
                <div className="relative h-[300px]">
                  <iframe
                    src={s.contactMapEmbed || `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(s.contactAddress || s.companyAddress)}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${s.companyName} ${t('pages.contact.mapOfficeLocation')}`}
                    className="absolute inset-0"
                  />
                  {/* Gradient overlay at edges to blend with card */}
                  <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>
                {/* Map info bar */}
                <div className="p-4 flex items-center justify-between border-t border-border">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1E6B3A]" />
                    <span className="text-[#131B16] text-sm font-medium">{(s.contactAddress || s.companyAddress).split(',').slice(2, 4).join(',').trim()}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(s.contactAddress || s.companyAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1E6B3A]/30 text-[#1E6B3A] text-xs font-medium hover:bg-[#1E6B3A]/10 transition-colors"
                  >
                    {t('pages.contact.directions')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section ref={faqRef} className="py-16 md:py-20 bg-[#F4F2EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-[#4A564E] text-base sm:text-lg mb-4">
              {t('pages.contact.faqPrompt')}
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-[#1E6B3A] hover:text-[#166B34] font-semibold text-base transition-colors"
            >
              {t('pages.contact.faqLink')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}