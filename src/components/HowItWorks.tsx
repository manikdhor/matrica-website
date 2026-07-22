'use client'

import { type LucideIcon } from 'lucide-react'
import {
  Search, Calendar, MapPin, KeyRound, Key, Home, Building2, Phone, Mail,
  FileText, FileCheck, Users, Shield, ShieldCheck, Award, Star, Handshake,
  CircleDot, Check, CheckCircle, Landmark, Compass, Map, Route,
  ClipboardList, ClipboardCheck, Wallet, CreditCard, Car, Eye, Heart,
  TrendingUp, Target,
} from 'lucide-react'
import { useSiteSettings } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'

interface PublicSection {
  title: string | null
  subtitle: string | null
  content: string | null
  config: string | null
}

/* Admin steps store a lucide icon NAME (picked via IconPicker) — map the
   common ones here; unknown names fall back to the per-index default icon. */
const ICON_LOOKUP: Record<string, LucideIcon> = {
  Search, Calendar, MapPin, KeyRound, Key, Home, Building2, Phone, Mail,
  FileText, FileCheck, Users, Shield, ShieldCheck, Award, Star, Handshake,
  CircleDot, Check, CheckCircle, Landmark, Compass, Map, Route,
  ClipboardList, ClipboardCheck, Wallet, CreditCard, Car, Eye, Heart,
  TrendingUp, Target,
}

const DEFAULT_STEP_ICONS: LucideIcon[] = [Search, Calendar, MapPin, KeyRound]

/* Hardcoded fallback — shown until the admin saves "How It Works" steps. */
const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Browse Projects',
    description:
      'Explore our Purbachal projects — Ventura City and Chandra Chaya — with plot sizes, roads and availability.',
  },
  {
    number: '02',
    icon: Calendar,
    title: 'Book a Visit',
    description:
      'Schedule a complimentary guided tour with free transport from our Gulshan-2 office.',
  },
  {
    number: '03',
    icon: MapPin,
    title: 'Select Your Plot',
    description:
      'Choose from available 3, 5, or 10 Katha residential plots in prime locations.',
  },
  {
    number: '04',
    icon: KeyRound,
    title: 'Own Your Land',
    description:
      'Complete simple registration, choose your payment plan, and receive your deed.',
  },
]

export default function HowItWorks() {
  const s = useSiteSettings()
  const t = useT()
  const officeArea = s.companyAddress.split(',').map(p => p.trim()).find(p => /^[A-Za-z]/.test(p) && !/House|Road/.test(p)) || s.companyAddress.split(',')[2]?.trim() || 'our office'

  // Admin-managed content section — hardcoded steps stay as fallback
  const { data: sections } = usePublicData<Record<string, PublicSection>>('/api/content-sections')
  const section = sections?.how_it_works

  let displaySteps = steps
  if (section?.config) {
    try {
      const cfg = JSON.parse(section.config) as {
        steps?: { number?: number; title?: string; description?: string; icon?: string }[]
      }
      const dbSteps = (cfg.steps ?? []).filter(st => st?.title?.trim())
      if (dbSteps.length > 0) {
        displaySteps = dbSteps.map((st, i) => ({
          number: String(
            typeof st.number === 'number' && Number.isFinite(st.number) && st.number > 0
              ? st.number
              : i + 1
          ).padStart(2, '0'),
          icon: ICON_LOOKUP[st.icon ?? ''] ?? DEFAULT_STEP_ICONS[i % DEFAULT_STEP_ICONS.length],
          title: st.title!.trim(),
          description: st.description?.trim() || '',
        }))
      }
    } catch { /* malformed config — keep hardcoded fallback */ }
  }

  return (
    <section className="py-24 md:py-32 bg-[#FBFAF7] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="eyebrow-plot mb-5">
            {t('home.how.eyebrow')}
          </span>
          <h2 className="display-title mt-4">
            {t('home.how.headingPrefix')}
            <br />
            <span className="accent-word">{t('home.how.headingAccent')}</span>
          </h2>
          <p className="text-[#4A564E] text-base sm:text-lg max-w-xl mx-auto leading-relaxed mt-5">
            {t('home.how.sub')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14 relative">
          {/* Dashed boundary connector — desktop */}
          <div
            className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px z-0"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(201,168,76,0.55) 50%, transparent 50%)',
              backgroundSize: '10px 1px',
            }}
          />

          {displaySteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="relative z-10"
              >
                {/* Ghost numeral behind content */}
                <span className="ghost-numeral absolute -top-9 left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0">
                  {step.number}
                </span>

                <div className="relative pt-12 text-center lg:text-left">
                  <div className="icon-premium mx-auto lg:mx-0 mb-5 bg-[#FBFAF7]">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="font-heading text-[#131B16] text-lg font-semibold mb-2.5">
                    {step.title}
                  </h3>

                  <p className="text-[#4A564E] text-sm leading-relaxed max-w-[260px] mx-auto lg:mx-0">
                    <RichText as="span" html={step.description.replace('Gulshan-2 office', officeArea + ' office')} />
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
