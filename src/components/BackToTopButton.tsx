'use client'
import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'
import { useT } from '@/lib/use-ui-strings'

export default function BackToTopButton() {
  const t = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`back-to-top ${visible ? 'visible' : ''}`}
      aria-label={t('chrome.backtotopbutton.aria')}
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  )
}