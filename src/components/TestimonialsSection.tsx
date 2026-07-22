'use client'

import { useRef } from 'react'
import { FileCheck, CalendarClock, Receipt, Quote } from 'lucide-react'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'
import type { PublicTestimonialsPayload } from '@/app/api/testimonials/route'

/* A new company has no testimonials worth trusting — so we publish
   commitments instead, and let the record accumulate in public.
   Once real testimonials exist in the database, they take over. */
const commitments = [
  {
    icon: FileCheck,
    title: 'Clear titles, always',
    body: "Each project's land is bought in Matrica's own name, with documentation you can independently verify — before you pay a single taka.",
  },
  {
    icon: CalendarClock,
    title: 'Honest timelines',
    body: 'Development milestones are published and kept current. If a date moves, you hear it from us first, with the reason.',
  },
  {
    icon: Receipt,
    title: 'Transparent pricing',
    body: 'One price sheet. No hidden charges, no surprise fees — every payment against a written schedule and a receipt.',
  },
]

export default function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const t = useT()

  // DB-driven testimonials (admin-managed) — commitments stay as fallback
  const { data } = usePublicData<PublicTestimonialsPayload>('/api/testimonials')
  const testimonials =
    data?.testimonials && data.testimonials.length > 0 ? data.testimonials : null

  // Section header copy — admin-managed via the `testimonials_section` content
  // section (subtitle = eyebrow, title = heading, content = intro); the
  // presence-driven literals below stay as fallback.
  const { data: cs } =
    usePublicData<Record<string, { title?: string; subtitle?: string; content?: string }>>('/api/content-sections')
  const ts = cs?.testimonials_section

  return (
    <section className="py-24 md:py-36 bg-[#F3F1EB] relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 md:mb-20">
          <span className="eyebrow-plot mb-5">
            {ts?.subtitle ?? (testimonials ? 'Testimonials' : 'Our Word')}
          </span>
          <h2 className="display-title mt-4">
            {ts?.title ? (
              ts.title
            ) : testimonials ? (
              <>
                What our clients <em className="font-normal">say</em>
              </>
            ) : (
              <>
                What we promise, <em className="font-normal">in writing</em>
              </>
            )}
          </h2>
          <RichText
            className="text-[#4A544E] text-base sm:text-lg max-w-xl mx-auto mt-6 font-light leading-relaxed"
            html={ts?.content ??
              (testimonials
                ? 'Words from the families and investors who chose to build their record with us.'
                : 'We are a new company. We have no decades to point to — only the record we are building now, plot by plot, in public.')}
          />
        </div>

        {/* Commitment / testimonial cards — quiet, architectural */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px max-w-6xl mx-auto bg-[#121814]/10 border border-[#121814]/10">
          {testimonials
            ? testimonials.map((t, i) => (
                <div
                  key={t.id}
                  className="bg-[#FAF9F6] p-9 lg:p-12 flex flex-col"
                >
                  {t.photo ? (
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover mb-7"
                    />
                  ) : (
                    <Quote className="w-5 h-5 text-[#A98B4F] mb-7" strokeWidth={1.5} />
                  )}
                  <h3 className="font-heading text-xl lg:text-2xl text-[#121814] mb-4">
                    {t.name}
                  </h3>
                  <RichText
                    html={t.content}
                    className="text-[#4A544E] text-[0.95rem] leading-relaxed font-light"
                  />
                  {t.designation && (
                    <p className="mt-5 text-[#707A72] text-[0.68rem] tracking-[0.28em] uppercase">
                      {t.designation}
                    </p>
                  )}
                </div>
              ))
            : commitments.map((c, i) => {
                const Icon = c.icon
                return (
                  <div
                    key={c.title}
                    className="bg-[#FAF9F6] p-9 lg:p-12 flex flex-col"
                  >
                    <Icon className="w-5 h-5 text-[#A98B4F] mb-7" strokeWidth={1.5} />
                    <h3 className="font-heading text-xl lg:text-2xl text-[#121814] mb-4">
                      {c.title}
                    </h3>
                    <p className="text-[#4A544E] text-[0.95rem] leading-relaxed font-light">
                      {c.body}
                    </p>
                  </div>
                )
              })}
        </div>

        <p className="text-center mt-14 text-[#707A72] text-[0.68rem] tracking-[0.28em] uppercase">
          {t('home.testimonials.recordline')}
        </p>
      </div>
    </section>
  )
}
