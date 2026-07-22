'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Phone, Mail, MapPin, Facebook, Instagram, Youtube, Linkedin, Twitter,
  MessageCircle, Music2, Send,
} from 'lucide-react'
import NewsletterSection from './NewsletterSection'
import { useSiteSettings, getPhoneLink, getMailtoLink } from '@/lib/use-site-settings'
import { useMenu } from '@/lib/use-menu'
import { useSiteProjectsOrdered } from '@/lib/use-projects'
import { useT } from '@/lib/use-ui-strings'
import { usePublicData } from '@/lib/use-public-data'
import RichText from '@/components/RichText'
import { Icon } from '@/lib/icons'

type SocialLink = { id: string; platform: string; url: string; icon: string; label?: string }

export default function Footer() {
  const s = useSiteSettings()
  const menu = useMenu()
  const t = useT()
  /* Admin-managed footer links (falls back to hardcoded defaults until loaded / on failure) */
  const quickLinks = menu.footer
  /* Admin-managed projects (ordered); falls back to seeded projects until loaded */
  const { projects } = useSiteProjectsOrdered()
  const projectLinks = projects.map((p) => ({
    label: p.name,
    href: `/projects/${p.slug}`,
  }))
  /* DB-backed social links; falls back to the settings-based list below when empty */
  const { data: socialData } = usePublicData<SocialLink[]>('/api/social-links')
  const dynamicSocial = Array.isArray(socialData) ? socialData.filter((l) => l && l.url) : []
  const fallbackSocial = [
    ...(s.socialFacebook ? [{ icon: Facebook, href: s.socialFacebook, label: 'Facebook' }] : []),
    ...(s.socialInstagram ? [{ icon: Instagram, href: s.socialInstagram, label: 'Instagram' }] : []),
    ...(s.socialYoutube ? [{ icon: Youtube, href: s.socialYoutube, label: 'YouTube' }] : []),
    ...(s.socialLinkedin ? [{ icon: Linkedin, href: s.socialLinkedin, label: 'LinkedIn' }] : []),
    ...(s.socialTwitter ? [{ icon: Twitter, href: s.socialTwitter, label: 'Twitter' }] : []),
    ...(s.socialWhatsapp ? [{ icon: MessageCircle, href: s.socialWhatsapp, label: 'WhatsApp' }] : []),
    ...(s.socialTiktok ? [{ icon: Music2, href: s.socialTiktok, label: 'TikTok' }] : []),
    ...(s.socialTelegram ? [{ icon: Send, href: s.socialTelegram, label: 'Telegram' }] : []),
  ]
  const useDynamicSocial = dynamicSocial.length > 0

  return (
    <footer className="bg-[#071410] mt-auto">
      <NewsletterSection />
      <div className="divider-premium max-w-7xl mx-auto" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Col 1 - Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src={s.logoFooter || s.logoUrl || '/images/matrica-logo.webp'}
                alt={s.companyName}
                width={160}
                height={44}
                className="h-11 w-auto object-contain mb-4 brightness-0 invert"
              />
            </Link>
            <p className="text-[#4ADE80]/80 text-xs font-semibold tracking-widest uppercase mb-3">
              {s.companyTagline}
            </p>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <p className="text-green-200/70 text-sm leading-relaxed">
                <span className="font-[family-name:var(--font-heading)] font-semibold text-green-200/90">{s.companyName}</span>{' '}
                <RichText
                  as="span"
                  html={s.footerAbout ?? 'is a Dhaka-based land developer building master-planned residential plots in Purbachal — planned in line with RAJUK policy, beside RAJUK Purbachal New Town.'}
                />
              </p>
            </div>
          </div>

          {/* Col 2 - Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-[0.15em] uppercase mb-5">
              {t('chrome.footer.quicklinks')}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.target === '_blank' ? '_blank' : undefined}
                    rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                    className="text-green-200/60 text-sm hover:text-white transition-colors duration-300 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-[#1E6B3A] transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 - Projects */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-[0.15em] uppercase mb-5">
              {t('chrome.footer.projects')}
            </h4>
            <ul className="space-y-3">
              {projectLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-green-200/60 text-sm hover:text-white transition-colors duration-300 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-[#1E6B3A] transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 - Contact Info */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-[0.15em] uppercase mb-5">
              {t('chrome.footer.contact')}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1E6B3A]" />
                </div>
                <span className="text-green-200/70 text-sm leading-relaxed">
                  {s.companyAddress}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-[#1E6B3A]" />
                </div>
                <a
                  href={getPhoneLink(s)}
                  className="text-green-200/70 text-sm hover:text-white transition-colors duration-300"
                >
                  {s.companyPhone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-[#1E6B3A]" />
                </div>
                <a
                  href={getMailtoLink(s)}
                  className="text-green-200/70 text-sm hover:text-white transition-colors duration-300"
                >
                  {s.companyEmail}
                </a>
              </li>
            </ul>

            {/* Refined Social Icons */}
            {useDynamicSocial ? (
            <div className="flex gap-2.5 mt-6">
              {dynamicSocial.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-green-200/60 hover:bg-[#1E6B3A] hover:border-[#1E6B3A] hover:text-white transition-all duration-300"
                  aria-label={link.label || link.platform}
                >
                  <Icon name={link.icon} className="w-4 h-4" />
                </a>
              ))}
            </div>
            ) : fallbackSocial.length > 0 ? (
            <div className="flex gap-2.5 mt-6">
              {fallbackSocial.map(({ icon: SocialIcon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-green-200/60 hover:bg-[#1E6B3A] hover:border-[#1E6B3A] hover:text-white transition-all duration-300"
                  aria-label={label}
                >
                  <SocialIcon className="w-4 h-4" />
                </a>
              ))}
            </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom Bar — colophon */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <p className="text-green-200/40 text-xs">
              &copy; {new Date().getFullYear()} <span className="font-[family-name:var(--font-heading)] font-semibold text-green-200/50">{s.companyName}</span>. {t('chrome.footer.rightsreserved')}
            </p>
            <p className="text-green-200/30 text-[10px] tracking-[0.18em] uppercase">
              {s.footerColophon ?? 'Purbachal, Dhaka · RAJUK-Approved Developments'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-green-200/40 text-xs">
            <Link href="/privacy" className="hover:text-white transition-colors duration-300">
              {t('chrome.footer.legal.privacy')}
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/terms" className="hover:text-white transition-colors duration-300">
              {t('chrome.footer.legal.terms')}
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-5 -mt-1 flex justify-center sm:justify-start">
          <p className="text-green-200/30 text-[11px]">
            <a
              href={s.footerCreditUrl ?? 'https://youthfireit.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-200/50 hover:text-white transition-colors duration-300"
            >
              {s.footerCredit ?? 'Design and Developed by YouthFire IT'}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}