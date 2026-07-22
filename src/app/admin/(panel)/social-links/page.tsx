'use client'

import { useState, useEffect, useCallback } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Share2, Plus, Pencil, Trash2, Power, PowerOff, Loader2, ExternalLink, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import IconPicker from '@/components/IconPicker'

interface SocialLink {
  id: string
  platform: string
  url: string
  icon: string
  label: string | null
  enabled: boolean
  sortOrder: number
}

interface FormState {
  platform: string
  url: string
  icon: string
  label: string
  enabled: boolean
  sortOrder: number
}

const EMPTY_FORM: FormState = { platform: '', url: '', icon: 'Globe', label: '', enabled: true, sortOrder: 0 }

/** Render a Lucide icon by its string name, falling back to Globe. */
function DynIcon({ name, className }: { name: string; className?: string }) {
  const Ico = (LucideIcons as unknown as Record<string, LucideIcon>)[name] || LucideIcons.Globe
  return <Ico className={className || 'w-4 h-4'} />
}

export default function SocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/social-links')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLinks(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load social links')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, sortOrder: links.length })
    setShowForm(true)
  }

  const openEdit = (link: SocialLink) => {
    setEditId(link.id)
    setForm({
      platform: link.platform,
      url: link.url,
      icon: link.icon || 'Globe',
      label: link.label || '',
      enabled: link.enabled,
      sortOrder: link.sortOrder,
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.platform.trim() || !form.url.trim()) {
      toast.error('Platform and URL are required')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        platform: form.platform.trim(),
        url: form.url.trim(),
        icon: form.icon || 'Globe',
        label: form.label.trim() || null,
        enabled: form.enabled,
        sortOrder: Number(form.sortOrder) || 0,
      }
      const res = await fetch(editId ? `/api/admin/social-links/${editId}` : '/api/admin/social-links', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editId ? 'Updated successfully' : 'Created successfully')
        setShowForm(false)
        fetchLinks()
      } else {
        toast.error(data.error || 'Save failed')
      }
    } catch {
      toast.error('Save failed')
    }
    setSubmitting(false)
  }

  const handleToggle = async (link: SocialLink) => {
    const snapshot = links
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, enabled: !l.enabled } : l)))
    try {
      const res = await fetch(`/api/admin/social-links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !link.enabled }),
      })
      const data = await res.json()
      if (!data.success) throw new Error()
      toast.success(link.enabled ? 'Disabled' : 'Enabled')
    } catch {
      setLinks(snapshot)
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/social-links/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Deleted successfully')
        setLinks((prev) => prev.filter((l) => l.id !== deleteId))
      } else {
        toast.error(data.error || 'Delete failed')
      }
    } catch {
      toast.error('Delete failed')
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const sorted = [...links].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Social Links</h1>
          <span className="bg-slate-800 text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">{links.length}</span>
        </div>
        <button onClick={openAdd} className="btn-admin btn-admin-primary text-sm">
          <Plus className="w-4 h-4" /> Add Social Link
        </button>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left w-12">Icon</th>
                <th className="p-3 text-left">Platform</th>
                <th className="p-3 text-left hidden md:table-cell">URL</th>
                <th className="p-3 text-left hidden lg:table-cell">Label</th>
                <th className="p-3 text-center w-16">Order</th>
                <th className="p-3 text-center w-16">Active</th>
                <th className="p-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 rounded bg-slate-700/50 animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
                        <Inbox className="w-6 h-6 text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">No social links yet</p>
                      <p className="text-slate-600 text-xs mt-1.5">Add your first social media link to show it in the header and footer.</p>
                      <button onClick={openAdd} className="btn-admin btn-admin-primary text-xs mt-4">
                        <Plus className="w-3.5 h-3.5" /> Add Social Link
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-800 border border-slate-700 text-[#34D399]">
                        <DynIcon name={link.icon} className="w-4 h-4" />
                      </span>
                    </td>
                    <td className="p-3 text-white font-medium">{link.platform}</td>
                    <td className="p-3 hidden md:table-cell">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-[#34D399] inline-flex items-center gap-1 max-w-[280px] truncate"
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-slate-400">{link.label || <span className="text-slate-600">—</span>}</td>
                    <td className="p-3 text-center text-slate-400 tabular-nums">{link.sortOrder}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggle(link)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          link.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                        }`}
                        title={link.enabled ? 'Disable' : 'Enable'}
                      >
                        {link.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(link)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#34D399] hover:bg-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(link.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editId ? 'Edit' : 'Add'} Social Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Platform *</label>
              <input
                className="admin-input"
                placeholder="Facebook"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">URL *</label>
              <input
                className="admin-input"
                placeholder="https://facebook.com/..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Icon</label>
              <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Label (optional)</label>
              <input
                className="admin-input"
                placeholder="Follow us on Facebook"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Sort Order</label>
                <input
                  className="admin-input"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value === '' ? 0 : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                <label className="flex items-center gap-2 cursor-pointer mt-2.5">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 accent-[#1E6B3A]"
                  />
                  <span className="text-sm text-slate-300">{form.enabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowForm(false)} className="btn-admin btn-admin-secondary text-sm">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-admin btn-admin-primary text-sm">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : editId ? (
                'Update'
              ) : (
                'Create'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Social Link</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm">Are you sure? This cannot be undone.</p>
          <DialogFooter>
            <button onClick={() => setDeleteId(null)} className="btn-admin btn-admin-secondary text-sm">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-admin btn-admin-danger text-sm">
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> ...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
