'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, CalendarCheck, Images, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Icon } from '@/lib/icons'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'

interface NavTab {
  href: string
  label: string
  iconName?: string       // stored icon-name string (admin-managed items)
  IconCmp?: LucideIcon    // concrete lucide component (hardcoded fallback tabs)
  cta?: boolean
}

/* Hardcoded fallback — used until admin mobile-menu items load / when none exist. */
const FALLBACK_TABS: NavTab[] = [
  { href: '/', label: 'Home', IconCmp: Home },
  { href: '/projects', label: 'Projects', IconCmp: Building2 },
  { href: '/site-visit', label: 'Book Visit', IconCmp: CalendarCheck, cta: true },
  { href: '/gallery', label: 'Gallery', IconCmp: Images },
  { href: '/contact', label: 'Contact', IconCmp: Phone },
]

interface MenuRow {
  label?: string
  href?: string
  icon?: string
  cta?: boolean
  enabled?: boolean
}

/** Extract mobile menu rows from the /api/menu response defensively (array or {mobile:[...]}). */
function extractMobileRows(data: unknown): MenuRow[] {
  if (Array.isArray(data)) return data as MenuRow[]
  if (data && typeof data === 'object' && Array.isArray((data as { mobile?: unknown }).mobile)) {
    return (data as { mobile: MenuRow[] }).mobile
  }
  return []
}

/**
 * Native-app style bottom tab bar, shown only on mobile/tablet (< lg).
 * Renders an in-flow spacer so page content (footer, etc.) is never
 * hidden behind the fixed bar. Respects iOS safe-area insets.
 */
export default function MobileBottomNav() {
  const pathname = usePathname()
  const t = useT()
  const { data } = usePublicData<unknown>('/api/menu?location=mobile')

  const dynamicTabs: NavTab[] = extractMobileRows(data)
    .filter((r) => r && r.enabled !== false && typeof r.href === 'string' && typeof r.label === 'string')
    .map((r) => ({ href: r.href as string, label: r.label as string, iconName: r.icon, cta: Boolean(r.cta) }))
  const tabs = dynamicTabs.length > 0 ? dynamicTabs : FALLBACK_TABS

  // Hide on admin routes — the admin shell has its own chrome
  if (pathname.startsWith('/admin')) return null

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* In-flow spacer so the fixed bar never covers page content */}
      <div
        className="lg:hidden"
        style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }}
        aria-hidden
      />

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#121814]/[0.08]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(7, 20, 16, 0.06)',
        }}
        aria-label={t('chrome.mobilenav.aria')}
      >
        <div
          className="grid h-16"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => {
            const { href, label, IconCmp, iconName, cta } = tab
            const active = isActive(href)

            if (cta) {
              // Raised center action — native-app style primary button
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex flex-col items-center justify-end pb-1.5 group"
                  aria-label={label}
                >
                  <span
                    className={cn(
                      'absolute -top-5 w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform duration-200 active:scale-90',
                      active ? 'bg-[#145229]' : 'bg-[#1E6B3A]'
                    )}
                    style={{ boxShadow: '0 6px 18px rgba(30, 107, 58, 0.35)' }}
                  >
                    {IconCmp ? <IconCmp className="w-6 h-6" /> : <Icon name={iconName} className="w-6 h-6" />}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold tracking-wide',
                      active ? 'text-[#1E6B3A]' : 'text-[#64748B]'
                    )}
                  >
                    {label}
                  </span>
                </Link>
              )
            }

            const iconClass = cn(
              'w-[22px] h-[22px] transition-colors duration-200',
              active ? 'text-[#1E6B3A]' : 'text-[#94A3B8]'
            )

            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center justify-center gap-1 transition-transform duration-150 active:scale-90"
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#1E6B3A]" />
                )}
                {IconCmp ? (
                  <IconCmp className={iconClass} strokeWidth={active ? 2.2 : 1.8} />
                ) : (
                  <Icon name={iconName} className={iconClass} />
                )}
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-wide transition-colors duration-200',
                    active ? 'text-[#1E6B3A] font-semibold' : 'text-[#64748B]'
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
