'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Car, Users, Clock, ChevronRight, Loader2, Calendar, Phone, Eye, Star, ShieldCheck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import PageHero from '@/components/PageHero'
import { useSiteSettings } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useSiteProjectsOrdered } from '@/lib/use-projects'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import type { PublicTestimonialsPayload } from '@/app/api/testimonials/route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const valueProps = [
  {
    icon: Car,
    titleKey: 'pages.siteVisit.valuePropTransportTitle',
    descKey: 'pages.siteVisit.valuePropTransportDesc',
  },
  {
    icon: Users,
    titleKey: 'pages.siteVisit.valuePropGuidanceTitle',
    descKey: 'pages.siteVisit.valuePropGuidanceDesc',
  },
  {
    icon: Clock,
    titleKey: 'pages.siteVisit.valuePropObligationTitle',
    descKey: 'pages.siteVisit.valuePropObligationDesc',
  },
]

const timeSlots = [
  { value: 'morning', labelKey: 'pages.siteVisit.timeSlotMorning' },
  { value: 'afternoon', labelKey: 'pages.siteVisit.timeSlotAfternoon' },
  { value: 'late-afternoon', labelKey: 'pages.siteVisit.timeSlotLateAfternoon' },
]

const visitorCounts = ['1', '2', '3', '4', '5+']

const howItWorksSteps = [
  { icon: Calendar, titleKey: 'pages.siteVisit.stepBookTitle', descKey: 'pages.siteVisit.stepBookDesc' },
  { icon: Phone, titleKey: 'pages.siteVisit.stepConfirmTitle', descKey: 'pages.siteVisit.stepConfirmDesc' },
  { icon: Car, titleKey: 'pages.siteVisit.stepTransportTitle', descKey: 'pages.siteVisit.stepTransportDesc' },
  { icon: Eye, titleKey: 'pages.siteVisit.stepVisitTitle', descKey: 'pages.siteVisit.stepVisitDesc' },
]

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export default function SiteVisitPage() {
  const s = useSiteSettings()
  const t = useT()
  // Booking-form project selector follows the admin-managed projects list
  const { projects } = useSiteProjectsOrdered()

  // Real testimonials only — admin-managed via /api/testimonials. When none
  // are published the section is hidden entirely (no fabricated quotes).
  const { data: tData } = usePublicData<PublicTestimonialsPayload>('/api/testimonials')
  const testimonials =
    tData?.testimonials && tData.testimonials.length > 0 ? tData.testimonials : null
  const officeArea = s.companyAddress.split(',').map(p => p.trim()).find(p => /^[A-Za-z]/.test(p) && !/House|Road/.test(p)) || s.companyAddress.split(',')[2]?.trim() || 'our office'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    projectId: '',
    preferredDate: '',
    preferredTime: '',
    peopleCount: '',
    freeTransport: true,
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const topRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(topRef, { once: true, margin: '-80px' })

  const today = new Date().toISOString().split('T')[0]

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    setFormData((prev) => ({
      ...prev,
      freeTransport: checked === true,
    }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = t('pages.siteVisit.errName')
    if (!formData.phone.trim()) newErrors.phone = t('pages.siteVisit.errPhone')
    if (!formData.preferredDate)
      newErrors.preferredDate = t('pages.siteVisit.errDate')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(t('pages.siteVisit.toastConfirmedTitle'), {
          description: t('pages.siteVisit.toastConfirmedDesc'),
        })
        setFormData({
          name: '',
          phone: '',
          email: '',
          projectId: '',
          preferredDate: '',
          preferredTime: '',
          peopleCount: '',
          freeTransport: true,
          message: '',
        })
      } else {
        toast.error(t('pages.siteVisit.toastFailedTitle'), {
          description: data.error || t('pages.siteVisit.toastFailedDesc'),
        })
      }
    } catch {
      toast.error(t('pages.siteVisit.toastNetworkTitle'), {
        description: t('pages.siteVisit.toastNetworkDesc'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen page-enter">
      {/* Chapter opener */}
      <div ref={topRef}>
        <PageHero
          plotNo="Sheet 06"
          eyebrow={t('pages.siteVisit.heroEyebrow')}
          title={
            <>
              {t('pages.siteVisit.heroTitleLine1')}
              <br />
              {t('pages.siteVisit.heroTitleLine2Pre')} <span className="accent-word-gold">{t('pages.siteVisit.heroTitleAccent')}</span>.
            </>
          }
          subtitle={t('pages.siteVisit.heroSubtitle')}
        />
      </div>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-[#FBFAF7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="eyebrow-plot">{t('pages.siteVisit.howItWorksEyebrow')}</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#131B16] mb-3">
              {t('pages.siteVisit.howItWorksTitlePre')} <span className="text-[#1E6B3A]">{t('pages.siteVisit.howItWorksTitleAccent')}</span>
            </h2>
            <div className="w-16 h-[2px] bg-[#1E6B3A] mx-auto rounded-full" />
          </motion.div>

          {/* Desktop: horizontal timeline */}
          <div className="hidden md:grid md:grid-cols-4 relative">
            {/* Green connecting line */}
            <div className="absolute top-8 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-[2px] bg-gradient-to-r from-[#1E6B3A]/20 via-[#1E6B3A] to-[#1E6B3A]/20" />

            {howItWorksSteps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <motion.div
                  key={step.titleKey}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="flex flex-col items-center text-center relative z-10"
                >
                  {/* Numbered circle */}
                  <div className="w-16 h-16 rounded-full bg-[#1E6B3A] flex items-center justify-center mb-4">
                    <span className="text-white text-lg font-bold">{index + 1}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-4 -mt-10">
                    <StepIcon className="w-5 h-5 text-[#1E6B3A]" />
                  </div>
                  <h3 className="text-[#131B16] font-semibold text-base mb-1.5">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-[#4A564E] text-sm">{t(step.descKey).replace('Gulshan-2', officeArea)}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Mobile: vertical timeline */}
          <div className="flex flex-col gap-8 md:hidden">
            {howItWorksSteps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <motion.div
                  key={step.titleKey}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.12, duration: 0.4 }}
                  className="flex items-start gap-4 relative"
                >
                  {/* Vertical line segment */}
                  {index < howItWorksSteps.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-gradient-to-b from-[#1E6B3A]/60 to-[#1E6B3A]/10" />
                  )}
                  {/* Numbered circle */}
                  <div className="w-10 h-10 rounded-full bg-[#1E6B3A] flex items-center justify-center shrink-0 z-10">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                      <StepIcon className="w-4 h-4 text-[#1E6B3A]" />
                    </div>
                    <div>
                      <h3 className="text-[#131B16] font-semibold text-base mb-0.5">
                        {t(step.titleKey)}
                      </h3>
                      <p className="text-[#4A564E] text-sm">{t(step.descKey).replace('Gulshan-2', officeArea)}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 md:py-20 bg-[#F4F2EC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valueProps.map((prop, index) => {
              const Icon = prop.icon
              return (
                <motion.div
                  key={prop.titleKey}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: index * 0.12, duration: 0.5 }}
                  className="premium-card text-center p-8"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1E6B3A] mb-5" />
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-7 h-7 text-[#1E6B3A]" />
                  </div>
                  <h3 className="text-[#131B16] font-bold text-lg mb-2">
                    {t(prop.titleKey)}
                  </h3>
                  <p className="text-[#4A564E] text-sm leading-relaxed">
                    {t(prop.descKey).replace(/Gulshan-2/g, officeArea)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16 md:py-20 bg-[#FBFAF7]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="premium-card p-6 sm:p-8 md:p-10 relative overflow-hidden"
          >
            {/* Decorative corner accents */}
            <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none">
              <div className="absolute top-4 right-4 w-8 h-[2px] bg-gradient-to-l from-[#1E6B3A]/60 to-transparent" />
              <div className="absolute top-4 right-4 w-[2px] h-8 bg-gradient-to-b from-[#1E6B3A]/60 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none">
              <div className="absolute bottom-4 left-4 w-8 h-[2px] bg-gradient-to-r from-[#1E6B3A]/60 to-transparent" />
              <div className="absolute bottom-4 left-4 w-[2px] h-8 bg-gradient-to-t from-[#1E6B3A]/60 to-transparent" />
            </div>

            {/* Progress indicator */}
            <span className="eyebrow-plot mb-1">{t('pages.siteVisit.formEyebrow')}</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#131B16] mb-2 text-center">
              {t('pages.siteVisit.formTitle')}
            </h2>
            <div className="w-16 h-[2px] bg-[#1E6B3A] max-w-[80px] mx-auto mt-4 mb-8 rounded-full" />

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#131B16] text-sm font-medium">
                  {t('pages.siteVisit.labelFullName')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('pages.siteVisit.phFullName')}
                  className="premium-input"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#131B16] text-sm font-medium">
                  {t('pages.siteVisit.labelPhone')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('pages.siteVisit.phPhone')}
                  className="premium-input"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#131B16] text-sm font-medium">
                  {t('pages.siteVisit.labelEmail')} <span className="text-[#4A564E] text-xs font-normal">{t('pages.siteVisit.optional')}</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('pages.siteVisit.phEmail')}
                  className="premium-input"
                />
              </div>

              {/* Select Project */}
              <div className="space-y-2">
                <Label className="text-[#131B16] text-sm font-medium">{t('pages.siteVisit.labelSelectProject')}</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(v) => handleSelectChange('projectId', v)}
                >
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-[#1E6B3A] focus:border-[#1E6B3A] text-[#131B16]">
                    <SelectValue placeholder={t('pages.siteVisit.phSelectProject')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {projects.map((p) => (
                      <SelectItem
                        key={p.slug}
                        value={p.slug}
                        className="text-[#131B16] focus:bg-[#1E6B3A]/10 focus:text-[#1E6B3A]"
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Preferred Date */}
                <div className="space-y-2">
                  <Label htmlFor="preferredDate" className="text-[#131B16] text-sm font-medium">
                    {t('pages.siteVisit.labelPreferredDate')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="preferredDate"
                    name="preferredDate"
                    type="date"
                    min={today}
                    value={formData.preferredDate}
                    onChange={handleChange}
                    className="premium-input [color-scheme:light]"
                  />
                  {errors.preferredDate && (
                    <p className="text-red-500 text-xs">{errors.preferredDate}</p>
                  )}
                </div>

                {/* Preferred Time */}
                <div className="space-y-2">
                  <Label className="text-[#131B16] text-sm font-medium">{t('pages.siteVisit.labelPreferredTime')}</Label>
                  <Select
                    value={formData.preferredTime}
                    onValueChange={(v) => handleSelectChange('preferredTime', v)}
                  >
                    <SelectTrigger className="bg-white border-gray-200 focus:ring-[#1E6B3A] focus:border-[#1E6B3A] text-[#131B16]">
                      <SelectValue placeholder={t('pages.siteVisit.phSelectTime')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {timeSlots.map((slot) => (
                        <SelectItem
                          key={slot.value}
                          value={slot.value}
                          className="text-[#131B16] focus:bg-[#1E6B3A]/10 focus:text-[#1E6B3A]"
                        >
                          {t(slot.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Number of Visitors */}
              <div className="space-y-2">
                <Label className="text-[#131B16] text-sm font-medium">{t('pages.siteVisit.labelVisitors')}</Label>
                <Select
                  value={formData.peopleCount}
                  onValueChange={(v) => handleSelectChange('peopleCount', v)}
                >
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-[#1E6B3A] focus:border-[#1E6B3A] text-[#131B16]">
                    <SelectValue placeholder={t('pages.siteVisit.phVisitors')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {visitorCounts.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        className="text-[#131B16] focus:bg-[#1E6B3A]/10 focus:text-[#1E6B3A]"
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Free Transport Checkbox */}
              <div className="flex items-center space-x-3 pt-1">
                <Checkbox
                  id="freeTransport"
                  checked={formData.freeTransport}
                  onCheckedChange={handleCheckboxChange}
                  className="border-[#1E6B3A] data-[state=checked]:bg-[#1E6B3A] data-[state=checked]:border-[#1E6B3A]"
                />
                <Label
                  htmlFor="freeTransport"
                  className="text-[#131B16] text-sm cursor-pointer"
                >
                  {t('pages.siteVisit.freeTransportPre')} {officeArea} {t('pages.siteVisit.freeTransportPost')}
                </Label>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-[#131B16] text-sm font-medium">
                  {t('pages.siteVisit.labelMessage')}{' '}
                  <span className="text-[#4A564E] text-xs font-normal">{t('pages.siteVisit.optional')}</span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('pages.siteVisit.phMessage')}
                  rows={3}
                  className="premium-input resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1E6B3A] text-white hover:bg-[#166B34] font-semibold text-base py-6 mt-4 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('pages.siteVisit.booking')}
                  </>
                ) : (
                  t('pages.siteVisit.confirmBooking')
                )}
              </Button>

              {/* Trust indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 pt-2">
                <span className="flex items-center gap-1.5 text-slate-600 text-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t('pages.siteVisit.trustSecure')}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('pages.siteVisit.trustNoObligation')}
                </span>
              </div>
            </form>
          </motion.div>

          {/* Note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center text-[#4A564E] text-sm mt-8"
          >
            {t('pages.siteVisit.notePre')}{' '}
            <span className="text-[#1E6B3A] font-medium">{t('pages.siteVisit.noteHighlight')}</span> {t('pages.siteVisit.notePost')}
          </motion.p>
        </div>
      </section>

      {/* Testimonials — only rendered when real ones are published */}
      {testimonials && (
        <section className="py-16 md:py-20 bg-[#F4F2EC]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="eyebrow-plot">{t('pages.siteVisit.testimonialsEyebrow')}</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#131B16] mb-3">
                {t('pages.siteVisit.testimonialsTitlePre')} <span className="text-[#1E6B3A]">{t('pages.siteVisit.testimonialsTitleAccent')}</span> {t('pages.siteVisit.testimonialsTitlePost')}
              </h2>
              <div className="w-16 h-[2px] bg-[#1E6B3A] max-w-[80px] mx-auto rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.12, duration: 0.5 }}
                  className="premium-card p-6 flex flex-col"
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: Math.max(1, Math.min(5, t.rating || 5)) }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#1E6B3A] text-[#1E6B3A]" />
                    ))}
                  </div>
                  <p className="text-[#131B16]/80 text-sm leading-relaxed mb-5 flex-1">
                    &ldquo;<RichText as="span" html={t.content} />&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center overflow-hidden">
                      {t.photo ? (
                        <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#1E6B3A] text-xs font-bold">{initialsOf(t.name)}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#131B16] text-sm font-medium block">{t.name}</span>
                      {t.designation && (
                        <span className="text-[#4A564E] text-xs">{t.designation}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}