'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Car, Users, Clock, ArrowRight } from 'lucide-react'
import { useT } from '@/lib/use-ui-strings'

const valueProps = [
  {
    icon: Car,
    titleKey: 'home.sitevisit.prop1Title',
    descKey: 'home.sitevisit.prop1Desc',
  },
  {
    icon: Users,
    titleKey: 'home.sitevisit.prop2Title',
    descKey: 'home.sitevisit.prop2Desc',
  },
  {
    icon: Clock,
    titleKey: 'home.sitevisit.prop3Title',
    descKey: 'home.sitevisit.prop3Desc',
  },
]

export default function SiteVisitSection() {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="site-visit" className="py-20 md:py-28 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <span className="label-premium text-[#A98B4F] section-label">{t('home.sitevisit.eyebrow')}</span>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A202C]">
            {t('home.sitevisit.heading')}
          </h2>
          <p className="text-[#334155] text-base sm:text-lg max-w-2xl mx-auto mt-4">
            {t('home.sitevisit.sub')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon
            return (
              <motion.div
                key={prop.titleKey}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.12, duration: 0.5 }}
                className="premium-card text-center p-8"
              >
                <div className="icon-premium-lg mx-auto mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-[#1A202C] font-bold text-lg mb-2">
                  {t(prop.titleKey)}
                </h3>
                <p className="text-[#334155] text-sm leading-relaxed">{t(prop.descKey)}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center"
        >
          <Link href="/site-visit" className="btn-premium">
            {t('home.sitevisit.cta')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}