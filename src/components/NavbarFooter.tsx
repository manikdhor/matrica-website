'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useSiteSettings } from '@/lib/use-site-settings'
import DeferUntilIdle from './DeferUntilIdle'
import Navigation from './Navigation'

const Footer = dynamic(() => import('./Footer'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-[#0F2B1A]" />,
})
const WhatsAppButton = dynamic(() => import('./WhatsAppButton'), {
  ssr: false,
  loading: () => null,
})
const ScrollProgressBar = dynamic(() => import('./ScrollProgressBar'), {
  ssr: false,
  loading: () => null,
})
const BackToTopButton = dynamic(() => import('./BackToTopButton'), {
  ssr: false,
  loading: () => null,
})
const CookieConsent = dynamic(() => import('./CookieConsent'), {
  ssr: false,
  loading: () => null,
})
const AnnouncementBar = dynamic(() => import('./AnnouncementBar'), {
  ssr: false,
  loading: () => <div className="h-10" />,
})
const QuickChatWidget = dynamic(() => import('./QuickChatWidget'), {
  ssr: false,
  loading: () => null,
})
const MobileBottomNav = dynamic(() => import('./MobileBottomNav'), {
  ssr: false,
  loading: () => null,
})
const LeadModalWrapper = dynamic(() => import('./LeadModalWrapper'), {
  ssr: false,
  loading: () => null,
})

export default function NavbarFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const settings = useSiteSettings()

  // Floating widgets hydrate after the main thread goes idle — they never
  // compete with first paint or the LCP.
  const widgets = (
    <DeferUntilIdle>
      {settings.widgetQuickchatEnabled && <QuickChatWidget />}
      {settings.widgetBackToTopEnabled && <BackToTopButton />}
      {settings.widgetLeadPopupEnabled && <LeadModalWrapper />}
    </DeferUntilIdle>
  )

  // Cookie banner gets its own short-bounded defer (not the shared 2500ms
  // idle wait): under a busy main thread, requestIdleCallback can stall long
  // enough that this large text block becomes the LAST thing to paint —
  // which makes Lighthouse/CWV misattribute it as the page's LCP element.
  // A tight 400ms cap keeps it well clear of real above-the-fold content
  // without waiting for idle that may not come soon.
  const cookieConsent = settings.widgetCookieConsentEnabled && (
    <DeferUntilIdle timeoutMs={400}>
      <CookieConsent />
    </DeferUntilIdle>
  )

  if (isHomePage) {
    // Home page handles its own nav/footer
    return (
      <>
        {settings.widgetScrollProgressEnabled && <ScrollProgressBar />}
        {children}
        <MobileBottomNav />
        {widgets}
        {cookieConsent}
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {settings.widgetScrollProgressEnabled && <ScrollProgressBar />}
      <Navigation />
      {settings.announcementEnabled && settings.announcementText && <AnnouncementBar />}
      <div className="flex-1">{children}</div>
      <Footer />
      <MobileBottomNav />
      <WhatsAppButton />
      {widgets}
      {cookieConsent}
    </div>
  )
}