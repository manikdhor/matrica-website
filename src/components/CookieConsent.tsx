'use client'

import { useState, useEffect, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { Cookie, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'
import RichText from '@/components/RichText'

const STORAGE_KEY = 'matrica-cookie-consent'

interface CookieCategory {
  key: string
  label: string
  description: string
  locked: boolean
}

// Current literals kept as fallbacks (used until admin config loads / on failure).
const DEFAULT_CATEGORIES: CookieCategory[] = [
  { key: 'essential', label: 'Essential', description: 'Required for the website to function', locked: true },
  { key: 'analytics', label: 'Analytics', description: 'Help us improve our website', locked: false },
  { key: 'marketing', label: 'Marketing', description: 'Used for advertising purposes', locked: false },
]

const DEFAULT_BODY =
  'We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.'

type ContentSections = Record<string, { title?: string; subtitle?: string; content?: string; image?: string; config?: string }>

/** Coerce a raw config array into CookieCategory[]. */
function toCategories(raw: unknown): CookieCategory[] {
  if (!Array.isArray(raw)) return DEFAULT_CATEGORIES
  const cats: CookieCategory[] = []
  for (const item of raw) {
    if (item && typeof item === 'object') {
      const o = item as Partial<CookieCategory>
      if (typeof o.key === 'string' && o.key) {
        cats.push({
          key: o.key,
          label: typeof o.label === 'string' ? o.label : o.key,
          description: typeof o.description === 'string' ? o.description : '',
          locked: Boolean(o.locked),
        })
      }
    }
  }
  return cats.length > 0 ? cats : DEFAULT_CATEGORIES
}

export default function CookieConsent() {
  const t = useT()
  const { data: cs } = usePublicData<ContentSections>('/api/content-sections')
  const section = cs?.['cookie_consent']
  const bodyText = section?.content ?? DEFAULT_BODY

  const categories = (() => {
    try {
      return toCategories(section?.config ? JSON.parse(section.config)?.categories : undefined)
    } catch {
      return DEFAULT_CATEGORIES
    }
  })()

  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean>>({})

  // Seed per-category prefs from config until the visitor toggles something.
  const userToggled = useRef(false)
  const catKeys = categories.map((c) => c.key).join('|')
  useEffect(() => {
    if (userToggled.current) return
    const init: Record<string, boolean> = {}
    for (const c of categories) init[c.key] = Boolean(c.locked)
    setPrefs(init)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKeys])

  useEffect(() => {
    // Short, not zero — avoids popping in on the exact frame the banner
    // mounts. The mount itself is already deferred (DeferUntilIdle in
    // NavbarFooter.tsx), so stacking a long delay here on top of that was
    // pushing this banner's paint late enough to get misattributed as the
    // page's LCP element under lab (no-interaction) performance audits.
    const timer = setTimeout(() => {
      const consent = localStorage.getItem(STORAGE_KEY)
      if (!consent) {
        setVisible(true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const acceptAll = () => {
    const all: Record<string, boolean> = {}
    for (const c of categories) all[c.key] = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    setVisible(false)
  }

  const acceptSelected = () => {
    const selected: Record<string, boolean> = { ...prefs }
    for (const c of categories) if (c.locked) selected[c.key] = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected))
    setVisible(false)
  }

  return (
    visible ? (
      <div className="fixed cookie-banner-fixed left-0 right-0 z-50 p-4 md:p-6">
        <div className="nav-glass bg-white/95 max-w-3xl mx-auto rounded-2xl border border-gray-200 p-5 md:p-6">
            {/* Main row */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-9 h-9 rounded-xl bg-[#1E6B3A]/10 flex items-center justify-center">
                  <Cookie className="w-4.5 h-4.5 text-[#1E6B3A]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1A202C] leading-relaxed">
                  <RichText as="span" html={bodyText} />{' '}
                  <button
                    onClick={() => setShowCustomize((v) => !v)}
                    className="text-[#1E6B3A] hover:text-[#1E6B3A]/80 underline underline-offset-2 inline-flex items-center gap-1"
                  >
                    {t('chrome.cookie.customize')}
                    {showCustomize ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </p>

                {/* Customize panel */}
                {showCustomize && (
                  <div className="overflow-hidden">
                    <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                      {categories.map((cat) => (
                        <div key={cat.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#1A202C]">{cat.label}</p>
                            <p className="text-xs text-[#475569]"><RichText as="span" html={cat.description} /></p>
                          </div>
                          {cat.locked ? (
                            <Switch checked disabled className="opacity-60" />
                          ) : (
                            <Switch
                              checked={prefs[cat.key] ?? false}
                              onCheckedChange={(v) => {
                                userToggled.current = true
                                setPrefs((prev) => ({ ...prev, [cat.key]: v }))
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={acceptAll}
                    className="px-5 py-2 text-sm font-medium rounded-lg bg-[#1E6B3A] text-[#FFFFFF] hover:bg-[#1E6B3A]/90 transition-colors"
                  >
                    {t('chrome.cookie.acceptall')}
                  </button>
                  {showCustomize && (
                    <button
                      onClick={acceptSelected}
                      className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-200 text-[#1A202C] hover:bg-gray-50 transition-colors"
                    >
                      {t('chrome.cookie.acceptselected')}
                    </button>
                  )}
                  <button
                    onClick={() => setShowCustomize(true)}
                    className="px-5 py-2 text-sm font-medium rounded-lg text-[#475569] hover:text-[#1A202C] transition-colors inline-flex items-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {t('chrome.cookie.customize')}
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    ) : null
  )
}