'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search, RotateCcw, Save, Loader2, ChevronDown } from 'lucide-react'

interface Item { key: string; value: string; default: string; overridden: boolean }
interface Group { name: string; label: string; items: Item[] }

export default function UiTextPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ui-strings')
      const data = await res.json()
      setGroups(data.groups || [])
      setEdits({})
    } catch {
      toast.error('Failed to load UI strings')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const valueOf = (it: Item) => (it.key in edits ? edits[it.key] : it.value)
  const dirty = Object.keys(edits).length

  const saveAll = async () => {
    if (!dirty) return
    setSaving(true)
    try {
      const updates = Object.entries(edits).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/ui-strings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Saved ${updates.length} string${updates.length > 1 ? 's' : ''}`)
      await load()
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const resetKey = async (key: string) => {
    try {
      await fetch('/api/admin/ui-strings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      setEdits((e) => { const n = { ...e }; delete n[key]; return n })
      toast.success('Reset to default')
      await load()
    } catch {
      toast.error('Reset failed')
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return groups
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => it.key.toLowerCase().includes(needle) || (it.value || '').toLowerCase().includes(needle)) }))
      .filter((g) => g.items.length > 0)
  }, [groups, q])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">UI Text</h1>
          <p className="text-sm text-muted-foreground">Edit every button, label, placeholder, and microcopy string shown on the public site.</p>
        </div>
        <button onClick={saveAll} disabled={!dirty || saving} className="btn-admin inline-flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {dirty ? `Save ${dirty} change${dirty > 1 ? 's' : ''}` : 'Saved'}
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search keys or text…" className="admin-input pl-9 w-full" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No strings match “{q}”.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => {
            const isOpen = open[g.name] ?? (!!q || true)
            return (
              <div key={g.name} className="border border-border rounded-lg overflow-hidden">
                <button onClick={() => setOpen((o) => ({ ...o, [g.name]: !isOpen }))} className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60">
                  <span className="font-medium">{g.label} <span className="text-xs text-muted-foreground">({g.items.length})</span></span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                </button>
                {isOpen && (
                  <div className="divide-y divide-border">
                    {g.items.map((it) => {
                      const v = valueOf(it)
                      const changed = it.key in edits
                      const multiline = (it.default || '').length > 60 || (it.default || '').includes('\n')
                      return (
                        <div key={it.key} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <code className="text-[11px] text-muted-foreground">{it.key}</code>
                            {(it.overridden || changed) && (
                              <button onClick={() => resetKey(it.key)} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> reset
                              </button>
                            )}
                          </div>
                          {multiline ? (
                            <textarea value={v} onChange={(e) => setEdits((ed) => ({ ...ed, [it.key]: e.target.value }))} rows={3} className="admin-input w-full text-sm" />
                          ) : (
                            <input value={v} onChange={(e) => setEdits((ed) => ({ ...ed, [it.key]: e.target.value }))} className="admin-input w-full text-sm" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
