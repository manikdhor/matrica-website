'use client'

import { useT } from '@/lib/use-ui-strings'

/**
 * RAJUK approval seal — custom gold line-art badge.
 * Circular text ring + tick mark. The single most trust-dense
 * element on the page; replaces generic icon "certifications".
 */
export default function RajukSeal({ size = 96 }: { size?: number }) {
  const t = useT()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={t('projects.seal.aria')}
      role="img"
    >
      {/* Outer ring */}
      <circle cx="60" cy="60" r="57" stroke="var(--gold)" strokeWidth="1.5" />
      <circle
        cx="60"
        cy="60"
        r="52"
        stroke="var(--gold)"
        strokeWidth="0.75"
        strokeDasharray="2 3"
        opacity="0.7"
      />
      {/* Inner ring */}
      <circle cx="60" cy="60" r="34" stroke="var(--gold)" strokeWidth="1" />

      {/* Circular text */}
      <defs>
        <path
          id="sealTextPath"
          d="M 60,60 m -43,0 a 43,43 0 1,1 86,0 a 43,43 0 1,1 -86,0"
        />
      </defs>
      <text
        fontSize="8.5"
        fontFamily="var(--font-data), ui-monospace, monospace"
        letterSpacing="2.6"
        fill="var(--gold)"
      >
        <textPath href="#sealTextPath" startOffset="0%">
          {t('projects.seal.ringText')}
        </textPath>
      </text>

      {/* Center check */}
      <path
        d="M46 60.5 L56 70 L75 50"
        stroke="var(--gold)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Corner ticks inside inner ring */}
      <path d="M60 30 v4 M60 86 v4 M30 60 h4 M86 60 h4" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
    </svg>
  )
}
