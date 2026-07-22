'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Phone, ChevronDown, Facebook, Instagram, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useSiteSettings, getPhoneLink } from '@/lib/use-site-settings'
import { useMenu } from '@/lib/use-menu'
import { useSiteProjectsOrdered } from '@/lib/use-projects'
import { useT } from '@/lib/use-ui-strings'
import { usePublicData } from '@/lib/use-public-data'
import { Icon } from '@/lib/icons'
import Image from 'next/image'

type SocialLink = { id: string; platform: string; url: string; icon: string; label?: string }

export default function Navigation() {
  const s = useSiteSettings()
  const menu = useMenu()
  const t = useT()
  const pathname = usePathname()

  /* Social links — DB-backed; falls back to settings-based rendering when empty */
  const { data: socialData } = usePublicData<SocialLink[]>('/api/social-links')
  const socialLinks = Array.isArray(socialData) ? socialData.filter((l) => l && l.url) : []

  /* Projects dropdown — DB-backed, published projects in admin order */
  const { projects: siteProjects } = useSiteProjectsOrdered()
  const projectDropdownItems = siteProjects.map((p) => ({
    label: p.name,
    href: `/projects/${p.slug}`,
    logo: p.logo,
    sub: p.location ? `${p.status} · ${p.location}` : p.status,
  }))

  /* Admin-managed header menu (falls back to hardcoded defaults until
     loaded / on failure). Desktop shows all enabled header items — the
     admin now controls what appears. Projects keeps its dropdown. */
  const navLinks = menu.header.map((l) => ({
    ...l,
    hasDropdown: l.href === '/projects',
  }))
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false) // eslint-disable-line react-hooks/set-state-in-effect
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  /* Individual blog articles have a light editorial hero (no dark PageHero
     band), so the transparent white nav text/logo would vanish against it.
     Force the solid nav treatment immediately on those routes. */
  const lightHero = pathname.startsWith('/blog/')
  const solid = scrolled || lightHero

  const handleDropdownEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setDropdownOpen(true)
  }

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false)
    }, 150)
  }

  return (
    <header
      className={cn(
        'nav-drop fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        solid
          ? 'bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#121814]/[0.08] nav-scrolled'
          : 'bg-transparent nav-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src={s.logoUrl || '/images/matrica-logo.webp'}
              alt={s.companyName}
              width={140}
              height={40}
              className={cn(
                'h-10 md:h-12 w-auto object-contain transition-all duration-500',
                // White logo while floating over dark page openers
                !solid && 'brightness-0 invert'
              )}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'relative flex items-center gap-1.5 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300',
                      solid
                        ? isActive('/projects')
                          ? 'text-[#121814]'
                          : 'text-[#4A544E] hover:text-[#121814]'
                        : isActive('/projects')
                          ? 'text-white'
                          : 'text-white/75 hover:text-white'
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-300',
                        dropdownOpen ? 'rotate-180' : 'rotate-0'
                      )}
                    />
                  </Link>

                  {/* Dropdown with premium-card feel */}
                  {dropdownOpen && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 border border-[#121814]/10 bg-[#FAF9F6] z-50"
                        style={{
                          boxShadow: 'var(--shadow-lg)',
                          animation: 'heroFadeUp 0.2s ease-out both',
                        }}
                        onMouseEnter={handleDropdownEnter}
                        onMouseLeave={handleDropdownLeave}
                      >
                        {projectDropdownItems.map((item, i) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-200 group/item',
                              i > 0 && 'border-t border-[#121814]/[0.07]',
                              pathname === item.href
                                ? 'bg-white'
                                : 'hover:bg-white'
                            )}
                          >
                            {/* Project wordmark on white plate */}
                            <span className="flex-shrink-0 w-14 h-9 bg-white border border-[#121814]/10 flex items-center justify-center px-1.5">
                              <img
                                src={item.logo}
                                alt=""
                                className="max-h-7 w-auto max-w-full object-contain"
                                loading="lazy"
                              />
                            </span>
                            <span>
                              <span className="block text-sm text-[#121814] group-hover/item:text-[#1A5C33] transition-colors">
                                {item.label}
                              </span>
                              <span className="block text-[0.6rem] tracking-[0.14em] uppercase text-[#707A72] mt-0.5">
                                {item.sub}
                              </span>
                            </span>
                          </Link>
                        ))}
                        <Link
                          href="/projects"
                          className="flex items-center justify-between px-4 py-3 border-t border-[#121814]/10 text-[0.64rem] font-medium uppercase tracking-[0.18em] text-[#121814] hover:bg-white hover:text-[#1A5C33] transition-colors duration-200"
                        >
                          <span>{t('chrome.nav.viewallprojects')}</span>
                          <span aria-hidden>&rarr;</span>
                        </Link>
                      </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.target === '_blank' ? '_blank' : undefined}
                  rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                  className={cn(
                    'relative px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300',
                    solid
                      ? isActive(link.href)
                        ? 'text-[#121814]'
                        : 'text-[#4A544E] hover:text-[#121814]'
                      : isActive(link.href)
                        ? 'text-white'
                        : 'text-white/75 hover:text-white'
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-4 right-4 h-px bg-[#A98B4F]" />
                  )}
                </Link>
              )
            )}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center gap-6">
            <a
              href={getPhoneLink(s)}
              className={cn(
                'flex items-center gap-2 text-[0.72rem] tracking-[0.08em] transition-colors duration-300',
                solid
                  ? 'text-[#4A544E] hover:text-[#121814]'
                  : 'text-white/75 hover:text-white'
              )}
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden xl:inline tabular-nums">{s.companyPhone}</span>
            </a>
            <Link
              href="/site-visit"
              className={cn(
                'inline-flex items-center justify-center px-6 py-3 text-[0.68rem] font-medium uppercase tracking-[0.18em] border transition-colors duration-300',
                solid
                  ? 'border-[#121814] text-[#121814] hover:bg-[#121814] hover:text-white'
                  : 'border-white/60 text-white hover:bg-white hover:text-[#121814]'
              )}
            >
              {t('chrome.nav.cta.sitevisit')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    'p-2 transition-colors duration-300',
                    solid ? 'text-[#121814]' : 'text-white'
                  )}
                  aria-label={t('chrome.nav.openmenu')}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] bg-white border-l border-[#E2E8F0] p-0"
              >
                <SheetTitle className="sr-only">{t('chrome.nav.menutitle')}</SheetTitle>

                {/* Brass hairline at top */}
                <div className="h-px bg-[#A98B4F]" />

                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
                    <div className="flex flex-col">
                      <Link href="/" onClick={() => setMobileOpen(false)}>
                        <Image
                          src={s.logoUrl || '/images/matrica-logo.webp'}
                          alt={s.companyName}
                          width={130}
                          height={36}
                          className="h-9 w-auto object-contain"
                        />
                      </Link>
                      <span className="label-premium-sm text-[#1E6B3A] mt-1">
                        {s.companyTagline}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Links */}
                  <div className="flex-1 overflow-y-auto py-4">
                    <div className="flex flex-col gap-0.5 px-3">
                      {navLinks.map((link, index) => (
                        <div
                          key={link.href}
                          style={{
                            animation: 'slideInFromRight 0.3s ease-out both',
                            animationDelay: `${index * 0.04}s`,
                          }}
                        >
                          <Link
                            href={link.href}
                            target={link.target === '_blank' ? '_blank' : undefined}
                            rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'block text-left px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg',
                              isActive(link.href)
                                ? 'text-[#1E6B3A] bg-[#F0FDF4] border-l-2 border-[#1E6B3A]'
                                : 'text-[#334155] hover:text-[#1A202C] hover:bg-[#F8FAFB] border-l-2 border-transparent'
                            )}
                          >
                            {link.label}
                          </Link>
                        </div>
                      ))}
                    </div>

                    {/* Legal links */}
                    <div
                      className="mt-4 px-7"
                      style={{
                        animation: 'slideInFromRight 0.3s ease-out both',
                        animationDelay: `${navLinks.length * 0.04 + 0.1}s`,
                      }}
                    >
                      <div className="h-px bg-[#E2E8F0] mb-4" />
                      <div className="flex flex-col gap-2.5">
                        <Link
                          href="/privacy"
                          onClick={() => setMobileOpen(false)}
                          className="text-xs text-[#334155]/60 hover:text-[#334155] transition-colors duration-300"
                        >
                          {t('chrome.nav.legal.privacy')}
                        </Link>
                        <Link
                          href="/terms"
                          onClick={() => setMobileOpen(false)}
                          className="text-xs text-[#334155]/60 hover:text-[#334155] transition-colors duration-300"
                        >
                          {t('chrome.nav.legal.terms')}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Footer */}
                  <div className="p-6 border-t border-[#E2E8F0] space-y-4">
                    {/* Social Media Links */}
                    <div className="flex items-center gap-2.5">
                      {socialLinks.length > 0 ? (
                        socialLinks.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F8FAFB] border border-[#E2E8F0] text-[#334155] hover:text-[#1E6B3A] hover:bg-[#F0FDF4] hover:border-[#1E6B3A]/20 transition-all duration-200"
                            aria-label={link.label || link.platform}
                          >
                            <Icon name={link.icon} className="w-4 h-4" />
                          </a>
                        ))
                      ) : (
                       <>
                      {s.socialFacebook && (
                        <a
                          href={s.socialFacebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F8FAFB] border border-[#E2E8F0] text-[#334155] hover:text-[#1E6B3A] hover:bg-[#F0FDF4] hover:border-[#1E6B3A]/20 transition-all duration-200"
                          aria-label="Facebook"
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {s.socialInstagram && (
                        <a
                          href={s.socialInstagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F8FAFB] border border-[#E2E8F0] text-[#334155] hover:text-[#1E6B3A] hover:bg-[#F0FDF4] hover:border-[#1E6B3A]/20 transition-all duration-200"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {s.socialYoutube && (
                        <a
                          href={s.socialYoutube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F8FAFB] border border-[#E2E8F0] text-[#334155] hover:text-[#1E6B3A] hover:bg-[#F0FDF4] hover:border-[#1E6B3A]/20 transition-all duration-200"
                          aria-label="YouTube"
                        >
                          <Youtube className="w-4 h-4" />
                        </a>
                      )}
                       </>
                      )}
                    </div>

                    <a
                      href={getPhoneLink(s)}
                      className="flex items-center gap-2.5 text-[#334155] hover:text-[#1E6B3A] transition-colors duration-300 text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{s.companyPhone}</span>
                    </a>
                    <Link href="/contact" onClick={() => setMobileOpen(false)} className="block">
                      <Button className="btn-premium w-full justify-center">
                        {t('chrome.nav.cta.contact')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  )
}