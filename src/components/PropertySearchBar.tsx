'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePublicData } from '@/lib/use-public-data'
import { useT } from '@/lib/use-ui-strings'

interface Option {
  value: string
  label: string
}

// Hardcoded fallbacks — used until the admin config loads / on any failure.
const FALLBACK_TYPES: Option[] = [
  { value: 'all', label: 'All Types' },
  { value: 'residential', label: 'Residential Plot' },
  { value: 'commercial', label: 'Commercial Plot' },
]
const FALLBACK_BUDGETS: Option[] = [
  { value: 'all', label: 'Any Budget' },
  { value: 'under-20l', label: 'Under 20 Lakh' },
  { value: '20l-50l', label: '20 – 50 Lakh' },
  { value: '50l-1cr', label: '50 Lakh – 1 Crore' },
  { value: 'above-1cr', label: 'Above 1 Crore' },
]
const FALLBACK_SIZES: Option[] = [
  { value: 'all', label: 'Any Size' },
  { value: '3-katha', label: '3 Katha' },
  { value: '5-katha', label: '5 Katha' },
  { value: '10-katha', label: '10 Katha' },
]

type ContentSections = Record<string, { title?: string; subtitle?: string; content?: string; image?: string; config?: string }>

/** Coerce a raw config array into Option[]; accepts {value,label} objects or plain strings. */
function toOptions(raw: unknown, fallback: Option[]): Option[] {
  if (!Array.isArray(raw)) return fallback
  const opts: Option[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      const label = item.trim()
      if (label) opts.push({ value: label.toLowerCase().replace(/\s+/g, '-'), label })
    } else if (item && typeof item === 'object') {
      const o = item as { value?: unknown; label?: unknown }
      const label = typeof o.label === 'string' ? o.label : typeof o.value === 'string' ? o.value : ''
      const value = typeof o.value === 'string' ? o.value : label.toLowerCase().replace(/\s+/g, '-')
      if (label) opts.push({ value, label })
    }
  }
  return opts.length > 0 ? opts : fallback
}

/**
 * Guarantee a leading "all/any" option. The admin config lists only concrete
 * choices (e.g. just "Residential Plot"), so without this the trigger's
 * default value `all` matches no item and renders blank — the whole search
 * card then looks empty (labels + chevrons, no text). Prepending the default
 * keeps the field readable and gives users a way to clear the filter.
 */
function withDefaultOption(opts: Option[], defaultLabel: string): Option[] {
  if (opts.some((o) => o.value === 'all')) return opts
  return [{ value: 'all', label: defaultLabel }, ...opts]
}

export default function PropertySearchBar() {
  const t = useT()
  const router = useRouter()
  const { data: cs } = usePublicData<ContentSections>('/api/content-sections')

  // Parse the admin-managed `property_search` config JSON defensively.
  const parsed = (() => {
    try {
      const raw = cs?.['property_search']?.config
      return raw ? (JSON.parse(raw) as { types?: unknown; budgets?: unknown; plotSizes?: unknown }) : null
    } catch {
      return null
    }
  })()

  const fields = [
    { key: 'type', label: t('projects.search.fieldType'), options: withDefaultOption(toOptions(parsed?.types, FALLBACK_TYPES), 'All Types') },
    { key: 'budget', label: t('projects.search.fieldBudget'), options: withDefaultOption(toOptions(parsed?.budgets, FALLBACK_BUDGETS), 'Any Budget') },
    { key: 'size', label: t('projects.search.fieldSize'), options: withDefaultOption(toOptions(parsed?.plotSizes, FALLBACK_SIZES), 'Any Size') },
  ]

  const [values, setValues] = useState<Record<string, string>>({
    type: 'all',
    budget: 'all',
    size: 'all',
  })

  function handleSearch() {
    const params = new URLSearchParams()
    Object.entries(values).forEach(([k, v]) => {
      if (v !== 'all') params.set(k, v)
    })
    const qs = params.toString()
    router.push(`/projects${qs ? `?${qs}` : ''}`)
  }

  return (
    <div
      className="hero-fade-up relative z-20 w-full max-w-4xl mx-auto px-4"
      style={{ animationDelay: '0.35s' }}
    >
      <div
        className="bg-white rounded-2xl border border-[#E2E8F0] p-3 sm:p-4"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto] gap-2.5 sm:gap-3">
          {fields.map((field) => (
            <div key={field.key} className="lg:border-r lg:last:border-r-0 border-[#E2E8F0] lg:pr-3">
              <label className="font-data block text-[0.58rem] tracking-[0.18em] uppercase text-[#6B776E] mb-1 px-1">
                {field.label}
              </label>
              <Select
                value={values[field.key]}
                onValueChange={(v) =>
                  setValues((prev) => ({ ...prev, [field.key]: v }))
                }
              >
                <SelectTrigger
                  aria-label={field.label}
                  className="w-full bg-white border-transparent hover:border-[#E2E8F0] text-[#131B16] text-sm h-10 rounded-lg focus:ring-[#1E6B3A]/30 focus:border-[#1E6B3A] shadow-none"
                >
                  <SelectValue placeholder={field.options[0]?.label} />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E2E8F0]">
                  {field.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="btn-premium w-full lg:w-auto h-10 text-sm px-6"
            >
              <Search className="w-4 h-4 mr-1.5" />
              {t('projects.search.searchBtn')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
