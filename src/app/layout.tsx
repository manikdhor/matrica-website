import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import LayoutWrapper from "@/components/LayoutWrapper";
import { getSiteSettings } from "@/app/api/site-settings/route";
import { getPublicMenu } from "@/lib/menu-data";
import { getPublishedProjects } from "@/lib/projects-data";
import { getPublicSocialLinks } from "@/lib/social-links-data";
import { getPublicUiStrings } from "@/lib/ui-strings-data";
import "./globals.css";

// display: "optional" — text always paints immediately with the metric-matched
// fallback; the webfont is used when it arrives within the swap window (always,
// on warm cache). Keeps LCP at first paint instead of the font download.
const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "optional",
  weight: ["400", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "optional",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  display: "optional",
  weight: ["400"],
});

export const viewport: Viewport = {
  themeColor: "#071410",
  // Required for env(safe-area-inset-*) to resolve on notched devices —
  // the mobile bottom nav and floating widgets pad by it.
  viewportFit: "cover",
}

function safeMetadataBase(url: string): URL {
  try {
    return new URL(url)
  } catch {
    return new URL("https://matrica.com.bd")
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const ogImage = settings.seoOgImage || "/images/hero-slide-1.webp"
  return {
    metadataBase: safeMetadataBase(settings.siteUrl),
    title: `${settings.companyName} | Premium Land Developer in Dhaka`,
    description:
      settings.seoDescription ||
      `${settings.companyName} develops master-planned residential plots in Purbachal, Dhaka — planned in line with RAJUK policy, beside RAJUK Purbachal New Town, with verifiable documentation and transparent pricing.`,
    keywords: [
      settings.companyName,
      "real estate",
      "land developer",
      "Purbachal",
      "Dhaka",
      "residential plots",
      "Bangladesh",
      "RAJUK Purbachal New Town",
    ],
    authors: [{ name: settings.companyName }],
    icons: {
      icon: settings.faviconUrl || "/favicon.ico",
    },
    openGraph: {
      title: `${settings.companyName} | Premium Land Developer`,
      description:
        settings.seoDescription ||
        `Transforming Land to Landmarks. Premium residential plots in Purbachal, Dhaka.`,
      type: "website",
      locale: "en_BD",
      siteName: settings.companyName,
      images: [{ url: ogImage, width: 1344, height: 768 }],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.companyName,
      description: `Master-planned residential plots in Purbachal, Dhaka — beside RAJUK Purbachal New Town.`,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, menu, projects, socialLinks, uiStrings] = await Promise.all([
    getSiteSettings(),
    getPublicMenu(),
    getPublishedProjects(),
    getPublicSocialLinks(),
    getPublicUiStrings(),
  ])
  const sameAs = [
    settings.socialFacebook,
    settings.socialInstagram,
    settings.socialYoutube,
    settings.socialLinkedin,
    settings.socialTwitter,
    settings.socialTiktok,
    settings.socialTelegram,
  ].filter(Boolean)

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": settings.companyName,
    "description": settings.companyTagline,
    "url": settings.siteUrl,
    "logo": `${settings.siteUrl}/logo.png`,
    "telephone": settings.companyPhone,
    "email": settings.companyEmail,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": settings.companyAddress,
      "addressLocality": "Dhaka",
      "addressCountry": "BD",
    },
    "areaServed": {
      "@type": "City",
      "name": "Dhaka"
    },
    "priceRange": "৳12L - ৳50L+",
  }
  if (sameAs.length > 0) {
    jsonLd.sameAs = sameAs
  }

  // Admin-driven theme — override the CSS design tokens when a value is set.
  // Each setting can map to several tokens so the whole palette stays coherent.
  const themeMap: [string, string[]][] = [
    [settings.brandPrimary, ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--chart-1']],
    [settings.brandAction, ['--brand']],
    [settings.brandGold, ['--gold']],
    [settings.themeBackground, ['--background', '--card', '--popover', '--paper']],
    [settings.themeForeground, ['--foreground', '--card-foreground', '--popover-foreground', '--ink']],
    [settings.themeAccent, ['--accent', '--sidebar-accent']],
    [settings.themeAccentFg, ['--accent-foreground', '--sidebar-accent-foreground']],
    [settings.themeGoldLight, ['--gold-light']],
    [settings.themeBrandDeep, ['--brand-deep']],
    [settings.themeBorder, ['--border', '--input', '--sidebar-border']],
    [settings.themeMuted, ['--muted', '--secondary']],
    [settings.themeMutedFg, ['--muted-foreground', '--ink-muted']],
    [settings.themeRadius, ['--radius']],
    [settings.fontHeading, ['--font-heading']],
    [settings.fontBody, ['--font-body']],
    [settings.fontMono, ['--font-data']],
  ]
  const themeVars = themeMap
    .filter(([v]) => v)
    .flatMap(([v, tokens]) => tokens.map((t) => `${t}:${v};`))
    .join('')
  // Global animation kill-switch (CSS side; framer-motion handled in LayoutWrapper).
  const animOff = !settings.animEnabled
    ? '*,*::before,*::after{animation-duration:.001ms!important;animation-delay:0ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}'
    : ''

  return (
    <html lang="en" suppressHydrationWarning data-anim={settings.animEnabled ? 'on' : 'off'}>
      <body
        className={`${playfair.variable} ${jakarta.variable} ${mono.variable} antialiased bg-background text-foreground`}
      >
        {settings.fontGoogleUrl && (
          <link rel="stylesheet" href={settings.fontGoogleUrl} />
        )}
        {(themeVars || animOff) && (
          <style dangerouslySetInnerHTML={{ __html: `:root{${themeVars}}${animOff}` }} />
        )}
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <LayoutWrapper
          initialSettings={settings}
          initialMenu={menu}
          initialProjects={projects}
          initialSocialLinks={socialLinks}
          initialUiStrings={uiStrings}
        >
          {children}
        </LayoutWrapper>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1A202C',
              border: '1px solid rgba(30, 107, 58, 0.2)',
              color: '#F8FAFB',
              fontFamily: 'var(--font-body), system-ui, sans-serif',
            },
          }}
        />
      </body>
    </html>
  );
}