'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, ChevronUp, ChevronDown, GripVertical, Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import RichTextEditor from '@/components/RichTextEditor'
import IconPicker from '@/components/IconPicker'
import MediaUploadInput from '@/components/MediaUploadInput'
import { useFieldOptions } from '@/hooks/useFieldOptions'
import { useDragReorder, arrayMove } from '@/hooks/useDragReorder'

// ─── Row types for the typed child collections ─────────────────────
type SpecRow = { label: string; value: string }
type StageRow = { label: string; stage: string }
type AmenityRow = { icon: string; label: string }
type DistanceRow = { place: string; value: string }
type LandmarkRow = { icon: string; name: string; minutes: number; angle: number; ring: number }
type FaqRow = { question: string; answer: string }
type ImageRow = { url: string; caption: string }
type DocumentRow = {
  docType: string; label: string; fileUrl: string; version: number
  viewable: boolean; gated: boolean; enabled: boolean; downloads: number
}

const inputCls = 'admin-input'

// ─── Generic repeater — add / remove / reorder for a collection ────
function Repeater<T>({
  title, addLabel, items, setItems, blank, renderRow, emptyText,
}: {
  title: string
  addLabel: string
  items: T[]
  setItems: (v: T[]) => void
  blank: () => T
  renderRow: (item: T, i: number, update: (field: keyof T, value: unknown) => void) => React.ReactNode
  emptyText: string
}) {
  const add = () => setItems([...items, blank()])
  const remove = (index: number) => setItems(items.filter((_, i) => i !== index))
  const update = (index: number, field: keyof T, value: unknown) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }
  const move = (index: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= items.length) return
    const updated = [...items]
    ;[updated[index], updated[swap]] = [updated[swap], updated[index]]
    setItems(updated)
  }
  return (
    <div className="admin-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button onClick={add} className="btn-admin btn-admin-secondary text-xs"><Plus className="w-3.5 h-3.5" /> {addLabel}</button>
      </div>
      {items.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">#{i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(i, 'up')} disabled={i === 0} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors" title="Move up"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => move(i, 'down')} disabled={i === items.length - 1} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors" title="Move down"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => remove(i)} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {renderRow(item, i, (field, value) => update(i, field, value))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { getOptions } = useFieldOptions()
  const { id } = React.use(params)
  const isNew = id === 'new'
  const [form, setForm] = useState({
    name: '', slug: '', status: 'ongoing', publishStatus: 'published',
    tagline: '', summary: '', description: '', heroImage: '', cardImage: '',
    locationArea: '', address: '', lat: 0, lng: 0, mapEmbedUrl: '',
    totalPlots: 0, availablePlots: 0, plotSizes: '', featured: false, sortOrder: 0,
    logo: '', mapImage: '', mapsQuery: '', priceRange: '', priceStart: '',
  })
  const [cardHighlights, setCardHighlights] = useState<string[]>([])
  const [highlights, setHighlights] = useState<{ id?: string; title: string; detail: string; icon: string; sortOrder: number }[]>([])
  const [specs, setSpecs] = useState<SpecRow[]>([])
  const [stages, setStages] = useState<StageRow[]>([])
  const [amenities, setAmenities] = useState<AmenityRow[]>([])
  const [distances, setDistances] = useState<DistanceRow[]>([])
  const [landmarks, setLandmarks] = useState<LandmarkRow[]>([])
  const [faqs, setFaqs] = useState<FaqRow[]>([])
  const [images, setImages] = useState<ImageRow[]>([])
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/projects/${id}`).then(r => r.json()).then(d => {
        if (d.error) { router.push('/admin/projects'); return }
        setForm({
          name: d.name || '', slug: d.slug || '', status: d.status || 'ongoing', publishStatus: d.publishStatus || 'published',
          tagline: d.tagline || '', summary: d.summary || '', description: d.description || '',
          heroImage: d.heroImage || '', cardImage: d.cardImage || '',
          locationArea: d.locationArea || '', address: d.address || '',
          lat: d.lat || 0, lng: d.lng || 0, mapEmbedUrl: d.mapEmbedUrl || '',
          totalPlots: d.totalPlots || 0, availablePlots: d.availablePlots || 0,
          plotSizes: d.plotSizes || '', featured: d.featured || false, sortOrder: d.sortOrder || 0,
          logo: d.logo || '', mapImage: d.mapImage || '', mapsQuery: d.mapsQuery || '',
          priceRange: d.priceRange || '', priceStart: d.priceStart || '',
        })
        try {
          const ch = d.cardHighlights ? JSON.parse(d.cardHighlights) : []
          if (Array.isArray(ch)) setCardHighlights(ch.map((s: unknown) => String(s ?? '')))
        } catch { setCardHighlights([]) }
        if (d.highlights) setHighlights(d.highlights.map((h: { id: string; title: string; detail: string | null; icon: string | null; sortOrder: number }) => ({ id: h.id, title: h.title, detail: h.detail || '', icon: h.icon || '', sortOrder: h.sortOrder })))
        if (d.specs) setSpecs(d.specs.map((s: SpecRow) => ({ label: s.label || '', value: s.value || '' })))
        if (d.stages) setStages(d.stages.map((s: StageRow) => ({ label: s.label || '', stage: s.stage || 'Planned' })))
        if (d.amenities) setAmenities(d.amenities.map((a: { icon: string | null; label: string }) => ({ icon: a.icon || '', label: a.label || '' })))
        if (d.distances) setDistances(d.distances.map((x: DistanceRow) => ({ place: x.place || '', value: x.value || '' })))
        if (d.landmarks) setLandmarks(d.landmarks.map((l: { icon: string | null; name: string; minutes: number; angle: number; ring: number }) => ({ icon: l.icon || '', name: l.name || '', minutes: l.minutes ?? 0, angle: l.angle ?? 0, ring: l.ring ?? 1 })))
        if (d.faqs) setFaqs(d.faqs.map((f: FaqRow) => ({ question: f.question || '', answer: f.answer || '' })))
        if (d.images) setImages(d.images.map((im: { url: string; caption: string | null }) => ({ url: im.url || '', caption: im.caption || '' })))
        if (d.documents) setDocuments(d.documents.map((doc: { docType: string; label: string; fileUrl: string | null; version: number; viewable: boolean; gated: boolean; enabled: boolean; downloads: number }) => ({
          docType: doc.docType || 'brochure', label: doc.label || '', fileUrl: doc.fileUrl || '',
          version: doc.version ?? 1, viewable: doc.viewable ?? true, gated: doc.gated ?? false,
          enabled: doc.enabled ?? true, downloads: doc.downloads ?? 0,
        })))
      }).catch(() => {})
    }
  }, [id, isNew, router])

  const save = async () => {
    if (!form.name) { toast.error('Name required'); return }
    setLoading(true)
    try {
      const body = {
        ...form,
        cardHighlights: cardHighlights.map(s => s.trim()).filter(Boolean),
        highlights, specs, stages, amenities, distances, landmarks, faqs, images, documents,
      }
      const res = await fetch(isNew ? '/api/admin/projects' : `/api/admin/projects/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? body : { id, ...body }),
      })
      const data = await res.json()
      if (data.success) { toast.success('Saved'); if (isNew) router.push('/admin/projects') }
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Save failed') }
    setLoading(false)
  }

  const deleteProject = async () => {
    try {
      await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
      toast.success('Deleted'); router.push('/admin/projects')
    } catch { toast.error('Delete failed') }
  }

  const update = (key: string, value: unknown) => setForm({ ...form, [key]: value })

  // ─── Card highlights (simple string list) ───
  const addCardHighlight = () => setCardHighlights([...cardHighlights, ''])
  const updateCardHighlight = (i: number, v: string) => { const u = [...cardHighlights]; u[i] = v; setCardHighlights(u) }
  const removeCardHighlight = (i: number) => setCardHighlights(cardHighlights.filter((_, idx) => idx !== i))

  // ─── Highlights (kept with drag reorder, now with detail) ───
  const addHighlight = () => setHighlights([...highlights, { title: '', detail: '', icon: '', sortOrder: highlights.length }])
  const updateHighlight = (index: number, field: string, value: string | number) => {
    const updated = [...highlights]
    updated[index] = { ...updated[index], [field]: value }
    setHighlights(updated)
  }
  const removeHighlight = (index: number) => setHighlights(highlights.filter((_, i) => i !== index).map((h, i) => ({ ...h, sortOrder: i })))
  const moveHighlight = (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= highlights.length) return
    const updated = [...highlights]
    ;[updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]]
    setHighlights(updated.map((h, i) => ({ ...h, sortOrder: i })))
  }
  const handleDragReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    setHighlights(arrayMove(highlights, fromIdx, toIdx).map((h, i) => ({ ...h, sortOrder: i })))
  }
  const dnd = useDragReorder(handleDragReorder)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/projects')} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">{isNew ? 'Add Project' : 'Edit Project'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={() => setShowDelete(true)} className="btn-admin btn-admin-danger text-sm"><Trash2 className="w-4 h-4" /> Delete</button>
          )}
          <button onClick={save} disabled={loading} className="btn-admin btn-admin-primary text-sm"><Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs text-slate-400 mb-1.5">Name *</label><input className={inputCls} value={form.name} onChange={(e) => update('name', e.target.value)} /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Slug *</label><input className={inputCls} value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="e.g. chandra-chaya" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Status</label>
            <select className="admin-select" value={form.status} onChange={(e) => update('status', e.target.value)}>
              {getOptions('project_statuses').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Publish Status</label>
            <select className="admin-select" value={form.publishStatus} onChange={(e) => update('publishStatus', e.target.value)}>
              {getOptions('project_publish_statuses').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="block text-xs text-slate-400 mb-1.5">Tagline</label><input className={inputCls} value={form.tagline} onChange={(e) => update('tagline', e.target.value)} placeholder="Short tagline" /></div>
          <div className="sm:col-span-2"><label className="block text-xs text-slate-400 mb-1.5">Summary</label><RichTextEditor value={form.summary} onChange={(html) => update('summary', html)} minHeight="160px" /></div>
        </div>
      </div>

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          Full Description
          <span className="text-[10px] text-slate-500 font-normal">Rich Text Editor</span>
        </h3>
        <RichTextEditor
          value={form.description}
          onChange={(html) => update('description', html)}
          placeholder="Project full description with rich formatting..."
          minHeight="250px"
        />
      </div>

      {/* Pricing & Branding — new scalar fields */}
      <div className="admin-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Pricing &amp; Branding</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs text-slate-400 mb-1.5">Price Range</label><input className={inputCls} value={form.priceRange} onChange={(e) => update('priceRange', e.target.value)} placeholder="৳50L – ৳2Cr" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Starting Price</label><input className={inputCls} value={form.priceStart} onChange={(e) => update('priceStart', e.target.value)} placeholder="৳50 Lakh" /></div>
          <div className="sm:col-span-2"><label className="block text-xs text-slate-400 mb-1.5">Project Logo</label><MediaUploadInput value={form.logo} onChange={(url) => update('logo', url)} className={inputCls} hint="Recommended 400×160 px, transparent PNG (SVG best). Shown ~36 px tall on cards." /></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-slate-400">Card Highlights <span className="text-slate-600">(short labels shown on cards)</span></label>
            <button onClick={addCardHighlight} className="btn-admin btn-admin-secondary text-xs"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>
          {cardHighlights.length === 0 ? (
            <p className="text-slate-500 text-xs py-2">No card highlights yet.</p>
          ) : (
            <div className="space-y-2">
              {cardHighlights.map((ch, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={inputCls} value={ch} onChange={(e) => updateCardHighlight(i, e.target.value)} placeholder="e.g. RAJUK Approved" />
                  <button onClick={() => removeCardHighlight(i)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Remove"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Highlights — kept with drag reorder, now with detail */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Project Highlights</h3>
          <button onClick={addHighlight} className="btn-admin btn-admin-secondary text-xs">+ Add Highlight</button>
        </div>
        {highlights.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No highlights added yet. Click &quot;Add Highlight&quot; to add feature highlights with icons.</p>
        ) : (
          <div className="space-y-3">
            {highlights.map((h, i) => {
              const edge = dnd.dropEdge(i)
              return (
              <div
                key={i}
                {...dnd.itemProps(i)}
                className={`bg-slate-800/50 rounded-lg p-4 space-y-3 ${dnd.isDragging(i) ? 'opacity-40' : ''} ${
                  edge === 'above'
                    ? 'border-t-2 border-t-[#A98B4F]'
                    : edge === 'below'
                      ? 'border-b-2 border-b-[#A98B4F]'
                      : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      {...dnd.handleProps}
                      className="p-0.5 rounded text-slate-500 cursor-grab active:cursor-grabbing hover:text-white hover:bg-slate-700 transition-colors"
                      title="Drag to reorder"
                      aria-hidden="true"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <span className="text-xs text-slate-500">Highlight #{i + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveHighlight(i, 'up')} disabled={i === 0} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors" title="Move up"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveHighlight(i, 'down')} disabled={i === highlights.length - 1} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors" title="Move down"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeHighlight(i)} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Icon</label>
                    <IconPicker value={h.icon} onChange={(icon) => updateHighlight(i, 'icon', icon)} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Title *</label>
                    <input className={inputCls} value={h.title} onChange={(e) => updateHighlight(i, 'title', e.target.value)} placeholder="e.g. RAJUK Approved" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Detail</label>
                  <RichTextEditor value={h.detail} onChange={(html) => updateHighlight(i, 'detail', html)} placeholder="Longer supporting description" minHeight="160px" />
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Specifications */}
      <Repeater<SpecRow>
        title="Specifications" addLabel="Add Spec" items={specs} setItems={setSpecs}
        blank={() => ({ label: '', value: '' })}
        emptyText="No specifications yet."
        renderRow={(item, i, upd) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-400 mb-1.5">Label</label><input className={inputCls} value={item.label} onChange={(e) => upd('label', e.target.value)} placeholder="e.g. Total Area" /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Value</label><input className={inputCls} value={item.value} onChange={(e) => upd('value', e.target.value)} placeholder="e.g. 25 Bigha" /></div>
          </div>
        )}
      />

      {/* Development Stages */}
      <Repeater<StageRow>
        title="Development Stages" addLabel="Add Stage" items={stages} setItems={setStages}
        blank={() => ({ label: '', stage: 'Planned' })}
        emptyText="No stages yet."
        renderRow={(item, i, upd) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-400 mb-1.5">Label</label><input className={inputCls} value={item.label} onChange={(e) => upd('label', e.target.value)} placeholder="e.g. Land Development" /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Stage</label>
              <select className="admin-select" value={item.stage} onChange={(e) => upd('stage', e.target.value)}>
                <option value="Complete">Complete</option>
                <option value="Underway">Underway</option>
                <option value="Planned">Planned</option>
              </select>
            </div>
          </div>
        )}
      />

      {/* Amenities */}
      <Repeater<AmenityRow>
        title="Amenities" addLabel="Add Amenity" items={amenities} setItems={setAmenities}
        blank={() => ({ icon: '', label: '' })}
        emptyText="No amenities yet."
        renderRow={(item, i, upd) => (
          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4">
            <div><label className="block text-xs text-slate-400 mb-1.5">Icon</label><IconPicker value={item.icon} onChange={(icon) => upd('icon', icon)} /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Label</label><input className={inputCls} value={item.label} onChange={(e) => upd('label', e.target.value)} placeholder="e.g. 24/7 Security" /></div>
          </div>
        )}
      />

      {/* Distances */}
      <Repeater<DistanceRow>
        title="Distances" addLabel="Add Distance" items={distances} setItems={setDistances}
        blank={() => ({ place: '', value: '' })}
        emptyText="No distances yet."
        renderRow={(item, i, upd) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-400 mb-1.5">Place</label><input className={inputCls} value={item.place} onChange={(e) => upd('place', e.target.value)} placeholder="e.g. Airport" /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Value</label><input className={inputCls} value={item.value} onChange={(e) => upd('value', e.target.value)} placeholder="e.g. 15 min" /></div>
          </div>
        )}
      />

      {/* Landmarks (radar) */}
      <Repeater<LandmarkRow>
        title="Landmarks (Radar)" addLabel="Add Landmark" items={landmarks} setItems={setLandmarks}
        blank={() => ({ icon: '', name: '', minutes: 0, angle: 0, ring: 1 })}
        emptyText="No landmarks yet."
        renderRow={(item, i, upd) => (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4">
              <div><label className="block text-xs text-slate-400 mb-1.5">Icon</label><IconPicker value={item.icon} onChange={(icon) => upd('icon', icon)} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Name</label><input className={inputCls} value={item.name} onChange={(e) => upd('name', e.target.value)} placeholder="e.g. 300ft Highway" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs text-slate-400 mb-1.5">Minutes</label><input className={inputCls} type="number" value={item.minutes} onChange={(e) => upd('minutes', parseInt(e.target.value) || 0)} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Angle (°)</label><input className={inputCls} type="number" value={item.angle} onChange={(e) => upd('angle', parseInt(e.target.value) || 0)} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Ring (0–2)</label><input className={inputCls} type="number" value={item.ring} onChange={(e) => upd('ring', parseInt(e.target.value) || 0)} /></div>
            </div>
          </div>
        )}
      />

      {/* FAQs */}
      <Repeater<FaqRow>
        title="FAQs" addLabel="Add FAQ" items={faqs} setItems={setFaqs}
        blank={() => ({ question: '', answer: '' })}
        emptyText="No FAQs yet."
        renderRow={(item, i, upd) => (
          <div className="space-y-3">
            <div><label className="block text-xs text-slate-400 mb-1.5">Question</label><input className={inputCls} value={item.question} onChange={(e) => upd('question', e.target.value)} placeholder="e.g. Is the land RAJUK approved?" /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Answer</label><RichTextEditor value={item.answer} onChange={(html) => upd('answer', html)} minHeight="160px" /></div>
          </div>
        )}
      />

      {/* Gallery Images */}
      <Repeater<ImageRow>
        title="Gallery Images" addLabel="Add Image" items={images} setItems={setImages}
        blank={() => ({ url: '', caption: '' })}
        emptyText="No gallery images yet."
        renderRow={(item, i, upd) => (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
            <div className="space-y-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">Image URL</label><MediaUploadInput value={item.url} onChange={(url) => upd('url', url)} className={inputCls} hint="Recommended 1600×1200 px (4:3) or long edge 1600 px. JPG or WebP, under 500 KB." /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Caption</label><input className={inputCls} value={item.caption} onChange={(e) => upd('caption', e.target.value)} placeholder="Optional caption" /></div>
            </div>
            {item.url && <div className="rounded-lg overflow-hidden bg-slate-800 h-24"><img src={item.url} alt="" className="w-full h-full object-cover" /></div>}
          </div>
        )}
      />

      {/* Documents */}
      <Repeater<DocumentRow>
        title="Documents" addLabel="Add Document" items={documents} setItems={setDocuments}
        blank={() => ({ docType: 'brochure', label: '', fileUrl: '', version: 1, viewable: true, gated: false, enabled: true, downloads: 0 })}
        emptyText="No documents yet."
        renderRow={(item, i, upd) => (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs text-slate-400 mb-1.5">Doc Type</label><input className={inputCls} value={item.docType} onChange={(e) => upd('docType', e.target.value)} placeholder="brochure / layout / legal" /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Label</label><input className={inputCls} value={item.label} onChange={(e) => upd('label', e.target.value)} placeholder="e.g. Master Plan" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-4">
              <div><label className="block text-xs text-slate-400 mb-1.5">File URL</label><MediaUploadInput value={item.fileUrl} onChange={(url) => upd('fileUrl', url)} className={inputCls} hint="Floor / layout plan. PDF or image, min 1600 px wide. Under 5 MB." /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Version</label><input className={inputCls} type="number" value={item.version} onChange={(e) => upd('version', parseInt(e.target.value) || 1)} /></div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={item.viewable} onChange={(e) => upd('viewable', e.target.checked)} className="w-4 h-4 rounded" /> Viewable</label>
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={item.gated} onChange={(e) => upd('gated', e.target.checked)} className="w-4 h-4 rounded" /> Gated</label>
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={item.enabled} onChange={(e) => upd('enabled', e.target.checked)} className="w-4 h-4 rounded" /> Enabled</label>
            </div>
          </div>
        )}
      />

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Media</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs text-slate-400 mb-1.5">Hero Image URL</label><MediaUploadInput value={form.heroImage} onChange={(url) => update('heroImage', url)} className={inputCls} hint="Recommended 1920×1080 px (16:9), landscape full-width banner. WebP or JPG, under 600 KB." /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Card Image URL</label><MediaUploadInput value={form.cardImage} onChange={(url) => update('cardImage', url)} className={inputCls} hint="Recommended 1200×1500 px (4:5 portrait). Shown on project listing cards. JPG or WebP, under 500 KB." /></div>
        </div>
        {form.cardImage && (
          <div className="grid grid-cols-2 gap-4">
            {form.heroImage && <div className="rounded-lg overflow-hidden bg-slate-800 h-32"><img src={form.heroImage} alt="" className="w-full h-full object-cover" /></div>}
            <div className="rounded-lg overflow-hidden bg-slate-800 h-32"><img src={form.cardImage} alt="" className="w-full h-full object-cover" /></div>
          </div>
        )}
      </div>

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs text-slate-400 mb-1.5">Area</label><input className={inputCls} value={form.locationArea} onChange={(e) => update('locationArea', e.target.value)} placeholder="Purbachal" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Full Address</label><input className={inputCls} value={form.address} onChange={(e) => update('address', e.target.value)} /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Latitude</label><input className={inputCls} type="number" step="any" value={form.lat} onChange={(e) => update('lat', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Longitude</label><input className={inputCls} type="number" step="any" value={form.lng} onChange={(e) => update('lng', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Google Maps Query</label><input className={inputCls} value={form.mapsQuery} onChange={(e) => update('mapsQuery', e.target.value)} placeholder="e.g. Purbachal New Town" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Map Image URL</label><MediaUploadInput value={form.mapImage} onChange={(url) => update('mapImage', url)} className={inputCls} hint="Recommended 1600×1000 px (16:10). Location / master-plan map. JPG or PNG." /></div>
          <div className="sm:col-span-2"><label className="block text-xs text-slate-400 mb-1.5">Map Embed URL</label><input className={inputCls} value={form.mapEmbedUrl} onChange={(e) => update('mapEmbedUrl', e.target.value)} /></div>
        </div>
      </div>

      <div className="admin-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Plot Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs text-slate-400 mb-1.5">Total Plots</label><input className={inputCls} type="number" value={form.totalPlots} onChange={(e) => update('totalPlots', parseInt(e.target.value) || 0)} /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Available Plots</label><input className={inputCls} type="number" value={form.availablePlots} onChange={(e) => update('availablePlots', parseInt(e.target.value) || 0)} /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Plot Sizes</label><input className={inputCls} value={form.plotSizes} onChange={(e) => update('plotSizes', e.target.value)} placeholder="3, 5 & 10 Katha" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Sort Order</label><input className={inputCls} type="number" value={form.sortOrder} onChange={(e) => update('sortOrder', parseInt(e.target.value) || 0)} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} className="w-4 h-4 rounded" />
            <label className="text-sm text-slate-300">Featured Project</label>
          </div>
        </div>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Delete Project</DialogTitle></DialogHeader>
          <p className="text-slate-400 text-sm">This will delete the project and all related data. This cannot be undone.</p>
          <DialogFooter>
            <button onClick={() => setShowDelete(false)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button onClick={deleteProject} className="btn-admin btn-admin-danger text-sm">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
