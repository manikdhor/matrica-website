'use client'

import { useCallback } from 'react'
import { usePublicData } from '@/lib/use-public-data'
import { UI_DEFAULTS } from '@/lib/ui-strings'

/**
 * Access admin-editable UI strings. DB values (from /api/ui-strings) win;
 * bundled defaults render on first paint and offline; the key itself is the
 * last-resort fallback so a missing key is visible rather than blank.
 */
export function useUiStrings(): Record<string, string> {
  const { data } = usePublicData<Record<string, string>>('/api/ui-strings')
  return data || UI_DEFAULTS
}

export type TFn = (key: string, fallback?: string) => string

/** Returns a translator: t('some.key') → DB value ?? bundled default ?? fallback ?? key. */
export function useT(): TFn {
  const map = useUiStrings()
  return useCallback(
    (key: string, fallback?: string) => map[key] ?? UI_DEFAULTS[key] ?? fallback ?? key,
    [map],
  )
}
