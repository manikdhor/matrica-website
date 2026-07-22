'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ListTree, Plus, Edit2, Trash2, ChevronUp, ChevronDown,
  Loader2, Power, PowerOff, ExternalLink, PanelTop, PanelBottom,
  DownloadCloud, GripVertical, Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDragReorder, arrayMove } from '@/hooks/useDragReorder'
import IconPicker from '@/components/IconPicker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ─── Types ─────────────────────────────────────────────────────────
interface MenuItem {
  id: string
  label: string
  href: string
  icon: string | null
  location: string
  target: string
  enabled: boolean
  sortOrder: number
}

type Location = 'header' | 'footer' | 'mobile'

const LOCATIONS: Location[] = ['header', 'footer', 'mobile']

const LOCATION_LABELS: Record<Location, string> = {
  header: 'Header',
  footer: 'Footer',
  mobile: 'Mobile',
}

// ─── Dialog form state ─────────────────────────────────────────────
interface FormState {
  label: string
  href: string
  icon: string
  newTab: boolean
  enabled: boolean
}

const emptyForm: FormState = {
  label: '',
  href: '',
  icon: '',
  newTab: false,
  enabled: true,
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Location>('header')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch items
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/menu')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const tabItems = items
    .filter(i => i.location === tab)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // ─── CRUD handlers ─────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: MenuItem) => {
    setEditingId(item.id)
    setForm({
      label: item.label,
      href: item.href,
      icon: item.icon || '',
      newTab: item.target === '_blank',
      enabled: item.enabled,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.label.trim()) { toast.error('Label is required'); return }
    if (!form.href.trim()) { toast.error('Link URL is required'); return }

    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const payload = {
        label: form.label.trim(),
        href: form.href.trim(),
        icon: form.icon.trim(),
        target: form.newTab ? '_blank' : '_self',
        enabled: form.enabled,
      }
      const body = editingId
        ? { id: editingId, ...payload }
        : {
            ...payload,
            location: tab,
            sortOrder: tabItems.length > 0 ? Math.max(...tabItems.map(i => i.sortOrder)) + 1 : 0,
          }
      const res = await fetch('/api/admin/menu', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingId ? 'Menu item updated' : 'Menu item added')
        setDialogOpen(false)
        fetchItems()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch {
      toast.error('Request failed')
    }
    setSaving(false)
  }

  const handleToggle = async (item: MenuItem) => {
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, enabled: !item.enabled }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(item.enabled ? 'Item hidden from site' : 'Item visible on site')
        fetchItems()
      } else {
        toast.error(data.error || 'Failed to toggle')
      }
    } catch {
      toast.error('Failed to toggle')
    }
  }

  const handleReorder = async (item: MenuItem, direction: 'up' | 'down') => {
    const idx = tabItems.findIndex(i => i.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= tabItems.length) return

    const a = tabItems[idx]
    const b = tabItems[swapIdx]

    try {
      await Promise.all([
        fetch('/api/admin/menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: a.id, sortOrder: b.sortOrder }),
        }),
        fetch('/api/admin/menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: b.id, sortOrder: a.sortOrder }),
        }),
      ])
      fetchItems()
    } catch {
      toast.error('Failed to reorder')
    }
  }

  // Drag-and-drop reorder within the active tab: reassign sequential
  // sortOrder 0..n across the tab's items and persist every changed row.
  const handleDragReorder = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    const reordered = arrayMove(tabItems, fromIdx, toIdx)
    const changed = reordered
      .map((it, i) => ({ id: it.id, sortOrder: i, prev: it.sortOrder }))
      .filter((c) => c.prev !== c.sortOrder)
    if (changed.length === 0) return

    const orderMap = new Map(reordered.map((it, i) => [it.id, i]))
    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (orderMap.has(it.id) ? { ...it, sortOrder: orderMap.get(it.id)! } : it))
    )
    try {
      const responses = await Promise.all(
        changed.map((c) =>
          fetch('/api/admin/menu', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: c.id, sortOrder: c.sortOrder }),
          })
        )
      )
      const results = await Promise.all(responses.map((r) => r.json()))
      if (!results.every((d) => d.success)) throw new Error('Reorder failed')
    } catch {
      // Some PUTs may have succeeded — refetch so the UI matches the server
      // instead of restoring a snapshot that may now be stale.
      await fetchItems()
      toast.error('Failed to reorder')
    }
  }

  const dnd = useDragReorder(handleDragReorder)

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/admin/menu?id=${encodeURIComponent(deletingId)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Menu item deleted')
        setDeletingId(null)
        fetchItems()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedDefaults: true }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Loaded ${data.seeded} default menu items`)
        fetchItems()
      } else {
        toast.error(data.error || 'Failed to load defaults')
      }
    } catch {
      toast.error('Request failed')
    }
    setSeeding(false)
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E6B3A]/15 border border-[#1E6B3A]/20 flex items-center justify-center">
            <ListTree className="w-5 h-5 text-[#34D399]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Menu</h1>
            <p className="text-sm text-slate-400">Manage the site&apos;s header and footer navigation links</p>
          </div>
        </div>
        <button onClick={openAddDialog} className="btn-admin btn-admin-primary text-sm">
          <Plus className="w-4 h-4" /> Add Menu Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setTab(loc)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all ${
              tab === loc
                ? 'bg-[#1E6B3A]/20 border-[#34D399]/30 text-[#34D399]'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {loc === 'header' ? <PanelTop className="w-4 h-4" /> : loc === 'footer' ? <PanelBottom className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            {LOCATION_LABELS[loc]}
            <span className="text-[10px] font-mono opacity-70">
              {items.filter(i => i.location === loc).length}
            </span>
          </button>
        ))}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#34D399] animate-spin" />
        </div>
      ) : tabItems.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <ListTree className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            No {tab} menu items yet
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {items.length === 0
              ? 'The site is currently using the built-in default menu. Load the defaults to start customizing.'
              : `Add your first ${tab} menu item.`}
          </p>
          <div className="flex items-center justify-center gap-2">
            {items.length === 0 && (
              <button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="btn-admin btn-admin-secondary text-sm"
              >
                {seeding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                  <><DownloadCloud className="w-4 h-4" /> Load defaults</>
                )}
              </button>
            )}
            <button onClick={openAddDialog} className="btn-admin btn-admin-primary text-sm">
              <Plus className="w-4 h-4" /> Add Menu Item
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-card divide-y divide-slate-800/60">
          {tabItems.map((item, idx) => {
            const edge = dnd.dropEdge(idx)
            return (
            <div
              key={item.id}
              {...dnd.itemProps(idx)}
              className={`flex items-center gap-3 p-4 transition-all ${
                item.enabled ? '' : 'opacity-60'
              } ${dnd.isDragging(idx) ? 'opacity-40' : ''} ${
                edge === 'above'
                  ? 'border-t-2 border-t-[#A98B4F]'
                  : edge === 'below'
                    ? 'border-b-2 border-b-[#A98B4F]'
                    : ''
              }`}
            >
              {/* Drag handle */}
              <span
                {...dnd.handleProps}
                className="p-1 rounded-lg text-slate-500 cursor-grab active:cursor-grabbing hover:text-white hover:bg-slate-800 transition-colors"
                title="Drag to reorder"
                aria-hidden="true"
              >
                <GripVertical className="w-4 h-4" />
              </span>

              {/* Reorder */}
              <div className="flex flex-col">
                <button
                  onClick={() => handleReorder(item, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReorder(item, 'down')}
                  disabled={idx === tabItems.length - 1}
                  className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">{item.label}</h3>
                  {item.target === '_blank' && (
                    <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" aria-label="Opens in new tab" />
                  )}
                  {item.enabled ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      Visible
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-500 border border-slate-700/50">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{item.href}</p>
              </div>

              {/* Sort order badge */}
              <span className="text-[10px] text-slate-600 font-mono shrink-0">#{item.sortOrder}</span>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(item)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.enabled
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                  title={item.enabled ? 'Disable' : 'Enable'}
                >
                  {item.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEditDialog(item)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingId(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* ─── Add / Edit Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[480px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-white text-lg">
              {editingId ? 'Edit Menu Item' : `Add ${LOCATION_LABELS[tab]} Menu Item`}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-4 space-y-4">
            {/* Label */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Label <span className="text-red-400">*</span></label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Projects"
                value={form.label}
                onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>

            {/* Href */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Link URL <span className="text-red-400">*</span></label>
              <input
                type="text"
                className="admin-input"
                placeholder="/projects or https://example.com"
                value={form.href}
                onChange={(e) => setForm(f => ({ ...f, href: e.target.value }))}
              />
            </div>

            {/* Icon */}
            <div>
              <IconPicker
                value={form.icon}
                onChange={(name) => setForm(f => ({ ...f, icon: name }))}
                label="Icon (shown on mobile menu)"
              />
            </div>

            {/* Open in new tab + Enabled */}
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.newTab}
                  onChange={(e) => setForm(f => ({ ...f, newTab: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-[#1E6B3A]"
                />
                <span className="text-xs text-slate-300">Open in new tab</span>
              </label>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled ? 'bg-[#1E6B3A]' : 'bg-slate-600'}`}
                  aria-label={form.enabled ? 'Disable' : 'Enable'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs text-slate-300">Visible on site</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="btn-admin btn-admin-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-admin btn-admin-primary text-sm"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : editingId ? (
                  'Update Item'
                ) : (
                  'Add Item'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────────────── */}
      <Dialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-white text-lg">Delete Menu Item</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <p className="text-sm text-slate-300 mb-6">
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="btn-admin btn-admin-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-admin btn-admin-danger text-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
