'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, RotateCcw } from 'lucide-react'

type Settings = Record<string, string>

const COLORS: { key: string; label: string; fallback: string }[] = [
  { key: 'brand_primary', label: 'Primary (buttons, rings)', fallback: '#1E6B3A' },
  { key: 'brand_action', label: 'Action / Brand', fallback: '#1A5C33' },
  { key: 'brand_gold', label: 'Gold accent', fallback: '#A98B4F' },
  { key: 'theme_gold_light', label: 'Gold light', fallback: '#C7AE79' },
  { key: 'theme_brand_deep', label: 'Brand deep', fallback: '#124024' },
  { key: 'theme_background', label: 'Background', fallback: '#FFFFFF' },
  { key: 'theme_foreground', label: 'Foreground / text', fallback: '#1A202C' },
  { key: 'theme_accent', label: 'Accent surface', fallback: '#E8F5ED' },
  { key: 'theme_accent_fg', label: 'Accent text', fallback: '#145229' },
  { key: 'theme_muted', label: 'Muted surface', fallback: '#F8FAFB' },
  { key: 'theme_muted_fg', label: 'Muted text', fallback: '#64748B' },
  { key: 'theme_border', label: 'Borders / inputs', fallback: '#E2E8F0' },
]

const TEXT_FIELDS: { group: string; fields: { key: string; label: string; placeholder: string }[] }[] = [
  { group: 'Layout', fields: [
    { key: 'theme_radius', label: 'Corner radius', placeholder: '0.375rem' },
  ] },
  { group: 'Fonts', fields: [
    { key: 'font_heading', label: 'Heading font-family', placeholder: 'e.g. "Playfair Display", serif' },
    { key: 'font_body', label: 'Body font-family', placeholder: 'e.g. "Plus Jakarta Sans", sans-serif' },
    { key: 'font_mono', label: 'Mono font-family', placeholder: 'e.g. "JetBrains Mono", monospace' },
    { key: 'font_google_url', label: 'Google Fonts stylesheet URL (optional)', placeholder: 'https://fonts.googleapis.com/css2?family=...' },
  ] },
  { group: 'Calculator', fields: [
    { key: 'emi_default_rate', label: 'Default interest rate (%)', placeholder: '9.5' },
    { key: 'emi_default_tenure', label: 'Default tenure (years)', placeholder: '5' },
    { key: 'emi_max_tenure', label: 'Max tenure (years)', placeholder: '30' },
    { key: 'emi_min_loan', label: 'Min loan (৳)', placeholder: '500000' },
    { key: 'emi_max_loan', label: 'Max loan (৳)', placeholder: '100000000' },
    { key: 'emi_down_payment_pct', label: 'Down payment (%)', placeholder: '20' },
  ] },
]

export default function AppearancePage() {
  const [s, setS] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setS(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (v as string) ?? ''])))
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const set = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }))
  const val = (k: string) => s[k] ?? ''

  const save = async () => {
    setSaving(true)
    try {
      const keys = [
        ...COLORS.map((c) => c.key),
        ...TEXT_FIELDS.flatMap((g) => g.fields.map((f) => f.key)),
        'anim_enabled',
      ]
      const payload = Object.fromEntries(keys.map((k) => [k, val(k)]))
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      })
      if (!res.ok) throw new Error()
      toast.success('Appearance saved — reload the public site to see changes')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>

  const animOn = val('anim_enabled') !== 'false'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Appearance</h1>
          <p className="text-sm text-muted-foreground">Theme colors, fonts, corner radius, animations, and calculator limits. Empty = keep the built-in default.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-admin inline-flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COLORS.map((c) => {
            const v = val(c.key)
            return (
              <div key={c.key} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2">
                <input
                  type="color"
                  value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : c.fallback}
                  onChange={(e) => set(c.key, e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer border border-border shrink-0"
                  aria-label={c.label}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground truncate">{c.label}</div>
                  <input
                    value={v}
                    onChange={(e) => set(c.key, e.target.value)}
                    placeholder={c.fallback}
                    className="admin-input w-full text-sm h-8 font-mono"
                  />
                </div>
                {v && (
                  <button onClick={() => set(c.key, '')} title="Reset to default" className="text-muted-foreground hover:text-foreground shrink-0"><RotateCcw className="w-3.5 h-3.5" /></button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Animations</h2>
        <label className="flex items-center gap-3 border border-border rounded-lg px-3 py-3 cursor-pointer">
          <input type="checkbox" checked={animOn} onChange={(e) => set('anim_enabled', e.target.checked ? 'true' : 'false')} className="w-4 h-4" />
          <span className="text-sm">Enable site animations & transitions <span className="text-muted-foreground">(off = respect reduced-motion everywhere)</span></span>
        </label>
      </section>

      {TEXT_FIELDS.map((g) => (
        <section key={g.group}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{g.group}</h2>
          <div className="space-y-3">
            {g.fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground">{f.label}</label>
                <input value={val(f.key)} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className="admin-input w-full text-sm mt-1" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
