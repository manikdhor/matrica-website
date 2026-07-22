'use client'

import DOMPurify from 'dompurify'
import { useMemo } from 'react'

/*
 * Renders admin-authored rich text (HTML from RichTextEditor) as sanitized
 * markup. Legacy plain-text values render fine too — they contain no tags.
 *
 * Sanitization runs client-side only (DOMPurify needs the DOM); on the server
 * pass it returns the raw string with tags stripped so nothing executable ever
 * ships in SSR HTML. These render sites live in 'use client' components that
 * fetch their content on the client, matching the existing app pattern.
 */

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function sanitizeRichText(html: string): string {
  if (!html) return ''
  if (typeof window === 'undefined') return stripTags(html)
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'script'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
  })
}

interface RichTextProps {
  html: string | null | undefined
  className?: string
  /** Render inline (span) instead of a block div. */
  as?: 'div' | 'span'
}

/**
 * Sanitized rich-text output. Wrap with a `prose`-style className at the call
 * site for typography. Falls back to nothing when empty.
 */
export default function RichText({ html, className, as = 'div' }: RichTextProps) {
  const clean = useMemo(() => sanitizeRichText(html || ''), [html])
  if (!clean) return null
  const Tag = as
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}
