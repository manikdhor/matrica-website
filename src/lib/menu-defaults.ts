/**
 * Hardcoded default menu items — used as fallback when the database is
 * unreachable or the MenuItem table is empty, and as the seed data for
 * the admin "Load defaults" action.
 */

export interface PublicMenuItem {
  label: string
  href: string
  target: string
  icon?: string | null
}

export const DEFAULT_MOBILE_MENU: PublicMenuItem[] = [
  { label: 'Home', href: '/', target: '_self', icon: 'Home' },
  { label: 'Projects', href: '/projects', target: '_self', icon: 'Building2' },
  { label: 'Book Visit', href: '/site-visit', target: '_self', icon: 'Calendar' },
  { label: 'Gallery', href: '/gallery', target: '_self', icon: 'Grid' },
  { label: 'Contact', href: '/contact', target: '_self', icon: 'Phone' },
]

export const DEFAULT_HEADER_MENU: PublicMenuItem[] = [
  { label: 'Home', href: '/', target: '_self' },
  { label: 'Projects', href: '/projects', target: '_self' },
  { label: 'About', href: '/about', target: '_self' },
  { label: 'Gallery', href: '/gallery', target: '_self' },
  { label: 'Blog', href: '/blog', target: '_self' },
  { label: 'FAQ', href: '/faq', target: '_self' },
  { label: 'Site Visit', href: '/site-visit', target: '_self' },
  { label: 'Contact', href: '/contact', target: '_self' },
]

export const DEFAULT_FOOTER_MENU: PublicMenuItem[] = [
  { label: 'Home', href: '/', target: '_self' },
  { label: 'Projects', href: '/projects', target: '_self' },
  { label: 'About', href: '/about', target: '_self' },
  { label: 'Gallery', href: '/gallery', target: '_self' },
  { label: 'Blog', href: '/blog', target: '_self' },
  { label: 'Contact', href: '/contact', target: '_self' },
  { label: 'FAQ', href: '/faq', target: '_self' },
  { label: 'Site Visit', href: '/site-visit', target: '_self' },
]
