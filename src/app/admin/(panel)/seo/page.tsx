'use client'
import { useState, useEffect } from 'react'
import { Search, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SeoPage {
  path: string
  label: string
}

interface SeoEntry {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  noindex?: boolean
}

type SeoMap = Record<string, SeoEntry>

export default function SeoPage() {
  const [pages, setPages] = useState<SeoPage[]>([])
  const [map, setMap] = useState<SeoMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/seo')
      .then((r) => r.json())
      .then((d) => {
        setPages(Array.isArray(d.pages) ? d.pages : [])
        setMap(d.map && typeof d.map === 'object' ? d.map : {})
      })
      .catch(() => toast.error('Failed to load SEO settings'))
      .finally(() => setLoading(false))
  }, [])

  const update = (path: string, key: keyof SeoEntry, value: string | boolean) => {
    setMap((prev) => ({ ...prev, [path]: { ...prev[path], [key]: value } }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(map),
      })
      const data = await res.json()
      if (data.success) toast.success('SEO settings saved')
      else toast.error(data.error || 'Failed to save')
    } catch {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">SEO</h1>
        </div>
        <button onClick={save} disabled={saving || loading} className="btn-admin btn-admin-primary text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? ' Saving...' : ' Save SEO Settings'}
        </button>
      </div>

      <p className="text-sm text-slate-400 max-w-3xl">
        These per-page overrides win over the auto-generated title, meta description and social-share tags.
        Leave any field blank to fall back to the built-in defaults for that page.
      </p>

      {loading ? (
        <div className="admin-card p-6 flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => {
            const entry = map[page.path] || {}
            return (
              <div key={page.path} className="admin-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{page.label}</h3>
                  <span className="text-xs text-slate-500 font-mono">{page.path}</span>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Title</label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="Uses the page default when empty"
                    value={entry.title || ''}
                    onChange={(e) => update(page.path, 'title', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Meta Description</label>
                  <textarea
                    className="admin-input min-h-[80px] resize-y"
                    placeholder="Uses the page default when empty. Aim for under 160 characters."
                    value={entry.description || ''}
                    onChange={(e) => update(page.path, 'description', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Keywords</label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="land, purbachal, rajuk plots"
                    value={entry.keywords || ''}
                    onChange={(e) => update(page.path, 'keywords', e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Comma-separated list of keywords.</p>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">OG Image URL</label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="/images/hero-slide-1.webp"
                    value={entry.ogImage || ''}
                    onChange={(e) => update(page.path, 'ogImage', e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Social / link-share preview image. Recommended 1200×630 px.</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(entry.noindex)}
                    onChange={(e) => update(page.path, 'noindex', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-[#1E6B3A] focus:ring-[#1E6B3A] focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-300">Hide from search engines (noindex)</span>
                </label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
