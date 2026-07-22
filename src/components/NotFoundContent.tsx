'use client'

import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/use-ui-strings'

/** 404 body. Copy is admin-editable via the UI Text panel (pages.notFound.*). */
export default function NotFoundContent() {
  const t = useT()
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 bg-[#FBFAF7]">
      <div className="text-center max-w-lg">
        <h1 className="text-8xl md:text-9xl font-bold font-heading text-[#A98B4F] mb-4">404</h1>

        <div className="gold-line max-w-[200px] mx-auto mb-6" />

        <h2 className="text-2xl md:text-3xl font-bold text-[#131B16] mb-3">
          {t('pages.notFound.title')}
        </h2>
        <p className="text-[#4A564E] text-base leading-relaxed mb-10">
          {t('pages.notFound.message')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button className="btn-premium font-semibold px-8 gap-2">
              <Home className="w-4 h-4" />
              {t('pages.notFound.backHome')}
            </Button>
          </Link>
          <Link href="/projects">
            <Button
              variant="outline"
              className="btn-premium-outline-light font-semibold px-8 gap-2"
            >
              <Search className="w-4 h-4" />
              {t('pages.notFound.browseProjects')}
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E2E8F0]">
          <p className="text-[#4A564E] text-sm mb-4">{t('pages.notFound.helpfulLinks')}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/about" className="text-[#4A564E] hover:text-[#1E6B3A] transition-colors">
              {t('pages.notFound.linkAbout')}
            </Link>
            <Link href="/contact" className="text-[#4A564E] hover:text-[#1E6B3A] transition-colors">
              {t('pages.notFound.linkContact')}
            </Link>
            <Link href="/blog" className="text-[#4A564E] hover:text-[#1E6B3A] transition-colors">
              {t('pages.notFound.linkBlog')}
            </Link>
            <Link href="/faq" className="text-[#4A564E] hover:text-[#1E6B3A] transition-colors">
              {t('pages.notFound.linkFaq')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
