'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Plus,
  Download,
  Trash2,
  MoreHorizontal,
  Eye,
  Pencil,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Phone,
  ArrowUpDown,
  Users,
  LayoutList,
  Columns3,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  Thermometer,
  Snowflake,
  User,
  Sparkles,
  Zap,
  Loader2,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react'
import LeadKanban from '@/components/LeadKanban'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useFieldOptions } from '@/hooks/useFieldOptions'
import { hasPermission, resolveLeadAccess, type LeadAccess } from '@/lib/permissions'

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  source: string
  projectId: string | null
  projectName: string
  message: string | null
  status: string
  priority: string
  score: number
  assignedTo: string | null
  aiScore: number | null
  aiNextAction: string | null
  aiAnalyzedAt: string | null
  createdAt: string
  updatedAt: string
  tags: { tagId: string; tagName: string; tagColor: string }[]
}

interface Agent {
  id: string
  name: string
  username: string
}

const SMART_SEGMENTS = [
  { key: 'ai_hot', label: 'Hot Leads', icon: TrendingUp, color: 'emerald' },
  { key: 'ai_warm', label: 'Warm Leads', icon: Thermometer, color: 'amber' },
  { key: 'ai_cold', label: 'Cold Leads', icon: Snowflake, color: 'blue' },
  { key: 'ai_unscored', label: 'Needs Scoring', icon: Sparkles, color: 'slate' },
  { key: 'at_risk', label: 'At Risk', icon: AlertTriangle, color: 'red' },
] as const

const SEGMENT_STYLES: Record<string, { active: string; inactive: string }> = {
  emerald: {
    active: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-300 ring-1 ring-emerald-500/50 border-emerald-500/30',
    inactive: 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 text-emerald-400/60 hover:from-emerald-500/15 hover:to-emerald-600/10 hover:text-emerald-400 border-transparent',
  },
  amber: {
    active: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 ring-1 ring-amber-500/50 border-amber-500/30',
    inactive: 'bg-gradient-to-r from-amber-500/10 to-amber-600/5 text-amber-400/60 hover:from-amber-500/15 hover:to-amber-600/10 hover:text-amber-400 border-transparent',
  },
  blue: {
    active: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-300 ring-1 ring-blue-500/50 border-blue-500/30',
    inactive: 'bg-gradient-to-r from-blue-500/10 to-blue-600/5 text-blue-400/60 hover:from-blue-500/15 hover:to-blue-600/10 hover:text-blue-400 border-transparent',
  },
  slate: {
    active: 'bg-gradient-to-r from-slate-400/15 to-slate-500/10 text-slate-200 ring-1 ring-slate-400/50 border-slate-400/30',
    inactive: 'bg-gradient-to-r from-slate-500/10 to-slate-600/5 text-slate-500 hover:from-slate-500/15 hover:to-slate-600/10 hover:text-slate-400 border-transparent',
  },
  red: {
    active: 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-300 ring-1 ring-red-500/50 border-red-500/30',
    inactive: 'bg-gradient-to-r from-red-500/10 to-red-600/5 text-red-400/60 hover:from-red-500/15 hover:to-red-600/10 hover:text-red-400 border-transparent',
  },
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function LeadsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkAssignTo, setBulkAssignTo] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [bulkCompose, setBulkCompose] = useState<'whatsapp' | 'email' | null>(null)
  const [composeSubject, setComposeSubject] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [composeSending, setComposeSending] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importColumns, setImportColumns] = useState<string[]>([])
  const [importPreview, setImportPreview] = useState<number>(0)
  const [importing, setImporting] = useState(false)
  const [scoringAll, setScoringAll] = useState(false)
  const [showNextAction, setShowNextAction] = useState(false)
  const [activeSmartSegment, setActiveSmartSegment] = useState<string>('')
  const [smartCounts, setSmartCounts] = useState<Record<string, number>>({})
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { getValues } = useFieldOptions()
  const SOURCES = getValues('lead_sources')
  const STATUSES = getValues('lead_statuses')
  const PRIORITIES = getValues('lead_priorities')

  // Filters from URL
  const [search, setSearch] = useState(searchParams.get('search') || '')
  // Uncommitted search box value — committed to `search` (the fetch trigger) on debounce.
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [source, setSource] = useState(searchParams.get('source') || '')
  const [priority, setPriority] = useState(searchParams.get('priority') || '')
  const [assignedTo, setAssignedTo] = useState(searchParams.get('assignedTo') || '')

  useEffect(() => {
    fetch('/api/admin/leads/agents')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.agents)) setAgents(d.agents) })
      .catch(() => {})
  }, [])

  // Capability-based UI gating. Sales users (own-scope) only see their own
  // leads and may only change status / add remarks, so create/edit/delete/
  // assign/import/export controls are hidden — the API enforces all of this
  // too, this just keeps the UI honest. Defaults to full access so admins
  // never flash a stripped UI before the cache reads.
  const [canManage, setCanManage] = useState(true)
  const [access, setAccess] = useState<LeadAccess>({ scope: 'all', canEdit: true, canStatus: true, canAssign: true })
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('admin-auth-user')
      if (raw) {
        const u = JSON.parse(raw)
        setCanManage(hasPermission(u, 'leads', true))
        const a = resolveLeadAccess(u)
        if (a) setAccess(a)
      }
    } catch { /* keep default */ }
  }, [])

  const fetchLeads = useCallback(async () => {
    // Clear any selection when the page/filters change — otherwise bulk actions
    // would target leads that scrolled off the current result set.
    setSelected(new Set())
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (source) params.set('source', source)
    if (priority) params.set('priority', priority)
    if (assignedTo) params.set('assignedTo', assignedTo)
    params.set('page', String(page))
    params.set('limit', '20')

    try {
      const res = await fetch(`/api/admin/leads?${params}`)
      const data = await res.json()
      if (data.leads) {
        setLeads(data.leads)
        setTotal(data.total)
        if (data.smartCounts) setSmartCounts(data.smartCounts)
      }
    } catch {
      toast.error('Failed to load leads')
    }
    setLoading(false)
  }, [search, status, source, priority, assignedTo, page])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const handleSearch = (val: string) => {
    // Update the visible box immediately, but only commit to `search` (which drives
    // the fetch) after the user pauses typing — a real debounce, not a no-op timer.
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === displayLeads.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(displayLeads.map((l) => l.id)))
    }
  }

  const exportCSV = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (source) params.set('source', source)
    if (priority) params.set('priority', priority)
    if (assignedTo) params.set('assignedTo', assignedTo)
    window.open(`/api/admin/leads/export?${params}`, '_blank')
  }

  const bulkAction = async (field: string, value: string) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), [field]: value }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Updated ${data.updated} leads`)
        setSelected(new Set())
        fetchLeads()
      }
    } catch {
      toast.error('Bulk action failed')
    }
  }

  const bulkDelete = async () => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: deleteTarget }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Deleted ${data.deleted} leads`)
        setSelected(new Set())
        setShowDeleteConfirm(false)
        fetchLeads()
      }
    } catch {
      toast.error('Delete failed')
    }
  }

  const sendBulkMessage = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!composeMessage.trim()) { toast.error('Message is required'); return }
    if (bulkCompose === 'email' && !composeSubject.trim()) { toast.error('Subject is required'); return }
    setComposeSending(true)
    try {
      if (bulkCompose === 'whatsapp') {
        const res = await fetch('/api/admin/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send', leadIds: ids, message: composeMessage.trim() }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          toast.success(`WhatsApp sent: ${data.sent}, failed: ${data.failed}`)
          setBulkCompose(null); setSelected(new Set())
        } else {
          toast.error(data.error || 'WhatsApp send failed')
        }
      } else {
        const res = await fetch('/api/admin/leads/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadIds: ids, subject: composeSubject.trim(), message: composeMessage.trim() }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          const extra = data.skipped > 0 ? `, ${data.skipped} no email` : ''
          toast.success(`Email sent: ${data.sent}, failed: ${data.failed}${extra}`)
          setBulkCompose(null); setSelected(new Set())
        } else {
          toast.error(data.error || 'Email send failed')
        }
      }
    } catch {
      toast.error('Send failed')
    }
    setComposeSending(false)
  }

  const clearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearch('')
    setSearchInput('')
    setStatus('')
    setSource('')
    setPriority('')
    setAssignedTo('')
    setPage(1)
  }

  const hasFilters = search || status || source || priority || assignedTo

  const matchesSmartSegment = (lead: Lead, segment: string): boolean => {
    switch (segment) {
      case 'ai_hot': return lead.aiScore != null && lead.aiScore >= 70
      case 'ai_warm': return lead.aiScore != null && lead.aiScore >= 40 && lead.aiScore < 70
      case 'ai_cold': return lead.aiScore != null && lead.aiScore < 40
      case 'ai_unscored': return lead.aiScore == null
      case 'at_risk': {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return lead.status === 'new' && new Date(lead.createdAt).getTime() < sevenDaysAgo
      }
      default: return true
    }
  }

  const displayLeads = activeSmartSegment
    ? leads.filter((l) => matchesSmartSegment(l, activeSmartSegment))
    : leads

  // Email is optional on the public forms, so most leads have no email on file.
  // Bulk-email actions must account for that (skip / disable when none apply).
  const selectedEmailCount = leads.filter((l) => selected.has(l.id) && l.email).length

  const handleScoreAll = async () => {
    setScoringAll(true)
    try {
      const res = await fetch('/api/admin/ai/bulk-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.success) {
        const s = data.summary
        toast.success(`${data.scored} leads scored. Avg: ${s.avgScore}. High (≥70): ${s.highScore}`)
        fetchLeads()
      } else {
        toast.error(data.error || 'AI scoring failed')
      }
    } catch {
      toast.error('AI scoring failed. Please try again.')
    }
    setScoringAll(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Lead Management</h1>
          <span className="bg-slate-800 text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/50">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table view"
            >
              <LayoutList className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Board view"
            >
              <Columns3 className="w-3.5 h-3.5" />
              Board
            </button>
          </div>
          {access.scope === 'all' && (
          <button onClick={exportCSV} className="btn-admin btn-admin-secondary text-sm">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span> CSV
          </button>
          )}
          <button
            onClick={() => setShowNextAction((v) => !v)}
            className={`btn-admin btn-admin-secondary text-sm ${showNextAction ? 'ring-1 ring-[#A98B4F]/50 text-[#A98B4F]' : ''}`}
            title={showNextAction ? 'Hide AI Next Actions' : 'Show AI Next Actions'}
          >
            <Zap className="w-4 h-4" /> <span className="hidden sm:inline">Actions</span>
          </button>
          {canManage && (
          <button
            onClick={handleScoreAll}
            disabled={scoringAll}
            className="relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-[#1E6B3A] to-[#2a8f4e] hover:from-[#247d43] hover:to-[#33a35c] shadow-lg shadow-emerald-900/30 border border-emerald-500/20 hover:border-emerald-400/30"
          >
            {scoringAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{scoringAll ? 'Scoring...' : 'Score All Leads'}</span>
            <span className="sm:hidden">{scoringAll ? 'Scoring...' : 'Score'}</span>
          </button>
          )}
          {canManage && (
          <button onClick={() => { setShowImportDialog(true); setImportFile(null); setImportColumns([]); setImportPreview(0) }} className="btn-admin btn-admin-secondary text-sm">
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Import</span> CSV
          </button>
          )}
          {canManage && (
          <button onClick={() => setShowAddDialog(true)} className="btn-admin btn-admin-primary text-sm">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
          )}
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' ? (
        <LeadKanban />
      ) : (
        <>
      {/* Toolbar: search + filters */}
      <div className="admin-card p-3 flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            style={{ paddingLeft: '2.5rem' }}
            className="admin-input py-2"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
          <div className="flex flex-wrap items-center gap-2">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '130px' }} className="admin-select text-sm py-2">
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
            <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '130px' }} className="admin-select text-sm py-2">
              <option value="">All Sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
            <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '130px' }} className="admin-select text-sm py-2">
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            {access.scope === 'all' && (
            <select value={assignedTo} onChange={(e) => { setAssignedTo(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '130px' }} className="admin-select text-sm py-2">
              <option value="">All Assignees</option>
              <option value="__unassigned__">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
            )}
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Smart Segments */}
      {viewMode === 'table' && (
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 -mx-1 px-1">
          <button
            onClick={() => setActiveSmartSegment('')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
              !activeSmartSegment
                ? 'bg-slate-700/80 text-white ring-1 ring-slate-500/50 border-slate-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300 hover:bg-slate-800 border-transparent'
            }`}
          >
            All Leads
            <span className="bg-slate-700 text-slate-300 text-[10px] rounded-full px-1.5 leading-none py-0.5">{total}</span>
          </button>
          {SMART_SEGMENTS.map((seg) => {
            const isActive = activeSmartSegment === seg.key
            const Icon = seg.icon
            const count = smartCounts[seg.key] ?? 0
            const styles = SEGMENT_STYLES[seg.color]
            return (
              <button
                key={seg.key}
                onClick={() => setActiveSmartSegment(isActive ? '' : seg.key)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive ? styles.active : styles.inactive
                }`}
              >
                <Icon className="w-3 h-3" />
                {seg.label}
                <span className="bg-slate-700 text-slate-300 text-[10px] rounded-full px-1.5 leading-none py-0.5">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                    {selected.size === displayLeads.length && displayLeads.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#1E6B3A]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3 text-left">Name / Phone</th>
                <th className="p-3 text-left hidden md:table-cell">Email</th>
                <th className="p-3 text-left hidden lg:table-cell">Source</th>
                <th className="p-3 text-left hidden lg:table-cell">Project</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left hidden sm:table-cell">Priority</th>
                <th className="p-3 text-left hidden lg:table-cell">Assigned</th>
                <th className="p-3 text-center hidden md:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                </th>
                {showNextAction && (
                  <th className="p-3 text-left hidden md:table-cell">Next Best Action</th>
                )}
                <th className="p-3 text-left hidden lg:table-cell">Tags</th>
                <th className="p-3 text-left hidden lg:table-cell">Date</th>
                <th className="p-3 text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3 bg-slate-900/20" /><td className="p-3 bg-slate-900/20" />
                    <td className="p-3 bg-slate-900/30 hidden md:table-cell" /><td className="p-3 bg-slate-900/20 hidden lg:table-cell" />
                    <td className="p-3 bg-slate-900/30 hidden lg:table-cell" /><td className="p-3 bg-slate-900/20" />
                    <td className="p-3 bg-slate-900/30 hidden sm:table-cell" />
                    <td className="p-3 bg-slate-900/20 hidden lg:table-cell" />
                    <td className="p-3 bg-slate-900/20 hidden md:table-cell" />
                    {showNextAction && <td className="p-3 bg-slate-900/20 hidden md:table-cell" />}
                    <td className="p-3 bg-slate-900/20 hidden lg:table-cell" />
                    <td className="p-3 bg-slate-900/30 hidden lg:table-cell" /><td className="p-3 bg-slate-900/20" />
                  </tr>
                ))
              ) : displayLeads.length === 0 ? (
                <tr>
                  <td colSpan={showNextAction ? 13 : 12} className="p-12 text-center text-slate-500">
                    {activeSmartSegment
                      ? 'No leads match this smart segment on the current page'
                      : hasFilters
                        ? 'No leads match your filters'
                        : 'No leads yet. They will appear when visitors submit forms.'}
                  </td>
                </tr>
              ) : (
                displayLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      selected.has(lead.id) ? 'bg-[#1E6B3A]/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <button onClick={() => toggleSelect(lead.id)} className="text-slate-500 hover:text-white">
                        {selected.has(lead.id) ? (
                          <CheckSquare className="w-4 h-4 text-[#1E6B3A]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/leads/${lead.id}`} className="text-white font-medium hover:text-[#34D399] transition-colors">
                        {lead.name}
                      </Link>
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </p>
                    </td>
                    <td className="p-3 text-slate-400 hidden md:table-cell max-w-[180px] truncate">
                      {lead.email || '—'}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-slate-400 text-xs capitalize">{lead.source.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="p-3 text-slate-400 hidden lg:table-cell text-xs">{lead.projectName}</td>
                    <td className="p-3">
                      <span className={`badge-status badge-${lead.status}`}>
                        {lead.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`badge-status badge-${lead.priority}`}>
                        {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {lead.assignedTo ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-[#1E6B3A]/15 flex items-center justify-center text-[9px] font-semibold text-[#34D399]">
                            {lead.assignedTo.slice(0, 2).toUpperCase()}
                          </span>
                          {lead.assignedTo}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell text-center">
                      {lead.aiScore != null ? (
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                          style={{
                            color: lead.aiScore >= 70 ? '#34D399' : lead.aiScore >= 40 ? '#FBBF24' : '#F87171',
                            backgroundColor: lead.aiScore >= 70 ? 'rgba(52,211,153,0.12)' : lead.aiScore >= 40 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)',
                            boxShadow: lead.aiScore >= 70 ? '0 0 8px rgba(52,211,153,0.2)' : 'none',
                          }}
                          title={`AI Score: ${lead.aiScore}${lead.aiAnalyzedAt ? ` · Analyzed ${relativeTime(lead.aiAnalyzedAt)}` : ''}`}
                        >
                          {lead.aiScore}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    {showNextAction && (
                      <td className="p-3 hidden md:table-cell">
                        {lead.aiNextAction ? (
                          <div
                            className={`text-xs text-slate-300 pl-2.5 py-1 border-l-2 max-w-[200px] leading-snug ${
                              lead.aiScore != null && lead.aiScore >= 70
                                ? 'border-emerald-500'
                                : lead.aiScore != null && lead.aiScore >= 40
                                  ? 'border-amber-500'
                                  : 'border-red-500'
                            }`}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            <span className="text-slate-500 mr-1">
                              <Zap className="w-3 h-3 inline -mt-0.5" />
                            </span>
                            {lead.aiNextAction}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    )}
                    <td className="p-3 hidden lg:table-cell">
                      {lead.tags.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {lead.tags.slice(0, 2).map((t) => (
                            <span
                              key={t.tagId}
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                              style={{ backgroundColor: `${t.tagColor}15`, color: t.tagColor }}
                            >
                              {t.tagName}
                            </span>
                          ))}
                          {lead.tags.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                              +{lead.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 text-xs hidden lg:table-cell whitespace-nowrap">
                      {relativeTime(lead.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/leads/${lead.id}`} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/50">
            <span className="text-xs text-slate-500">
              {activeSmartSegment
                ? `${displayLeads.length} of ${smartCounts[activeSmartSegment] ?? 0} matching leads on this page`
                : `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} of ${total}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(total / 20)) }).map((_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-[#1E6B3A] text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

        </>
      )}

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Import Leads from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">CSV File *</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setImportFile(file)
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const text = ev.target?.result as string
                        const lines = text.split(/\r?\n/).filter((l) => l.trim())
                        if (lines.length > 0) {
                          setImportColumns(lines[0].split(',').map((c) => c.replace(/^"|"$/g, '').trim()))
                          setImportPreview(lines.length - 1)
                        }
                      }
                      reader.readAsText(file)
                    } else {
                      setImportColumns([])
                      setImportPreview(0)
                    }
                  }}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-300 file:cursor-pointer hover:file:bg-slate-700"
                />
              </div>
            </div>

            {/* Template download */}
            <div>
              <button
                onClick={() => {
                  const headers = 'name,phone,email,source,project,priority,message,assignedTo'
                  const sample = `"John Doe","+8801712345678","john@example.com","website","Ventura City","high","Interested in plots",""`
                  const csv = headers + '\n' + sample
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'lead-import-template.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="text-[#1E6B3A] text-xs hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Download template
              </button>
            </div>

            {/* Column preview */}
            {importColumns.length > 0 && (
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">Detected columns ({importColumns.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {importColumns.map((col) => (
                    <span
                      key={col}
                      className={`text-xs px-2 py-0.5 rounded-md ${
                        ['name', 'phone'].includes(col.toLowerCase())
                          ? 'bg-[#1E6B3A]/20 text-[#34D399] border border-[#1E6B3A]/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  <FileSpreadsheet className="w-3 h-3 inline mr-1" />
                  {importPreview} data row{importPreview !== 1 ? 's' : ''} detected
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setShowImportDialog(false)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button
              onClick={async () => {
                if (!importFile) return
                setImporting(true)
                try {
                  const formData = new FormData()
                  formData.append('file', importFile)
                  const res = await fetch('/api/admin/leads/import', {
                    method: 'POST',
                    body: formData,
                  })
                  const data = await res.json()
                  if (data.success) {
                    const parts = [`Imported ${data.imported} leads`]
                    if (data.skipped > 0) parts.push(`${data.skipped} errors`)
                    toast.success(parts.join(', '))
                    setShowImportDialog(false)
                    setImportFile(null)
                    setImportColumns([])
                    fetchLeads()
                  } else {
                    toast.error(data.error || 'Import failed')
                  }
                } catch {
                  toast.error('Import failed')
                }
                setImporting(false)
              }}
              disabled={!importFile || importing}
              className="btn-admin btn-admin-secondary text-sm"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lead Dialog */}
      <AddLeadDialog open={showAddDialog} onOpen={setShowAddDialog} onCreated={fetchLeads} />

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Leads</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm">
            Are you sure you want to delete {deleteTarget.length} lead{deleteTarget.length > 1 ? 's' : ''}? This action cannot be undone.
          </p>
          <DialogFooter>
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-admin btn-admin-secondary text-sm">
              Cancel
            </button>
            <button onClick={bulkDelete} className="btn-admin btn-admin-danger text-sm">
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Compose Dialog (WhatsApp / Email) */}
      <Dialog open={bulkCompose !== null} onOpenChange={(v) => { if (!v) setBulkCompose(null) }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {bulkCompose === 'whatsapp' ? (
                <><MessageCircle className="w-5 h-5 text-[#34D399]" /> Send WhatsApp</>
              ) : (
                <><Mail className="w-5 h-5 text-slate-300" /> Send Email</>
              )}
              <span className="text-xs font-normal text-slate-500">to {selected.size} lead{selected.size > 1 ? 's' : ''}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {bulkCompose === 'email' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Subject *</label>
                <input
                  className="admin-input"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Message *</label>
              <textarea
                className="admin-input min-h-[120px] resize-y"
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder={bulkCompose === 'whatsapp' ? 'WhatsApp message...' : 'Email body...'}
              />
            </div>
            {bulkCompose === 'whatsapp' && (
              <p className="text-[11px] text-slate-500">
                Sends via the configured WhatsApp provider. Requires WhatsApp settings to be set up.
              </p>
            )}
            {bulkCompose === 'email' && (
              selectedEmailCount === 0 ? (
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-400">
                    None of the {selected.size} selected lead{selected.size > 1 ? 's have' : ' has'} an email address on file. Email is optional on the site forms — use WhatsApp to reach {selected.size > 1 ? 'them' : 'this lead'}.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  {selectedEmailCount} of {selected.size} selected lead{selected.size > 1 ? 's' : ''} {selectedEmailCount === 1 ? 'has' : 'have'} an email — the rest are skipped. Requires SMTP configured in Settings.
                </p>
              )
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setBulkCompose(null)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button
              onClick={sendBulkMessage}
              disabled={composeSending || !composeMessage.trim() || (bulkCompose === 'email' && (!composeSubject.trim() || selectedEmailCount === 0))}
              className="btn-admin btn-admin-primary text-sm"
            >
              <Send className="w-4 h-4" />
              {composeSending ? 'Sending...' : 'Send'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-600/30 shadow-2xl backdrop-blur-xl bg-slate-900/90 sm:bg-slate-900/85">
            {/* Selected count */}
            <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
              {selected.size} selected
            </span>

            {access.canStatus && (
            <>
            <div className="hidden sm:block w-px h-6 bg-slate-700/60" />

            {/* Bulk Status Change */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs rounded-lg bg-slate-800/80 border border-slate-600/40 text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              >
                <option value="">Status...</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
              <button
                disabled={!bulkStatus || bulkLoading}
                onClick={async () => {
                  if (!bulkStatus) return
                  setBulkLoading(true)
                  await bulkAction('status', bulkStatus)
                  setBulkStatus('')
                  setBulkLoading(false)
                }}
                className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Apply
              </button>
            </div>
            </>
            )}

            {access.canAssign && (
            <>
            <div className="hidden sm:block w-px h-6 bg-slate-700/60" />

            {/* Bulk Assign */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs rounded-lg bg-slate-800/80 border border-slate-600/40 text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              >
                <option value="">Assign...</option>
                <option value="__unassign__">Unassign</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
              <button
                disabled={!bulkAssignTo || bulkLoading}
                onClick={async () => {
                  if (!bulkAssignTo) return
                  setBulkLoading(true)
                  await bulkAction('assignedTo', bulkAssignTo)
                  setBulkAssignTo('')
                  setBulkLoading(false)
                }}
                className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Apply
              </button>
            </div>
            </>
            )}

            {canManage && (
            <>
            <div className="hidden sm:block w-px h-6 bg-slate-700/60" />

            {/* Bulk Message */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setBulkCompose('whatsapp'); setComposeSubject(''); setComposeMessage('') }}
                className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-medium rounded-lg bg-[#1E6B3A] hover:bg-[#247d43] text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <button
                onClick={() => { setBulkCompose('email'); setComposeSubject(''); setComposeMessage('') }}
                title={`${selectedEmailCount} of ${selected.size} selected have an email`}
                className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
                {selectedEmailCount > 0 && (
                  <span className="ml-0.5 px-1 rounded bg-slate-900/60 text-[10px] leading-none py-0.5">{selectedEmailCount}</span>
                )}
              </button>
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-700/60" />

            {/* Bulk Delete */}
            <button
              onClick={() => { setDeleteTarget(Array.from(selected)); setShowDeleteConfirm(true) }}
              className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-medium rounded-lg bg-red-600/90 hover:bg-red-500 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>

            <div className="hidden sm:block w-px h-6 bg-slate-700/60" />
            </>
            )}

            {/* Clear Selection */}
            <button
              onClick={() => { setSelected(new Set()); setBulkStatus(''); setBulkAssignTo('') }}
              className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* Add Lead Dialog Component */
function AddLeadDialog({ open, onOpen, onCreated }: { open: boolean; onOpen: (v: boolean) => void; onCreated: () => void }) {
  const router = useRouter()
  const { getValues } = useFieldOptions()
  const SOURCES = getValues('lead_sources')
  const PRIORITIES = getValues('lead_priorities')
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'manual', projectId: '', priority: 'medium', message: '' })
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [duplicateLead, setDuplicateLead] = useState<{
    id: string; name: string; phone: string; status: string; createdAt: string; projectName: string | null
  } | null>(null)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [liveDuplicate, setLiveDuplicate] = useState<{
    id: string; name: string; phone: string; status: string; createdAt: string; projectName: string | null
  } | null>(null)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const phoneCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      fetch('/api/admin/projects')
        .then((r) => r.json())
        .then((d) => {
          setProjects(Array.isArray(d) ? d : [])
          setDuplicateLead(null)
          setShowDuplicateWarning(false)
          setLiveDuplicate(null)
        })
        .catch(() => {})
    }
  }, [open])

  // Live duplicate check as user types phone number (debounced)
  const handlePhoneChange = (value: string) => {
    setForm({ ...form, phone: value })
    setLiveDuplicate(null)

    if (phoneCheckRef.current) clearTimeout(phoneCheckRef.current)
    if (!value.trim() || value.trim().length < 5) return

    setCheckingPhone(true)
    phoneCheckRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/leads?checkDuplicate=1&phone=${encodeURIComponent(value.trim())}`)
        const data = await res.json()
        if (data.duplicate && data.existingLead) {
          setLiveDuplicate(data.existingLead)
        } else {
          setLiveDuplicate(null)
        }
      } catch {
        // silently ignore
      }
      setCheckingPhone(false)
    }, 500)
  }

  const createLead = async (force = false) => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return }
    setLoading(true)
    try {
      const url = force ? '/api/admin/leads?force=true' : '/api/admin/leads'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projectId: form.projectId || null }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Lead created')
        setForm({ name: '', phone: '', email: '', source: 'manual', projectId: '', priority: 'medium', message: '' })
        setShowDuplicateWarning(false)
        setDuplicateLead(null)
        setLiveDuplicate(null)
        onOpen(false)
        onCreated()
      } else if (data.error === 'duplicate' && data.duplicate) {
        setDuplicateLead(data.duplicate)
        setShowDuplicateWarning(true)
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch { toast.error('Failed to create lead') }
    setLoading(false)
  }

  const handleSubmit = () => createLead(false)

  const handleForceCreate = () => createLead(true)

  const handleViewExisting = () => {
    if (!duplicateLead) return
    setShowDuplicateWarning(false)
    onOpen(false)
    router.push(`/admin/leads/${duplicateLead.id}`)
  }

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Name *</label>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Phone *</label>
              <input className="admin-input" value={form.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="+880 1XXX-XXXXXX" />
              {checkingPhone && (
                <p className="text-xs text-slate-500 mt-1">Checking...</p>
              )}
              {liveDuplicate && !checkingPhone && (
                <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400">
                    A lead with this phone already exists: <span className="font-medium text-amber-300">{liveDuplicate.name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email <span className="text-slate-600">(optional)</span></label>
              <input className="admin-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Source</label>
              <select className="admin-select" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {SOURCES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Project</label>
              <select className="admin-select" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                <option value="">No Project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Priority</label>
              <select className="admin-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Message</label>
            <textarea className="admin-input min-h-[80px] resize-y" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Optional notes..." />
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpen(false)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-admin btn-admin-primary text-sm">
            {loading ? 'Creating...' : 'Create Lead'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Duplicate Lead Warning Dialog */}
    <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
      <DialogContent className="bg-slate-900 border-amber-500/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
            </div>
            Duplicate Lead Detected
          </DialogTitle>
        </DialogHeader>

        {duplicateLead && (
          <div className="space-y-4 py-2">
            <p className="text-amber-200 text-sm font-medium">
              A lead with this phone number already exists!
            </p>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
              <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/15">
                <p className="text-xs text-amber-400/80 font-medium uppercase tracking-wider">Existing Lead</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center mt-0.5 shrink-0">
                    <User className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{duplicateLead.name}</p>
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {duplicateLead.phone}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-800/60 px-3 py-2">
                    <p className="text-slate-500 mb-0.5">Status</p>
                    <span className={`badge-status badge-${duplicateLead.status}`}>
                      {duplicateLead.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 px-3 py-2">
                    <p className="text-slate-500 mb-0.5">Project</p>
                    <p className="text-slate-200 font-medium truncate">{duplicateLead.projectName || '—'}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-800/60 px-3 py-2 text-xs">
                  <p className="text-slate-500 mb-0.5">Created</p>
                  <p className="text-slate-200 font-medium">{formatDate(duplicateLead.createdAt)}</p>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-xs">
              You can still create a new lead with this phone number, or view the existing one.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <button
            onClick={() => setShowDuplicateWarning(false)}
            className="btn-admin btn-admin-secondary text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleViewExisting}
            className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg border border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Existing Lead
          </button>
          <button
            onClick={handleForceCreate}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Anyway'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}