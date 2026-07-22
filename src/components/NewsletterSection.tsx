'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useT } from '@/lib/use-ui-strings'

export default function NewsletterSection() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success(t('home.newsletter.toastSuccess'))
        setEmail('')
        setSubmitted(true)
      } else {
        toast.error(t('home.newsletter.toastError'))
      }
    } catch {
      toast.error(t('home.newsletter.toastNetwork'))
    }
    setLoading(false)
  }

  return (
    <section className="relative w-full py-14 md:py-16 overflow-hidden">
      {/* Green line at top */}
      <div className="gold-line" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
            {t('home.newsletter.heading')}
          </h2>
          <p className="text-green-200/70 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
            {t('home.newsletter.sub')}
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3"
          >
            <CheckCircle className="w-10 h-10 text-[#4ADE80]" />
            <p className="text-white font-medium text-base">
              {t('home.newsletter.thanks')}
            </p>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <Input
              type="email"
              required
              placeholder={t('home.newsletter.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 rounded-md bg-white/10 border-white/10 text-white placeholder:text-green-200/30 focus:border-[#1E6B3A] focus:ring-[#1E6B3A]/20"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1E6B3A] text-white hover:bg-[#28945A] font-semibold h-12 px-6 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">{t('home.newsletter.submitting')}</span>
              ) : (
                <>
                  {t('home.newsletter.submit')}
                  <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.form>
        )}
      </div>
    </section>
  )
}