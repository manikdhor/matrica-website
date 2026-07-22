'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSiteSettings } from '@/lib/use-site-settings'

/**
 * Admin-managed third-party tracking / marketing tags.
 *
 * Structured fields (GA4, GTM, Meta Pixel) emit the vendors' official
 * snippets via next/script with strategy="afterInteractive" — they load
 * after hydration so they never block first paint or the LCP. Arbitrary
 * head/body code (site-verification meta tags, other pixels, custom JS) is
 * injected with real, executing <script> nodes on mount.
 *
 * Mounted on public routes only (never /admin) — see LayoutWrapper.
 *
 * SECURITY: the raw head/body code is a deliberate, admin-only capability
 * (same as a WordPress "header & footer scripts" plugin). It is gated behind
 * the settings WRITE permission at the API, so only trusted operators can set
 * it. It is NOT user-generated content.
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void }
  }
}

/**
 * Insert an arbitrary HTML string into <head> or end of <body>, re-creating
 * <script> nodes so the browser actually executes them (innerHTML/
 * insertAdjacentHTML alone never runs injected scripts). Returns a cleanup
 * that removes every node it added.
 */
function injectRaw(html: string, target: 'head' | 'body'): () => void {
  const holder = document.createElement('div')
  holder.innerHTML = html
  const dest = target === 'head' ? document.head : document.body
  const added: Node[] = []
  Array.from(holder.childNodes).forEach((node) => {
    if (node.nodeName === 'SCRIPT') {
      const orig = node as HTMLScriptElement
      const script = document.createElement('script')
      Array.from(orig.attributes).forEach((a) => script.setAttribute(a.name, a.value))
      script.textContent = orig.textContent
      dest.appendChild(script)
      added.push(script)
    } else {
      const clone = node.cloneNode(true)
      dest.appendChild(clone)
      added.push(clone)
    }
  })
  return () => added.forEach((n) => n.parentNode?.removeChild(n))
}

export default function TrackingScripts() {
  const s = useSiteSettings()
  const pathname = usePathname()
  const firstNav = useRef(true)

  const ga4 = (s.trackingGa4Id || '').trim()
  const gtm = (s.trackingGtmId || '').trim()
  const pixel = (s.trackingFbPixelId || '').trim()
  const headCode = (s.trackingHeadCode || '').trim()
  const bodyCode = (s.trackingBodyCode || '').trim()

  // Inject arbitrary head/body code (executing scripts). Re-runs only when the
  // code strings change.
  useEffect(() => {
    const cleanups: Array<() => void> = []
    if (headCode) cleanups.push(injectRaw(headCode, 'head'))
    if (bodyCode) cleanups.push(injectRaw(bodyCode, 'body'))
    return () => cleanups.forEach((fn) => fn())
  }, [headCode, bodyCode])

  // SPA navigations don't trigger the vendors' auto page_view — fire one
  // manually on every route change after the initial load.
  useEffect(() => {
    if (firstNav.current) {
      firstNav.current = false
      return
    }
    if (ga4 && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: pathname })
    }
    if (pixel && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [pathname, ga4, pixel])

  return (
    <>
      {ga4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`}
          </Script>
        </>
      )}

      {gtm && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}

      {pixel && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}

      {/* GTM / Pixel no-JS fallbacks — harmless when the IDs are unset */}
      {gtm && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="gtm"
          />
        </noscript>
      )}
      {pixel && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`}
          />
        </noscript>
      )}
    </>
  )
}
