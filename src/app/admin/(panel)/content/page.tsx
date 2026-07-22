'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Globe, Save, Plus, Trash2, ChevronUp, ChevronDown, Loader2,
  Sparkles, FileText, Shield, MapPin, Award, ArrowUpRight, GripVertical,
  LayoutList, PanelTop, BookOpen, SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import IconPicker from '@/components/IconPicker'
import MediaUploadInput from '@/components/MediaUploadInput'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────
interface ContentSection {
  id: string
  sectionKey: string
  title: string | null
  subtitle: string | null
  content: string | null
  icon: string | null
  image: string | null
  config: string | null
  enabled: boolean
  sortOrder: number
}

type SectionMap = Record<string, ContentSection>

interface Feature { icon: string; title: string; description: string }
interface CookieCategory { key: string; label: string; description: string; locked: boolean }
type SimpleField = 'title' | 'subtitle' | 'content' | 'image'
interface Step { number: number; title: string; description: string; icon: string }
interface Place { name: string; distance: string; icon: string; category: string }
interface Award { title: string; year: string; organization: string; icon: string }
interface AboutPartner { name: string; icon: string }
interface AboutTimelineItem { year: string; title: string; description: string }
interface AboutStat { value: number; suffix: string; label: string }

// ─── Tab definitions ─────────────────────────────────────────────────
const TABS = [
  { id: 'why_choose_us', label: 'Why Choose Us', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'how_it_works', label: 'How It Works', icon: <ArrowUpRight className="w-4 h-4" /> },
  { id: 'cta_section', label: 'CTA Section', icon: <Globe className="w-4 h-4" /> },
  { id: 'section_headers', label: 'Section Headers', icon: <LayoutList className="w-4 h-4" /> },
  { id: 'heros_ctas', label: 'Heros & CTAs', icon: <PanelTop className="w-4 h-4" /> },
  { id: 'about_prose', label: 'About Prose', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'neighborhood_guide', label: 'Neighborhood Guide', icon: <MapPin className="w-4 h-4" /> },
  { id: 'awards', label: 'Awards', icon: <Award className="w-4 h-4" /> },
  { id: 'about_page', label: 'About Page', icon: <FileText className="w-4 h-4" /> },
  { id: 'page_config', label: 'Page Config', icon: <SlidersHorizontal className="w-4 h-4" /> },
  { id: 'legal', label: 'Legal Pages', icon: <Shield className="w-4 h-4" /> },
]

// ─── Declarative lists for the generic simple-section editors ────────
const SECTION_HEADER_ITEMS: { key: string; label: string; fields: SimpleField[] }[] = [
  { key: 'stats_header', label: 'Stats Header', fields: ['title', 'subtitle'] },
  { key: 'stats_section', label: 'Stats Section', fields: ['title', 'subtitle'] },
  { key: 'featured_projects', label: 'Featured Projects', fields: ['title', 'subtitle'] },
  { key: 'gallery_preview', label: 'Gallery Preview', fields: ['title', 'subtitle'] },
  { key: 'testimonials_section', label: 'Testimonials Section', fields: ['title', 'subtitle'] },
  { key: 'faq_section', label: 'FAQ Section', fields: ['title', 'subtitle'] },
  { key: 'blog_section', label: 'Blog Section', fields: ['title', 'subtitle'] },
]

const HERO_CTA_ITEMS: { key: string; label: string; fields: SimpleField[] }[] = [
  { key: 'projects_hero', label: 'Projects — Hero', fields: ['title', 'subtitle', 'content'] },
  { key: 'projects_cta', label: 'Projects — CTA', fields: ['title', 'subtitle', 'content'] },
  { key: 'blog_hero', label: 'Blog — Hero', fields: ['title', 'subtitle', 'content'] },
  { key: 'blog_newsletter', label: 'Blog — Newsletter', fields: ['title', 'subtitle', 'content'] },
  { key: 'gallery_hero', label: 'Gallery — Hero', fields: ['title', 'subtitle', 'content'] },
  { key: 'gallery_cta', label: 'Gallery — CTA', fields: ['title', 'subtitle', 'content'] },
  { key: 'contact_hero', label: 'Contact — Hero', fields: ['title', 'subtitle', 'content'] },
  { key: 'about_hero', label: 'About — Hero', fields: ['title', 'subtitle', 'content'] },
]

const LEGAL_SUBTABS = [
  { id: 'terms_content', label: 'Terms & Conditions' },
  { id: 'privacy_content', label: 'Privacy Policy' },
]

// ─── Helper ──────────────────────────────────────────────────────────
function parseConfig<T>(section: ContentSection | undefined): T | null {
  if (!section?.config) return null
  try { return JSON.parse(section.config) as T } catch { return null }
}

function emptySection(key: string): ContentSection {
  return {
    id: '', sectionKey: key, title: null, subtitle: null,
    content: null, icon: null, image: null, config: null,
    enabled: true, sortOrder: 0,
  }
}

// ─── Reorder helper ─────────────────────────────────────────────────
function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// ─── Component ───────────────────────────────────────────────────────
export default function ContentManagementPage() {
  const [sections, setSections] = useState<SectionMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('why_choose_us')
  const [legalSubTab, setLegalSubTab] = useState('terms_content')

  // ── Fetch all sections on mount ──
  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/content-sections')
      if (!res.ok) throw new Error()
      const data: ContentSection[] = await res.json()
      const map: SectionMap = {}
      data.forEach(s => { map[s.sectionKey] = s })
      setSections(map)
    } catch {
      toast.error('Failed to load content sections')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSections() }, [fetchSections])

  // ── Local state updaters ──
  const updateSection = useCallback((key: string, patch: Partial<ContentSection>) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...(prev[key] || emptySection(key)), ...patch },
    }))
  }, [])

  const saveSection = useCallback(async (key: string) => {
    const s = sections[key] || emptySection(key)
    setSaving(true)
    try {
      const method = s.id ? 'PUT' : 'POST'
      if (method === 'POST') {
        // POST expects sectionKey at top level
        const { sectionKey: _, ...rest } = s
        const res = await fetch('/api/admin/content-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionKey: s.sectionKey, ...rest }),
        })
        const data = await res.json()
        if (data.success && data.section) {
          updateSection(key, { id: data.section.id })
          toast.success('Section saved')
        } else {
          toast.error('Failed to save')
        }
      } else {
        const { id, ...rest } = s
        const res = await fetch('/api/admin/content-sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: s.id, ...rest }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Section saved')
        } else {
          toast.error('Failed to save')
        }
      }
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }, [sections, updateSection])

  // ── Delete section ──
  const deleteSection = useCallback(async (key: string) => {
    const s = sections[key]
    if (!s?.id) return
    try {
      const res = await fetch('/api/admin/content-sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id }),
      })
      const data = await res.json()
      if (data.success) {
        setSections(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        toast.success('Section deleted')
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Delete failed')
    }
  }, [sections])

  // ── Config helpers for array fields ──
  const getConfig = <T,>(key: string, fallback: T): T => {
    const parsed = parseConfig<T>(sections[key])
    return parsed ?? fallback
  }

  const setConfig = useCallback((key: string, config: unknown) => {
    updateSection(key, { config: JSON.stringify(config) })
  }, [updateSection])

  // ═══════════════════════════════════════════════════════════════════
  //  TAB 1: Why Choose Us
  // ═══════════════════════════════════════════════════════════════════
  function WhyChooseUsTab() {
    const key = 'why_choose_us'
    const s = sections[key] || emptySection(key)
    const cfg = getConfig<{ features?: Feature[]; secondaryImage?: string }>(key, {})
    const features = cfg.features ?? []

    const updateFeature = (idx: number, patch: Partial<Feature>) => {
      const next = [...features]
      next[idx] = { ...next[idx], ...patch }
      setConfig(key, { ...cfg, features: next })
    }

    const addFeature = () => {
      setConfig(key, { ...cfg, features: [...features, { icon: 'Star', title: '', description: '' }] })
    }

    const removeFeature = (idx: number) => {
      const next = features.filter((_, i) => i !== idx)
      setConfig(key, { ...cfg, features: next })
    }

    const moveFeature = (from: number, to: number) => {
      setConfig(key, { ...cfg, features: moveItem(features, from, to) })
    }

    return (
      <div className="admin-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Section Title</label>
            <input className="admin-input" placeholder="Why Choose Us" value={s.title || ''} onChange={e => updateSection(key, { title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Subtitle</label>
            <input className="admin-input" placeholder="What makes us different" value={s.subtitle || ''} onChange={e => updateSection(key, { subtitle: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Intro Paragraph</label>
          <RichTextEditor value={s.content || ''} onChange={html => updateSection(key, { content: html })} placeholder="Matrica Real Estate Ltd is a new developer doing this the old-fashioned way..." minHeight="160px" />
          <p className="text-[11px] text-slate-500 mt-1">Lead paragraph shown above the feature checklist. Leave blank to use the built-in default.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Main Image</label>
            <MediaUploadInput
              value={s.image || ''}
              onChange={url => updateSection(key, { image: url })}
              accept="image/jpeg,image/png,image/webp,image/avif"
              placeholder="/images/project-ventura.webp"
              hint="Large image on the right. ~1200×900 px (4:3). JPG/WebP, under 500 KB. Leave blank for default."
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Secondary Image</label>
            <MediaUploadInput
              value={cfg.secondaryImage || ''}
              onChange={url => setConfig(key, { ...cfg, secondaryImage: url })}
              accept="image/jpeg,image/png,image/webp,image/avif"
              placeholder="/images/about-office.webp"
              hint="Small offset card (desktop only). ~560×400 px. Leave blank for default."
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-200">Features ({features.length})</h4>
            <button onClick={addFeature} className="btn-admin text-xs py-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Feature
            </button>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            {features.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No features yet. Click &quot;Add Feature&quot; to start.</div>
            )}
            {features.map((f, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Feature #{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveFeature(i, i - 1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveFeature(i, i + 1)} disabled={i === features.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeFeature(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
                  <IconPicker value={f.icon} onChange={v => updateFeature(i, { icon: v })} label="Icon" />
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Title</label>
                    <input className="admin-input" placeholder="Feature title" value={f.title} onChange={e => updateFeature(i, { title: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                  <RichTextEditor value={f.description} onChange={html => updateFeature(i, { description: html })} placeholder="Feature description..." minHeight="160px" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(key)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TAB 2: How It Works
  // ═══════════════════════════════════════════════════════════════════
  function HowItWorksTab() {
    const key = 'how_it_works'
    const s = sections[key] || emptySection(key)
    const steps = getConfig<{ steps?: Step[] }>(key, {}).steps ?? []

    const updateStep = (idx: number, patch: Partial<Step>) => {
      const next = [...steps]
      next[idx] = { ...next[idx], ...patch }
      setConfig(key, { steps: next })
    }

    const addStep = () => {
      setConfig(key, { steps: [...steps, { number: steps.length + 1, title: '', description: '', icon: 'CircleDot' }] })
    }

    const removeStep = (idx: number) => {
      const next = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, number: i + 1 }))
      setConfig(key, { steps: next })
    }

    const moveStep = (from: number, to: number) => {
      const moved = moveItem(steps, from, to).map((s, i) => ({ ...s, number: i + 1 }))
      setConfig(key, { steps: moved })
    }

    return (
      <div className="admin-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Section Title</label>
            <input className="admin-input" placeholder="How It Works" value={s.title || ''} onChange={e => updateSection(key, { title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Subtitle</label>
            <input className="admin-input" placeholder="Your journey with us" value={s.subtitle || ''} onChange={e => updateSection(key, { subtitle: e.target.value })} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-200">Steps ({steps.length})</h4>
            <button onClick={addStep} className="btn-admin text-xs py-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            {steps.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No steps yet. Click &quot;Add Step&quot; to start.</div>
            )}
            {steps.map((st, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#1E6B3A]/20 text-[#34D399] text-xs font-bold flex items-center justify-center border border-[#1E6B3A]/30">
                      {i + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Step {i + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveStep(i, i - 1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveStep(i, i + 1)} disabled={i === steps.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeStep(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
                  <IconPicker value={st.icon} onChange={v => updateStep(i, { icon: v })} label="Icon" />
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Title</label>
                    <input className="admin-input" placeholder="Step title" value={st.title} onChange={e => updateStep(i, { title: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                  <RichTextEditor value={st.description} onChange={html => updateStep(i, { description: html })} placeholder="Step description..." minHeight="160px" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(key)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TAB 3: CTA Section
  // ═══════════════════════════════════════════════════════════════════
  function CTATab() {
    const key = 'cta_section'
    const s = sections[key] || emptySection(key)
    const config = getConfig<{ buttonText?: string; buttonUrl?: string }>(key, {})

    const updateConfigField = (field: string, value: string) => {
      setConfig(key, { ...config, [field]: value })
    }

    return (
      <div className="admin-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title</label>
            <input className="admin-input" placeholder="Ready to Find Your Dream Home?" value={s.title || ''} onChange={e => updateSection(key, { title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Subtitle</label>
            <input className="admin-input" placeholder="Contact us today" value={s.subtitle || ''} onChange={e => updateSection(key, { subtitle: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Content</label>
          <RichTextEditor value={s.content || ''} onChange={html => updateSection(key, { content: html })} placeholder="Main CTA content text..." minHeight="160px" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">CTA Button Text</label>
            <input className="admin-input" placeholder="Get Started" value={config.buttonText || ''} onChange={e => updateConfigField('buttonText', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">CTA Button URL</label>
            <input className="admin-input" placeholder="/contact" value={config.buttonUrl || ''} onChange={e => updateConfigField('buttonUrl', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Background Image URL</label>
          <input className="admin-input" placeholder="/images/cta-bg.jpg" value={s.image || ''} onChange={e => updateSection(key, { image: e.target.value })} />
          <p className="text-[11px] text-slate-500 mt-1">Recommended 1920×1080 px (16:9), landscape full-width background. WebP or JPG, under 500 KB.</p>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(key)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TAB 4: Neighborhood Guide
  // ═══════════════════════════════════════════════════════════════════
  const NEIGHBORHOOD_CATEGORIES = ['Education', 'Healthcare', 'Shopping', 'Transport', 'Dining', 'Entertainment', 'Religious', 'Other']

  function NeighborhoodTab() {
    const key = 'neighborhood_guide'
    const s = sections[key] || emptySection(key)
    const places = getConfig<{ places?: Place[] }>(key, {}).places ?? []

    const updatePlace = (idx: number, patch: Partial<Place>) => {
      const next = [...places]
      next[idx] = { ...next[idx], ...patch }
      setConfig(key, { places: next })
    }

    const addPlace = () => {
      setConfig(key, { places: [...places, { name: '', distance: '', icon: 'MapPin', category: 'Other' }] })
    }

    const removePlace = (idx: number) => {
      const next = places.filter((_, i) => i !== idx)
      setConfig(key, { places: next })
    }

    const movePlace = (from: number, to: number) => {
      setConfig(key, { places: moveItem(places, from, to) })
    }

    return (
      <div className="admin-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Section Title</label>
            <input className="admin-input" placeholder="Neighborhood Guide" value={s.title || ''} onChange={e => updateSection(key, { title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Subtitle</label>
            <input className="admin-input" placeholder="Everything nearby" value={s.subtitle || ''} onChange={e => updateSection(key, { subtitle: e.target.value })} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-200">Places ({places.length})</h4>
            <button onClick={addPlace} className="btn-admin text-xs py-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Place
            </button>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            {places.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No places yet. Click &quot;Add Place&quot; to start.</div>
            )}
            {places.map((p, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Place #{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => movePlace(i, i - 1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => movePlace(i, i + 1)} disabled={i === places.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removePlace(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-3">
                  <IconPicker value={p.icon} onChange={v => updatePlace(i, { icon: v })} label="Icon" />
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Name</label>
                    <input className="admin-input" placeholder="Place name" value={p.name} onChange={e => updatePlace(i, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Distance</label>
                    <input className="admin-input" placeholder="e.g. 5 mins, 2 km" value={p.distance} onChange={e => updatePlace(i, { distance: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Category</label>
                  <select className="admin-select" value={p.category} onChange={e => updatePlace(i, { category: e.target.value })}>
                    {NEIGHBORHOOD_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(key)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TAB 5: Awards
  // ═══════════════════════════════════════════════════════════════════
  function AwardsTab() {
    const key = 'awards'
    const s = sections[key] || emptySection(key)
    const awards = getConfig<{ awards?: Award[] }>(key, {}).awards ?? []

    const updateAward = (idx: number, patch: Partial<Award>) => {
      const next = [...awards]
      next[idx] = { ...next[idx], ...patch }
      setConfig(key, { awards: next })
    }

    const addAward = () => {
      setConfig(key, { awards: [...awards, { title: '', year: '', organization: '', icon: 'Trophy' }] })
    }

    const removeAward = (idx: number) => {
      const next = awards.filter((_, i) => i !== idx)
      setConfig(key, { awards: next })
    }

    const moveAward = (from: number, to: number) => {
      setConfig(key, { awards: moveItem(awards, from, to) })
    }

    return (
      <div className="admin-card p-6 space-y-6">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Section Title</label>
          <input className="admin-input max-w-md" placeholder="Awards & Recognition" value={s.title || ''} onChange={e => updateSection(key, { title: e.target.value })} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-200">Awards ({awards.length})</h4>
            <button onClick={addAward} className="btn-admin text-xs py-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Award
            </button>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            {awards.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No awards yet. Click &quot;Add Award&quot; to start.</div>
            )}
            {awards.map((a, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Award #{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveAward(i, i - 1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveAward(i, i + 1)} disabled={i === awards.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeAward(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-3">
                  <IconPicker value={a.icon} onChange={v => updateAward(i, { icon: v })} label="Icon" />
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Title</label>
                    <input className="admin-input" placeholder="Award title" value={a.title} onChange={e => updateAward(i, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Year</label>
                    <input className="admin-input" placeholder="2024" value={a.year} onChange={e => updateAward(i, { year: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Organization</label>
                  <input className="admin-input" placeholder="Awarding organization" value={a.organization} onChange={e => updateAward(i, { organization: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(key)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TAB 6: About Page (partners, timeline, stats)
  // ═══════════════════════════════════════════════════════════════════
  function AboutPageTab() {
    const partnersKey = 'about_partners'
    const timelineKey = 'about_timeline'
    const statsKey = 'about_stats'

    const partners = getConfig<{ partners: AboutPartner[] }>(partnersKey, { partners: [] }).partners || []
    const timeline = getConfig<{ items: AboutTimelineItem[] }>(timelineKey, { items: [] }).items || []
    const aboutStats = getConfig<{ stats: AboutStat[] }>(statsKey, { stats: [] }).stats || []

    // ── Partners (Approvals & Utilities) ──
    const updatePartner = (idx: number, patch: Partial<AboutPartner>) => {
      const next = [...partners]
      next[idx] = { ...next[idx], ...patch }
      setConfig(partnersKey, { partners: next })
    }
    const addPartner = () => {
      setConfig(partnersKey, { partners: [...partners, { name: '', icon: 'Building2' }] })
    }
    const removePartner = (idx: number) => {
      setConfig(partnersKey, { partners: partners.filter((_, i) => i !== idx) })
    }
    const movePartner = (from: number, to: number) => {
      setConfig(partnersKey, { partners: moveItem(partners, from, to) })
    }

    // ── Timeline (Our Journey) ──
    const updateTimelineItem = (idx: number, patch: Partial<AboutTimelineItem>) => {
      const next = [...timeline]
      next[idx] = { ...next[idx], ...patch }
      setConfig(timelineKey, { items: next })
    }
    const addTimelineItem = () => {
      setConfig(timelineKey, { items: [...timeline, { year: '', title: '', description: '' }] })
    }
    const removeTimelineItem = (idx: number) => {
      setConfig(timelineKey, { items: timeline.filter((_, i) => i !== idx) })
    }
    const moveTimelineItem = (from: number, to: number) => {
      setConfig(timelineKey, { items: moveItem(timeline, from, to) })
    }

    // ── Stats ──
    const updateStat = (idx: number, patch: Partial<AboutStat>) => {
      const next = [...aboutStats]
      next[idx] = { ...next[idx], ...patch }
      setConfig(statsKey, { stats: next })
    }
    const addStat = () => {
      setConfig(statsKey, { stats: [...aboutStats, { value: 0, suffix: '', label: '' }] })
    }
    const removeStat = (idx: number) => {
      setConfig(statsKey, { stats: aboutStats.filter((_, i) => i !== idx) })
    }
    const moveStat = (from: number, to: number) => {
      setConfig(statsKey, { stats: moveItem(aboutStats, from, to) })
    }

    return (
      <div className="space-y-6">
        {/* ── Approvals & Utilities (partners) ── */}
        <div className="admin-card p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-200">Approvals &amp; Utilities ({partners.length})</h4>
              <button onClick={addPartner} className="btn-admin text-xs py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" /> Add Body
              </button>
            </div>
            <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
              {partners.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">No bodies yet. Click &quot;Add Body&quot; to start.</div>
              )}
              {partners.map((p, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Body #{i + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => movePartner(i, i - 1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => movePartner(i, i + 1)} disabled={i === partners.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removePartner(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
                    <IconPicker value={p.icon} onChange={v => updatePartner(i, { icon: v })} label="Icon" />
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Name</label>
                      <input className="admin-input" placeholder="e.g. RAJUK" value={p.name} onChange={e => updatePartner(i, { name: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button onClick={() => saveSection(partnersKey)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Approvals & Utilities'}
            </button>
          </div>
        </div>

        {/* ── Timeline (Our Journey) ── */}
        <div className="admin-card p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-200">Journey Timeline ({timeline.length})</h4>
              <button onClick={addTimelineItem} className="btn-admin text-xs py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" /> Add Milestone
              </button>
            </div>
            <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
              {timeline.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">No milestones yet. Click &quot;Add Milestone&quot; to start.</div>
              )}
              {timeline.map((t, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Milestone #{i + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveTimelineItem(i, i - 1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveTimelineItem(i, i + 1)} disabled={i === timeline.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeTimelineItem(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Label / Year</label>
                      <input className="admin-input" placeholder="e.g. Day One, 2024" value={t.year} onChange={e => updateTimelineItem(i, { year: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Title</label>
                      <input className="admin-input" placeholder="Milestone title" value={t.title} onChange={e => updateTimelineItem(i, { title: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                    <RichTextEditor value={t.description} onChange={html => updateTimelineItem(i, { description: html })} placeholder="Milestone description..." minHeight="160px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button onClick={() => saveSection(timelineKey)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Timeline'}
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="admin-card p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-200">Stats ({aboutStats.length})</h4>
              <button onClick={addStat} className="btn-admin text-xs py-1.5 px-3">
                <Plus className="w-3.5 h-3.5" /> Add Stat
              </button>
            </div>
            <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
              {aboutStats.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">No stats yet. Click &quot;Add Stat&quot; to start.</div>
              )}
              {aboutStats.map((st, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Stat #{i + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveStat(i, i - 1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveStat(i, i + 1)} disabled={i === aboutStats.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeStat(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[140px_120px_1fr] gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Value (number)</label>
                      <input type="number" className="admin-input" placeholder="500" value={st.value} onChange={e => updateStat(i, { value: Number(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Suffix</label>
                      <input className="admin-input" placeholder="+ or %" value={st.suffix} onChange={e => updateStat(i, { suffix: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Label</label>
                      <input className="admin-input" placeholder="e.g. Bigha Under Development" value={st.label} onChange={e => updateStat(i, { label: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button onClick={() => saveSection(statsKey)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Stats'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TAB 7: Legal Pages
  // ═══════════════════════════════════════════════════════════════════
  function LegalTab() {
    const s = sections[legalSubTab] || emptySection(legalSubTab)
    const label = legalSubTab === 'terms_content' ? 'Terms & Conditions' : 'Privacy Policy'

    return (
      <div className="admin-card p-6 space-y-4">
        <div className="flex gap-2 border-b border-slate-800 pb-3">
          {LEGAL_SUBTABS.map(st => (
            <button
              key={st.id}
              onClick={() => setLegalSubTab(st.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                legalSubTab === st.id
                  ? 'bg-[#1E6B3A]/15 text-[#34D399] border border-[#1E6B3A]/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">{label} Content (HTML)</label>
          <textarea
            className="admin-input min-h-[400px] resize-y font-mono text-xs leading-relaxed"
            placeholder={`<h2>${label}</h2>\n<p>Enter your ${label.toLowerCase()} content here...</p>`}
            value={s.content || ''}
            onChange={e => updateSection(legalSubTab, { content: e.target.value })}
          />
          <p className="mt-1.5 text-[11px] text-slate-600">Supports HTML. This content will be rendered on the frontend legal page.</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <Dialog>
            <DialogTrigger asChild>
              <button className="btn-admin text-xs py-1.5 px-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 border-red-900/30 hover:border-red-800/40">
                <Trash2 className="w-3.5 h-3.5" /> Reset {label}
              </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Reset {label}?</DialogTitle>
                <DialogDescription className="text-slate-400">
                  This will delete the saved {label.toLowerCase()} content. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <button className="btn-admin text-sm py-1.5 px-4" onClick={() => document.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click()}>Cancel</button>
                <button
                  className="btn-admin text-sm py-1.5 px-4 bg-red-900/40 text-red-400 hover:bg-red-900/60 border-red-800/40"
                  onClick={() => {
                    deleteSection(legalSubTab)
                    document.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click()
                  }}
                >
                  Delete
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <button onClick={() => saveSection(legalSubTab)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : `Save ${label}`}
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Generic simple-section editor (title / subtitle / content / image)
  //  Rendered as function calls (not <Comp/>) so inputs keep focus.
  // ═══════════════════════════════════════════════════════════════════
  const renderSimpleSection = (
    sectionKey: string,
    opts: { label: string; fields: SimpleField[]; description?: string }
  ) => {
    const s = sections[sectionKey] || emptySection(sectionKey)
    return (
      <div key={sectionKey} className="admin-card p-6 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-slate-200">{opts.label}</h4>
          {opts.description && <p className="text-xs text-slate-500 mt-0.5">{opts.description}</p>}
        </div>
        {opts.fields.includes('title') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title</label>
            <input className="admin-input" placeholder="Title" value={s.title || ''} onChange={e => updateSection(sectionKey, { title: e.target.value })} />
          </div>
        )}
        {opts.fields.includes('subtitle') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Subtitle</label>
            <input className="admin-input" placeholder="Subtitle" value={s.subtitle || ''} onChange={e => updateSection(sectionKey, { subtitle: e.target.value })} />
          </div>
        )}
        {opts.fields.includes('content') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Content</label>
            <RichTextEditor value={s.content || ''} onChange={html => updateSection(sectionKey, { content: html })} placeholder="Content..." minHeight="160px" />
          </div>
        )}
        {opts.fields.includes('image') && (
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Image URL</label>
            <input className="admin-input" placeholder="/images/..." value={s.image || ''} onChange={e => updateSection(sectionKey, { image: e.target.value })} />
            <p className="text-[11px] text-slate-500 mt-1">Recommended 1200×900 px (4:3) or larger. JPG or WebP, under 500 KB.</p>
          </div>
        )}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(sectionKey)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  const renderSectionHeaders = () => (
    <div className="space-y-6">
      {SECTION_HEADER_ITEMS.map(it => renderSimpleSection(it.key, { label: it.label, fields: it.fields }))}
    </div>
  )

  const renderHerosCtas = () => (
    <div className="space-y-6">
      {HERO_CTA_ITEMS.map(it => renderSimpleSection(it.key, { label: it.label, fields: it.fields }))}
    </div>
  )

  // ─── About prose (story / mission / vision / values repeater) ───
  const renderAboutValues = () => {
    const key = 'about_values'
    const s = sections[key] || emptySection(key)
    const values = getConfig<{ values?: Feature[] }>(key, {}).values ?? []
    const updateValue = (idx: number, patch: Partial<Feature>) => {
      const next = [...values]
      next[idx] = { ...next[idx], ...patch }
      setConfig(key, { values: next })
    }
    const addValue = () => setConfig(key, { values: [...values, { icon: 'Star', title: '', description: '' }] })
    const removeValue = (idx: number) => setConfig(key, { values: values.filter((_, i) => i !== idx) })
    const moveValue = (from: number, to: number) => setConfig(key, { values: moveItem(values, from, to) })

    return (
      <div className="admin-card p-6 space-y-6">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Section Title</label>
          <input className="admin-input max-w-md" placeholder="Our Values" value={s.title || ''} onChange={e => updateSection(key, { title: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-200">Values ({values.length})</h4>
            <button onClick={addValue} className="btn-admin text-xs py-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Value
            </button>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            {values.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No values yet. Click &quot;Add Value&quot; to start.</div>
            )}
            {values.map((v, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Value #{i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveValue(i, i - 1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveValue(i, i + 1)} disabled={i === values.length - 1} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeValue(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
                  <IconPicker value={v.icon} onChange={val => updateValue(i, { icon: val })} label="Icon" />
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Title</label>
                    <input className="admin-input" placeholder="Value title" value={v.title} onChange={e => updateValue(i, { title: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                  <RichTextEditor value={v.description} onChange={html => updateValue(i, { description: html })} placeholder="Value description..." minHeight="160px" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(key)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Values'}
          </button>
        </div>
      </div>
    )
  }

  const renderAboutProse = () => (
    <div className="space-y-6">
      {renderSimpleSection('about_story', { label: 'Our Story', fields: ['title', 'content', 'image'] })}
      {renderSimpleSection('about_mission', { label: 'Mission', fields: ['title', 'content'] })}
      {renderSimpleSection('about_vision', { label: 'Vision', fields: ['title', 'content'] })}
      {renderAboutValues()}
    </div>
  )

  // ─── Page config (cookie consent categories + property search options) ───
  const renderCookieConsent = () => {
    const key = 'cookie_consent'
    const s = sections[key] || emptySection(key)
    const categories = getConfig<{ categories?: CookieCategory[] }>(key, {}).categories ?? []
    const updateCat = (idx: number, patch: Partial<CookieCategory>) => {
      const next = [...categories]
      next[idx] = { ...next[idx], ...patch }
      setConfig(key, { categories: next })
    }
    const addCat = () => setConfig(key, { categories: [...categories, { key: '', label: '', description: '', locked: false }] })
    const removeCat = (idx: number) => setConfig(key, { categories: categories.filter((_, i) => i !== idx) })

    return (
      <div className="admin-card p-6 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-slate-200">Cookie Consent</h4>
          <p className="text-xs text-slate-500 mt-0.5">Banner heading and the cookie categories users can toggle.</p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Banner Title</label>
          <input className="admin-input" placeholder="We value your privacy" value={s.title || ''} onChange={e => updateSection(key, { title: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Banner Text</label>
          <textarea className="admin-input min-h-[80px] resize-y" placeholder="We use cookies to..." value={s.content || ''} onChange={e => updateSection(key, { content: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-200">Categories ({categories.length})</h4>
            <button onClick={addCat} className="btn-admin text-xs py-1.5 px-3">
              <Plus className="w-3.5 h-3.5" /> Add Category
            </button>
          </div>
          <div className="space-y-3">
            {categories.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No categories yet. Click &quot;Add Category&quot; to start.</div>
            )}
            {categories.map((c, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Category #{i + 1}</span>
                  <button onClick={() => removeCat(i)} className="p-1 rounded hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Key</label>
                    <input className="admin-input" placeholder="e.g. analytics" value={c.key} onChange={e => updateCat(i, { key: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Label</label>
                    <input className="admin-input" placeholder="e.g. Analytics Cookies" value={c.label} onChange={e => updateCat(i, { label: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                  <RichTextEditor value={c.description} onChange={html => updateCat(i, { description: html })} placeholder="What this category is used for..." minHeight="160px" />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={c.locked} onChange={e => updateCat(i, { locked: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-[#1E6B3A]" />
                  <span className="text-xs text-slate-300">Locked (always on, user can&apos;t disable)</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(key)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Cookie Consent'}
          </button>
        </div>
      </div>
    )
  }

  const renderPropertySearch = () => {
    const key = 'property_search'
    const config = getConfig<{ types?: string[]; budgets?: string[]; plotSizes?: string[] }>(key, {})
    const types = config.types ?? []
    const budgets = config.budgets ?? []
    const plotSizes = config.plotSizes ?? []
    const setList = (field: 'types' | 'budgets' | 'plotSizes', raw: string) => {
      const list = raw.split('\n').map(l => l.trim()).filter(Boolean)
      setConfig(key, { ...config, [field]: list })
    }

    const listField = (label: string, field: 'types' | 'budgets' | 'plotSizes', list: string[], placeholder: string) => (
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">{label} ({list.length})</label>
        <textarea className="admin-input min-h-[120px] resize-y" placeholder={placeholder} value={list.join('\n')} onChange={e => setList(field, e.target.value)} />
        <p className="mt-1 text-[11px] text-slate-600">One option per line.</p>
      </div>
    )

    return (
      <div className="admin-card p-6 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-slate-200">Property Search Options</h4>
          <p className="text-xs text-slate-500 mt-0.5">Dropdown options for the property search filters.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {listField('Property Types', 'types', types, 'Residential\nCommercial')}
          {listField('Budget Ranges', 'budgets', budgets, 'Under ৳25 Lakh\n৳25–50 Lakh')}
          {listField('Plot Sizes', 'plotSizes', plotSizes, '3 Katha\n5 Katha')}
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={() => saveSection(key)} disabled={saving} className="btn-admin btn-admin-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Search Options'}
          </button>
        </div>
      </div>
    )
  }

  const renderPageConfig = () => (
    <div className="space-y-6">
      {renderCookieConsent()}
      {renderPropertySearch()}
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-slate-400 animate-pulse" />
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
        </div>
        <div className="admin-card p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#34D399] animate-spin" />
          <span className="ml-3 text-slate-400">Loading content sections...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#1E6B3A]/15 text-[#34D399] border border-[#1E6B3A]/20 shadow-sm shadow-[#34D399]/5'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'why_choose_us' && WhyChooseUsTab()}
        {activeTab === 'how_it_works' && HowItWorksTab()}
        {activeTab === 'cta_section' && CTATab()}
        {activeTab === 'section_headers' && renderSectionHeaders()}
        {activeTab === 'heros_ctas' && renderHerosCtas()}
        {activeTab === 'about_prose' && renderAboutProse()}
        {activeTab === 'neighborhood_guide' && NeighborhoodTab()}
        {activeTab === 'awards' && AwardsTab()}
        {activeTab === 'about_page' && AboutPageTab()}
        {activeTab === 'page_config' && renderPageConfig()}
        {activeTab === 'legal' && LegalTab()}
      </div>
    </div>
  )
}