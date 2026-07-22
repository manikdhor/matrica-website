'use client'

import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'

interface PaymentPlan {
  id: string
  name: string
  startingPrice: string
  size: string
  badge?: string
  popular: boolean
  features: string[]
}

// Minimal fallback — used until the admin plans load / on failure / when empty.
const FALLBACK_PLANS: PaymentPlan[] = [
  {
    id: 'fallback-chandra-chaya',
    name: 'Chandra Chaya',
    startingPrice: 'Price on request',
    size: '3, 5 & 10 Katha',
    features: ['Planned per RAJUK policy', 'Next to Zinda Park', "60', 30', 25' Roads", 'Green Corridors', 'Company-owned land'],
    popular: false,
  },
  {
    id: 'fallback-ventura-city',
    name: 'Ventura City',
    startingPrice: 'Price on request',
    size: '3 & 5 Katha',
    features: ['Planned per RAJUK policy', 'Beside Purbachal New Town', "25', 50' Roads", 'Electricity on site', 'Easy EMI Options'],
    popular: true,
  },
  {
    id: 'fallback-premium-plot',
    name: 'Premium Plot',
    startingPrice: 'Price on request',
    size: '10+ Katha & Combined',
    features: ['Corner Plots', 'Road Facing', 'Park Facing', 'Priority Booking', 'Dedicated Relationship Manager'],
    popular: false,
  },
]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
}

export default function PaymentPlans() {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const { data } = usePublicData<PaymentPlan[]>('/api/payment-plans')
  const plans = Array.isArray(data) && data.length > 0 ? data : FALLBACK_PLANS

  return (
    <section id="pricing" className="py-20 md:py-28 bg-white relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <span className="section-label label-premium text-[#A98B4F]">
            {t('projects.payment.label')}
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-[#1A202C] mb-4"
            style={{ fontFamily: 'var(--font-heading), Georgia, serif' }}
          >
            {t('projects.payment.heading')}
          </h2>
          <p className="text-[#334155] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('projects.payment.subheading')}
          </p>
        </motion.div>

        {/* EMI Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A98B4F]/10 border border-[#A98B4F]/25">
            <Sparkles className="w-4 h-4 text-[#A98B4F]" />
            <span className="text-sm font-medium text-[#1A202C]">{t('projects.payment.emiBadge')}</span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className={plan.popular ? 'md:-mt-4 md:mb-0' : ''}
            >
              <div
                className={`relative h-full flex flex-col p-6 lg:p-8 rounded-2xl border transition-all duration-400 ${
                  plan.popular
                    ? 'border-[#1E6B3A]/30 bg-white'
                    : 'border-[#E2E8F0] bg-white'
                }`}
                style={
                  plan.popular
                    ? { boxShadow: '0 4px 16px rgba(30, 107, 58, 0.12), 0 8px 32px rgba(30, 107, 58, 0.06)' }
                    : { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)' }
                }
              >
                {/* Gold/Green top border for popular */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#A98B4F] via-[#1E6B3A] to-[#A98B4F]" />
                )}

                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1E6B3A] text-white text-xs font-semibold tracking-wider uppercase">
                      <Sparkles className="w-3 h-3" />
                      {plan.badge || 'Most Popular'}
                    </span>
                  </div>
                )}

                {/* Project Name */}
                <h3
                  className={`text-lg font-semibold mb-1 ${plan.popular ? 'mt-2' : ''} ${
                    plan.popular ? 'text-[#1E6B3A]' : 'text-[#1A202C]'
                  }`}
                  style={{ fontFamily: 'var(--font-heading), Georgia, serif' }}
                >
                  {plan.name}
                </h3>

                {/* Sizes */}
                <p className="text-[#334155] text-sm mb-4">{plan.size}</p>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-[#334155] text-xs font-medium uppercase tracking-wider mb-1">
                    {t('projects.payment.startingFrom')}
                  </p>
                  <p
                    className={`text-3xl lg:text-4xl font-bold ${
                      plan.popular ? 'text-[#1E6B3A]' : 'text-[#A98B4F]'
                    }`}
                    style={{ fontFamily: 'var(--font-heading), Georgia, serif' }}
                  >
                    {plan.startingPrice}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-[#E2E8F0] mb-6" />

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.popular ? 'bg-[#1E6B3A]/10' : 'bg-[#A98B4F]/10'
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${
                            plan.popular ? 'text-[#1E6B3A]' : 'text-[#A98B4F]'
                          }`}
                        />
                      </div>
                      <span className="text-[#334155] text-sm leading-snug">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href="/contact"
                  className={plan.popular ? 'btn-premium w-full justify-center' : 'btn-premium-outline-light w-full justify-center'}
                >
                  {plan.popular ? t('projects.payment.getStarted') : t('projects.payment.enquireNow')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Line */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center text-[#334155] text-sm mt-10"
        >
          {t('projects.payment.trustLine')}
        </motion.p>
      </div>
    </section>
  )
}