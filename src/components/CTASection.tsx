'use client'

import { useState, useRef } from 'react'
import { Phone, MessageCircle, Send, Loader2, Car, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useSiteSettings, getPhoneLink, getWhatsAppLink } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useSiteProjectsOrdered } from '@/lib/use-projects'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'

interface PublicSection {
  title: string | null
  subtitle: string | null
  content: string | null
  config: string | null
}

/* Site-visit value props — merged from the former SiteVisitSection */
const visitProps = [
  { icon: Car, textKey: 'home.cta.prop1' },
  { icon: Users, textKey: 'home.cta.prop2' },
  { icon: Clock, textKey: 'home.cta.prop3' },
]

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null)
  const s = useSiteSettings()
  const t = useT()
  // Lead-form project dropdown follows the admin-managed projects list
  const { projects } = useSiteProjectsOrdered()

  // Admin-managed CTA copy — hardcoded heading/subtitle stay as fallback
  const { data: sections } = usePublicData<Record<string, PublicSection>>('/api/content-sections')
  const cta = sections?.cta_section
  const heading = cta?.title?.trim()
  const body = cta?.content?.trim() || cta?.subtitle?.trim()

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    projectId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error(t('home.cta.toastNamePhone'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'contact',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(t('home.cta.toastSuccess'))
        setForm({ name: '', phone: '', email: '', projectId: '' })
      } else {
        toast.error(data.error || t('home.cta.toastError'))
      }
    } catch {
      toast.error(t('home.cta.toastNetwork'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="contact"
      className="relative py-24 md:py-36 overflow-hidden"
      ref={ref}
      style={{
        background:
          'linear-gradient(165deg, #071410 0%, #0C271B 50%, #0A3018 85%, #071410 100%)',
      }}
    >
      {/* Survey grid + gold hairline — mirrors the stats band, bookends the page */}
      <div className="absolute inset-0 plot-grid-dark pointer-events-none" />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 15%, rgba(201,168,76,0.5) 50%, transparent 85%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left — Text */}
          <div>
            <span className="eyebrow-plot eyebrow-plot-dark eyebrow-plot-left mb-6">
              {t('home.cta.eyebrow')}
            </span>

            <h2 className="display-title display-title-dark mt-5 mb-6">
              {heading || (
                <>
                  Walk the land
                  <br />
                  before you <span className="accent-word-gold">own it</span>.
                </>
              )}
            </h2>

            {body ? (
              <RichText
                html={body}
                className="text-white/75 text-base sm:text-lg leading-relaxed mb-9 max-w-md"
              />
            ) : (
              <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-9 max-w-md">
                Book a complimentary site visit and see Purbachal&apos;s finest
                land development with your own eyes.
              </p>
            )}

            {/* Merged site-visit value props */}
            <ul className="space-y-4 mb-10">
              {visitProps.map((prop) => {
                const Icon = prop.icon
                return (
                  <li key={prop.textKey} className="flex items-center gap-3.5">
                    <span className="flex-shrink-0 w-9 h-9 rounded-full border border-[#A98B4F]/45 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#A98B4F]" />
                    </span>
                    <span className="text-white/85 text-sm sm:text-base">
                      {t(prop.textKey)}
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* Direct contact */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={getPhoneLink(s)}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/45 transition-all duration-300"
              >
                <Phone className="w-4 h-4 text-[#A98B4F]" />
                {s.companyPhone}
              </a>
              <a
                href={getWhatsAppLink(s)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border border-[#25D366]/40 text-white font-semibold text-sm hover:bg-[#25D366]/10 hover:border-[#25D366]/70 transition-all duration-300"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                {t('home.cta.whatsapp')}
              </a>
            </div>
          </div>

          {/* Right — Form card, elevated on the dark band */}
          <div>
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-6 md:p-9 space-y-5 elev-lg"
            >
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#131B16] mb-1.5">
                  {t('home.cta.formHeading')}
                </h3>
                <p className="text-[#4A564E] text-sm">
                  {t('home.cta.formSub')}
                </p>
              </div>

              <div>
                <label htmlFor="cta-name" className="text-sm text-[#4A564E] mb-1.5 block font-medium">
                  {t('home.cta.nameLabel')} <span className="text-red-400">*</span>
                </label>
                <Input
                  id="cta-name"
                  placeholder={t('home.cta.namePlaceholder')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="premium-input h-11"
                  required
                />
              </div>

              <div>
                <label htmlFor="cta-phone" className="text-sm text-[#4A564E] mb-1.5 block font-medium">
                  {t('home.cta.phoneLabel')} <span className="text-red-400">*</span>
                </label>
                <Input
                  id="cta-phone"
                  type="tel"
                  placeholder={t('home.cta.phonePlaceholder')}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="premium-input h-11"
                  required
                />
              </div>

              <div>
                <label htmlFor="cta-email" className="text-sm text-[#4A564E] mb-1.5 block font-medium">
                  {t('home.cta.emailLabel')} <span className="text-[#8A968E] font-normal">({t('home.cta.emailOptional')})</span>
                </label>
                <Input
                  id="cta-email"
                  type="email"
                  placeholder={t('home.cta.emailPlaceholder')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="premium-input h-11"
                />
              </div>

              <div>
                <label htmlFor="cta-project" className="text-sm text-[#4A564E] mb-1.5 block font-medium">
                  {t('home.cta.projectLabel')}
                </label>
                <Select
                  value={form.projectId}
                  onValueChange={(val) => setForm({ ...form, projectId: val })}
                >
                  <SelectTrigger id="cta-project" className="premium-input h-11 w-full">
                    <SelectValue placeholder={t('home.cta.projectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0]">
                    {projects.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="btn-premium w-full h-12 text-base"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t('home.cta.submit')}
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>

              <p className="text-[#6B776E] text-xs text-center leading-relaxed">
                {t('home.cta.consent')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
