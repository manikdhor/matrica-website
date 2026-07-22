'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { useSiteSettings } from '@/lib/use-site-settings'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import RajukSeal from './RajukSeal'
import { shimmerBlurDataURL } from '@/lib/blur-placeholder'

interface PublicSection {
  title: string | null
  subtitle: string | null
  content: string | null
  image: string | null
  config: string | null
}

/* Hardcoded fallback — shown until the admin saves "Why Choose Us" features. */
const commitments = [
  {
    title: 'Land held in the company name',
    detail: "land bought in Matrica's own name — registered deed follows immediately after payment.",
  },
  {
    title: 'Prime Purbachal locations',
    detail: 'beside RAJUK Purbachal New Town and Zinda Park, on the 300-ft Asian Highway corridor.',
  },
  {
    title: 'Infrastructure on the ground',
    detail: 'wide roads and civic amenities developed on site — electricity already live at Ventura City.',
  },
  {
    title: 'Transparent pricing',
    detail: 'no hidden charges — the quoted price is the final price.',
  },
]

export default function WhyChooseUs() {
  const s = useSiteSettings()
  const t = useT()
  const cn = s.companyName

  // Admin-managed content section — hardcoded copy stays as fallback
  const { data: sections } = usePublicData<Record<string, PublicSection>>('/api/content-sections')
  const section = sections?.why_choose_us

  let items = commitments
  let secondaryImage = ''
  if (section?.config) {
    try {
      const cfg = JSON.parse(section.config) as {
        features?: { icon?: string; title?: string; description?: string }[]
        secondaryImage?: string
      }
      const features = (cfg.features ?? []).filter(f => f?.title?.trim())
      if (features.length > 0) {
        items = features.map(f => ({
          title: f.title!.trim(),
          detail: f.description?.trim() || '',
        }))
      }
      secondaryImage = cfg.secondaryImage?.trim() || ''
    } catch { /* malformed config — keep hardcoded fallback */ }
  }
  const intro = section?.content?.trim()
  const mainImage = section?.image?.trim() || '/images/project-ventura.webp'
  const offsetImage = secondaryImage || '/images/about-office.webp'

  return (
    <section id="about" className="py-24 md:py-32 bg-[#F4F2EC] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left — Text (5 cols) */}
          <div className="lg:col-span-5">
            <span className="eyebrow-plot eyebrow-plot-left mb-6">
              {t('home.why.eyebrow')}
            </span>

            <h2 className="display-title mt-5 mb-6">
              {t('home.why.headingLine1')}
              <br />
              {t('home.why.headingLine2')} <em className="font-normal">{t('home.why.headingAccent')}</em>.
            </h2>

            <p className="text-[#4A544E] text-base sm:text-lg leading-relaxed mb-9 max-w-lg font-light">
              {intro || (
                <>
                  {cn} is a new developer doing this the old-fashioned way:
                  land secured, RAJUK approvals in hand, and infrastructure
                  built before a single handover — because a young company
                  only gets one chance at a reputation.
                </>
              )}
            </p>

            <ul className="check-list mb-10">
              {items.map((item) => (
                <li key={item.title}>
                  <span>
                    <strong>{item.title}</strong>
                    {item.detail && <> — <RichText as="span" html={item.detail} /></>}
                  </span>
                </li>
              ))}
            </ul>

            <Link href="/about" className="link-premium">
              {t('home.why.learnMore')}
              <ArrowRight className="w-4 h-4 link-arrow" />
            </Link>
          </div>

          {/* Right — Layered imagery (7 cols) */}
          <div className="lg:col-span-7 relative">
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden elev-md ml-0 lg:ml-10">
              <div className="relative h-[380px] lg:h-[500px]">
                <Image
                  src={mainImage}
                  alt="MATRICA premium land development in Purbachal"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={shimmerBlurDataURL()}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071410]/30 via-transparent to-transparent" />
              </div>
            </div>

            {/* Offset secondary image — desktop */}
            <div className="hidden lg:block absolute -bottom-10 left-0 w-56 h-40 rounded-xl overflow-hidden elev-lg border-4 border-[#F4F2EC]">
              <Image
                src={offsetImage}
                alt="MATRICA office"
                fill
                sizes="224px"
                className="object-cover"
                placeholder="blur"
                blurDataURL={shimmerBlurDataURL()}
              />
            </div>

            {/* Floating seal card */}
            <div className="absolute -top-6 right-4 lg:-top-8 lg:right-8 bg-[#071410]/90 backdrop-blur-md rounded-2xl p-4 elev-lg">
              <RajukSeal size={84} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
