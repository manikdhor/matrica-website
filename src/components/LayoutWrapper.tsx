'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MotionConfig } from 'framer-motion'
import NavbarFooter from '@/components/NavbarFooter'
import PageTransition from '@/components/PageTransition'
import { useSiteSettings, seedSiteSettings } from '@/lib/use-site-settings'
import { seedMenu } from '@/lib/use-menu'
import { seedProjects } from '@/lib/use-projects'
import { seedPublicData } from '@/lib/use-public-data'
import type { SiteSettings } from '@/app/api/site-settings/route'
import type { PublicMenu } from '@/lib/menu-data'
import type { PublicSocialLink } from '@/lib/social-links-data'
import type { PublicProject } from '@/lib/project-shape'

// Loaded only when the admin enables the splash — keeps framer-motion out of
// the shared layout bundle for everyone else
const LoadingScreen = dynamic(() => import('@/components/LoadingScreen'), {
  ssr: false,
})

// Public-only: third-party tags (GA4/GTM/Pixel/custom) and the nav progress bar
const TrackingScripts = dynamic(() => import('@/components/TrackingScripts'), {
  ssr: false,
})
const RouteProgress = dynamic(() => import('@/components/RouteProgress'), {
  ssr: false,
})

/**
 * Conditionally wraps children with the public NavbarFooter.
 * Admin routes (/admin/*) get a plain wrapper with no header/footer.
 *
 * Seeds the client settings cache with the server-fetched settings before
 * any descendant reads useSiteSettings — parent render runs first, so every
 * consumer sees real values on the very first render (SSR and hydration).
 */
export default function LayoutWrapper({
  children,
  initialSettings,
  initialMenu,
  initialProjects,
  initialSocialLinks,
  initialUiStrings,
}: {
  children: React.ReactNode
  initialSettings?: SiteSettings
  initialMenu?: PublicMenu
  initialProjects?: PublicProject[]
  initialSocialLinks?: PublicSocialLink[]
  initialUiStrings?: Record<string, string>
}) {
  if (initialSettings) seedSiteSettings(initialSettings)
  if (initialMenu) seedMenu(initialMenu)
  if (initialProjects) seedProjects(initialProjects)
  if (initialSocialLinks) seedPublicData('/api/social-links', initialSocialLinks)
  if (initialUiStrings) seedPublicData('/api/ui-strings', initialUiStrings)

  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const { widgetLoadingScreenEnabled, animEnabled } = useSiteSettings()

  // Admin-driven global motion switch — disables framer-motion transforms
  // site-wide when animations are turned off in the admin panel.
  const reducedMotion = animEnabled ? 'user' : 'always'

  if (isAdmin) {
    return (
      <MotionConfig reducedMotion={reducedMotion}>
        <RouteProgress />
        {widgetLoadingScreenEnabled && <LoadingScreen />}
        {children}
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion={reducedMotion}>
      <RouteProgress />
      <NavbarFooter>
        {widgetLoadingScreenEnabled && <LoadingScreen />}
        <PageTransition>{children}</PageTransition>
      </NavbarFooter>
      <TrackingScripts />
    </MotionConfig>
  )
}
