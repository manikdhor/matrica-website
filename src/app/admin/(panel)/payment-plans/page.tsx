'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Plus, Edit2, Trash2, Loader2, Power, PowerOff,
  Star, X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ─── Types ─────────────────────────────────────────────────────────
interface PaymentPlan {
  id: string
  name: string
  startingPrice: string | null
  size: string | null
  features: string | null // JSON string array
  badge: string | null
  popular: boolean
  enabled: boolean
  sortOrder: number
}

// ─── Dialog form state ─────────────────────────────────────────────
interface FormState {
  name: string
  startingPrice: string
  size: string
  badge: string
  popular: boolean
  enabled: boolean
  sortOrder: number
  features: string[]
}

const emptyForm: FormState = {
  name: '',
  startingPrice: '',
  size: '',
  badge: '',
  popular: false,
  enabled: true,
  sortOrder: 0,
  features: [],
}

function parseFeatures(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((f) => String(f)) : []
  } catch {
    return []
  }
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function PaymentPlansPage() {
  const [plans, setPlans] = useState<PaymentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [featureInput, setFeatureInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payment-plans')
      const data = await res.json()
      setPlans(data.plans || [])
    } catch {
      toast.error('Failed to load payment plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const sortedPlans = [...plans].sort((a, b) => a.sortOrder - b.sortOrder)

  // ─── CRUD handlers ─────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingId(null)
    setForm({ ...emptyForm, sortOrder: plans.length > 0 ? Math.max(...plans.map(p => p.sortOrder)) + 1 : 0 })
    setFeatureInput('')
    setDialogOpen(true)
  }

  const openEditDialog = (plan: PaymentPlan) => {
    setEditingId(plan.id)
    setForm({
      name: plan.name,
      startingPrice: plan.startingPrice || '',
      size: plan.size || '',
      badge: plan.badge || '',
      popular: plan.popular,
      enabled: plan.enabled,
      sortOrder: plan.sortOrder,
      features: parseFeatures(plan.features),
    })
    setFeatureInput('')
    setDialogOpen(true)
  }

  const addFeature = () => {
    const val = featureInput.trim()
    if (!val) return
    setForm(f => ({ ...f, features: [...f.features, val] }))
    setFeatureInput('')
  }

  const removeFeature = (idx: number) => {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        startingPrice: form.startingPrice.trim(),
        size: form.size.trim(),
        badge: form.badge.trim(),
        popular: form.popular,
        enabled: form.enabled,
        sortOrder: form.sortOrder,
        features: form.features,
      }
      const res = await fetch(
        editingId ? `/api/admin/payment-plans/${editingId}` : '/api/admin/payment-plans',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json()
      if (data.success) {
        toast.success(editingId ? 'Plan updated' : 'Plan added')
        setDialogOpen(false)
        fetchPlans()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch {
      toast.error('Request failed')
    }
    setSaving(false)
  }

  const handleToggle = async (plan: PaymentPlan) => {
    try {
      const res = await fetch(`/api/admin/payment-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !plan.enabled }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(plan.enabled ? 'Plan hidden from site' : 'Plan visible on site')
        fetchPlans()
      } else {
        toast.error(data.error || 'Failed to toggle')
      }
    } catch {
      toast.error('Failed to toggle')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/admin/payment-plans/${deletingId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Plan deleted')
        setDeletingId(null)
        fetchPlans()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E6B3A]/15 border border-[#1E6B3A]/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#34D399]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Plans</h1>
            <p className="text-sm text-slate-400">Manage pricing plans shown across the site</p>
          </div>
        </div>
        <button onClick={openAddDialog} className="btn-admin btn-admin-primary text-sm">
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#34D399] animate-spin" />
        </div>
      ) : sortedPlans.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No payment plans yet</h3>
          <p className="text-sm text-slate-400 mb-4">Add your first pricing plan to display it on the site.</p>
          <button onClick={openAddDialog} className="btn-admin btn-admin-primary text-sm">
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        </div>
      ) : (
        <div className="admin-card divide-y divide-slate-800/60">
          {sortedPlans.map((plan) => {
            const features = parseFeatures(plan.features)
            return (
              <div
                key={plan.id}
                className={`flex items-center gap-3 p-4 transition-all ${plan.enabled ? '' : 'opacity-60'}`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white truncate">{plan.name}</h3>
                    {plan.popular && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#A98B4F]/15 text-[#A98B4F] border border-[#A98B4F]/20">
                        <Star className="w-3 h-3" /> Popular
                      </span>
                    )}
                    {plan.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1E6B3A]/15 text-[#34D399] border border-[#1E6B3A]/20">
                        {plan.badge}
                      </span>
                    )}
                    {plan.enabled ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        Visible
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-500 border border-slate-700/50">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {[plan.startingPrice && `From ${plan.startingPrice}`, plan.size, features.length > 0 && `${features.length} feature${features.length !== 1 ? 's' : ''}`]
                      .filter(Boolean)
                      .join(' · ') || 'No details'}
                  </p>
                </div>

                {/* Sort order badge */}
                <span className="text-[10px] text-slate-600 font-mono shrink-0">#{plan.sortOrder}</span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(plan)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      plan.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                    title={plan.enabled ? 'Disable' : 'Enable'}
                  >
                    {plan.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEditDialog(plan)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(plan.id)}
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
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[520px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-white text-lg">
              {editingId ? 'Edit Payment Plan' : 'Add Payment Plan'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Standard Plot"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Starting price + Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Starting Price</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. ৳25 Lakh"
                  value={form.startingPrice}
                  onChange={(e) => setForm(f => ({ ...f, startingPrice: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Size</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. 3 Katha"
                  value={form.size}
                  onChange={(e) => setForm(f => ({ ...f, size: e.target.value }))}
                />
              </div>
            </div>

            {/* Badge + Sort order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Badge (optional)</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Best Value"
                  value={form.badge}
                  onChange={(e) => setForm(f => ({ ...f, badge: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Sort Order</label>
                <input
                  type="number"
                  className="admin-input"
                  value={form.sortOrder}
                  onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value === '' ? 0 : Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Features</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="admin-input flex-1"
                  placeholder="Add a feature and press Enter"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
                />
                <button type="button" onClick={addFeature} className="btn-admin btn-admin-secondary text-xs px-3 py-2 whitespace-nowrap">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {form.features.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {form.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/40 rounded-lg px-3 py-2">
                      <span className="flex-1 text-sm text-slate-200 truncate">{feat}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, popular: !f.popular }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.popular ? 'bg-[#A98B4F]' : 'bg-slate-600'}`}
                  aria-label={form.popular ? 'Unmark popular' : 'Mark popular'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.popular ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs text-slate-300">Mark as popular (highlighted)</span>
              </div>

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
              <button onClick={() => setDialogOpen(false)} className="btn-admin btn-admin-secondary text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-admin btn-admin-primary text-sm">
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : editingId ? (
                  'Update Plan'
                ) : (
                  'Add Plan'
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
            <DialogTitle className="text-white text-lg">Delete Payment Plan</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <p className="text-sm text-slate-300 mb-6">
              Are you sure you want to delete this payment plan? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeletingId(null)} className="btn-admin btn-admin-secondary text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-admin btn-admin-danger text-sm">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
