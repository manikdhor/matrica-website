'use client'

import { useState, useEffect, useCallback } from 'react'
import { ListFilter, Plus, Trash2, GripVertical, RotateCcw, Save, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface FieldOption {
  label: string
  value: string
}

interface OptionGroup {
  label: string
  keys: string[]
}

interface OptionMeta {
  options: Record<string, FieldOption[]>
  labels: Record<string, string>
  groups: Record<string, OptionGroup>
  defaults: Record<string, FieldOption[]>
}

export default function FieldOptionsEditor() {
  const [meta, setMeta] = useState<OptionMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editBuffer, setEditBuffer] = useState<Record<string, FieldOption[]>>({})

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/options')
      const data = await res.json()
      setMeta(data)
      // Pre-expand first group
      const groupKeys = Object.keys(data.groups || {})
      if (groupKeys.length > 0) {
        setExpandedGroups(new Set([groupKeys[0]]))
      }
    } catch {
      toast.error('Failed to load field options')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  const getOptions = (key: string): FieldOption[] => {
    if (editBuffer[key]) return editBuffer[key]
    return meta?.options?.[key] || []
  }

  const updateOptionLabel = (key: string, index: number, newLabel: string) => {
    const opts = [...getOptions(key)]
    opts[index] = { ...opts[index], label: newLabel }
    setEditBuffer(prev => ({ ...prev, [key]: opts }))
  }

  const updateOptionValue = (key: string, index: number, newValue: string) => {
    const opts = [...getOptions(key)]
    opts[index] = { ...opts[index], value: newValue }
    setEditBuffer(prev => ({ ...prev, [key]: opts }))
  }

  const addOption = (key: string) => {
    const opts = [...getOptions(key), { label: '', value: '' }]
    setEditBuffer(prev => ({ ...prev, [key]: opts }))
  }

  const removeOption = (key: string, index: number) => {
    const opts = getOptions(key).filter((_, i) => i !== index)
    setEditBuffer(prev => ({ ...prev, [key]: opts }))
  }

  const moveOption = (key: string, index: number, direction: 'up' | 'down') => {
    const opts = [...getOptions(key)]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= opts.length) return
    ;[opts[index], opts[swapIdx]] = [opts[swapIdx], opts[index]]
    setEditBuffer(prev => ({ ...prev, [key]: opts }))
  }

  const saveOptions = async (key: string) => {
    const opts = getOptions(key)
    // Filter out empty entries
    const validOpts = opts.filter(o => o.label.trim() && o.value.trim())
    if (validOpts.length === 0) {
      toast.error('At least one option is required')
      return
    }

    setSaving(key)
    try {
      const res = await fetch('/api/admin/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `options_${key}`, options: validOpts }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Options saved')
        // Clear edit buffer and refresh
        setEditBuffer(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        fetchOptions()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Save failed')
    }
    setSaving(null)
  }

  const resetOptions = async (key: string) => {
    setSaving(key)
    try {
      const res = await fetch(`/api/admin/options?key=options_${key}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Reset to defaults')
        setEditBuffer(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        fetchOptions()
      }
    } catch {
      toast.error('Reset failed')
    }
    setSaving(null)
  }

  const isEdited = (key: string) => !!editBuffer[key]
  const isSaving = (key: string) => saving === key

  if (loading) {
    return (
      <div className="admin-card p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#34D399] animate-spin" />
        <span className="ml-2 text-sm text-slate-400">Loading field options...</span>
      </div>
    )
  }

  if (!meta) return null

  return (
    <div className="space-y-3">
      {/* Info banner */}
      <div className="admin-card p-4">
        <div className="flex items-start gap-3">
          <ListFilter className="w-5 h-5 text-[#34D399] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">Field Options Manager</h3>
            <p className="text-xs text-slate-400 mt-1">
              Customize all dropdown menus, status options, and categories across the admin panel. Changes take effect immediately across all modules.
            </p>
          </div>
        </div>
      </div>

      {/* Option Groups */}
      {Object.entries(meta.groups || {}).map(([groupKey, group]) => (
        <div key={groupKey} className="admin-card overflow-hidden">
          <button
            onClick={() => toggleGroup(groupKey)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedGroups.has(groupKey) ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-sm font-semibold text-white">{group.label}</span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {group.keys.length} fields
              </span>
            </div>
          </button>

          {expandedGroups.has(groupKey) && (
            <div className="border-t border-slate-800/50 divide-y divide-slate-800/30">
              {group.keys.map(key => {
                const options = getOptions(key)
                const label = meta.labels?.[key] || key
                const hasChanges = isEdited(key)
                const isCurrentSaving = isSaving(key)
                const isModified = hasChanges || JSON.stringify(options) !== JSON.stringify(meta.defaults?.[key] || [])

                return (
                  <div key={key} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300">{label}</span>
                        <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                          {options.length} options
                        </span>
                        {hasChanges && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            Unsaved changes
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isModified && (
                          <button
                            onClick={() => resetOptions(key)}
                            disabled={isCurrentSaving}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                            title="Reset to defaults"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => saveOptions(key)}
                          disabled={isCurrentSaving || !hasChanges}
                          className="btn-admin btn-admin-primary text-xs py-1 px-3 disabled:opacity-40"
                        >
                          {isCurrentSaving ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Saving</>
                          ) : (
                            <><Save className="w-3 h-3" /> Save</>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="space-y-1.5">
                      {options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 group">
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              onClick={() => moveOption(key, idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 text-slate-600 hover:text-white disabled:opacity-20 transition-colors"
                            >
                              <ChevronDown className="w-3 h-3 rotate-180" />
                            </button>
                            <button
                              onClick={() => moveOption(key, idx, 'down')}
                              disabled={idx === options.length - 1}
                              className="p-0.5 text-slate-600 hover:text-white disabled:opacity-20 transition-colors"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                          <GripVertical className="w-3 h-3 text-slate-700 shrink-0" />
                          <input
                            className="admin-input text-xs py-1.5 flex-1"
                            placeholder="Label"
                            value={opt.label}
                            onChange={(e) => updateOptionLabel(key, idx, e.target.value)}
                          />
                          <input
                            className="admin-input text-xs py-1.5 flex-1 font-mono"
                            placeholder="Value"
                            value={opt.value}
                            onChange={(e) => updateOptionValue(key, idx, e.target.value)}
                          />
                          <button
                            onClick={() => removeOption(key, idx)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => addOption(key)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#34D399] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}