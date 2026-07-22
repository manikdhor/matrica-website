'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Send, MessageSquare, LayoutTemplate, BarChart3, Plus, Pencil, Trash2,
  Eye, CheckCircle2, XCircle, Clock, Loader2, ChevronDown, X, Users,
  Search, ToggleLeft, ToggleRight, RefreshCw, Phone, Zap, History,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFieldOptions } from '@/hooks/useFieldOptions'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  description: string | null
  body: string
  category: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

interface WhatsAppMessage {
  id: string
  to: string
  message: string
  status: string
  sentAt: string | null
  error: string | null
  createdAt: string
  lead?: { name: string; phone: string } | null
  template?: { name: string } | null
}

interface Lead {
  id: string
  name: string
  phone: string
  project?: { name: string } | null
}

interface Stats {
  totalSent: number
  totalFailed: number
  todaySent: number
  templateCount: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Templates', 'Send & History'] as const
type Tab = (typeof TABS)[number]

const VARIABLE_HINTS = ['{{name}}', '{{phone}}', '{{project}}', '{{company}}', '{{date}}', '{{time}}']

// ─── Component ─────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const { getValues } = useFieldOptions()
  const CATEGORIES = getValues('whatsapp_categories')
  const [tab, setTab] = useState<Tab>('Overview')

  // Data states
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentMessages, setRecentMessages] = useState<WhatsAppMessage[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [allMessages, setAllMessages] = useState<WhatsAppMessage[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [messageTotal, setMessageTotal] = useState(0)
  const [messagePage, setMessagePage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Loading states
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [sending, setSending] = useState(false)

  // Form states
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', body: '', category: 'general', isActive: true, sortOrder: 0 })

  // Compose states
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [composePhone, setComposePhone] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [multiMode, setMultiMode] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [leadSearch, setLeadSearch] = useState('')

  // ─── Fetchers ──────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp?mode=stats')
      if (res.ok) setStats(await res.json())
    } catch { /* silent */ } finally { setLoadingStats(false) }
  }, [])

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp')
      if (res.ok) {
        const data = await res.json()
        setRecentMessages(data.recentMessages || [])
      }
    } catch { /* silent */ }
  }, [])

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true)
    try {
      const res = await fetch('/api/admin/whatsapp?mode=templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch { /* silent */ } finally { setLoadingTemplates(false) }
  }, [])

  const fetchMessages = useCallback(async (page: number, status?: string) => {
    setLoadingMessages(true)
    try {
      const params = new URLSearchParams({ mode: 'messages', page: String(page), limit: '50' })
      if (status) params.set('status', status)
      const res = await fetch(`/api/admin/whatsapp?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAllMessages(data.messages || [])
        setMessageTotal(data.total || 0)
      }
    } catch { /* silent */ } finally { setLoadingMessages(false) }
  }, [])

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true)
    try {
      const res = await fetch('/api/admin/leads?limit=50')
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } catch { /* silent */ } finally { setLoadingLeads(false) }
  }, [])

  useEffect(() => { fetchStats(); fetchRecent() }, [fetchStats, fetchRecent])
  useEffect(() => { if (tab === 'Templates') fetchTemplates() }, [tab, fetchTemplates])
  useEffect(() => { if (tab === 'Send & History') { fetchMessages(1, statusFilter); fetchLeads() } }, [tab, statusFilter, fetchMessages, fetchLeads])

  // ─── Template CRUD ─────────────────────────────────────────────────────────

  const resetTemplateForm = () => {
    setTemplateForm({ name: '', description: '', body: '', category: 'general', isActive: true, sortOrder: 0 })
    setEditingTemplate(null)
    setShowTemplateForm(false)
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.body.trim()) {
      toast.error('Name and body are required')
      return
    }
    try {
      if (editingTemplate) {
        const res = await fetch('/api/admin/whatsapp', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTemplate.id, ...templateForm }),
        })
        if (res.ok) { toast.success('Template updated'); resetTemplateForm(); fetchTemplates() }
        else toast.error('Update failed')
      } else {
        const res = await fetch('/api/admin/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create_template', ...templateForm }),
        })
        if (res.ok) { toast.success('Template created'); resetTemplateForm(); fetchTemplates() }
        else toast.error('Create failed')
      }
    } catch { toast.error('Request failed') }
  }

  const handleEditTemplate = (t: Template) => {
    setEditingTemplate(t)
    setTemplateForm({ name: t.name, description: t.description || '', body: t.body, category: t.category, isActive: t.isActive, sortOrder: t.sortOrder })
    setShowTemplateForm(true)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    try {
      const res = await fetch(`/api/admin/whatsapp?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Template deleted'); fetchTemplates() }
      else toast.error('Delete failed')
    } catch { toast.error('Request failed') }
  }

  const handleToggleTemplate = async (t: Template) => {
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
      })
      if (res.ok) fetchTemplates()
      else toast.error('Toggle failed')
    } catch { toast.error('Request failed') }
  }

  // ─── Compose & Send ────────────────────────────────────────────────────────

  const renderPreview = (): string => {
    if (customMessage) return customMessage
    const tpl = templates.find(t => t.id === selectedTemplateId)
    if (!tpl) return ''
    let preview = tpl.body
    const selectedLead = leads.find(l => l.id === selectedLeadId)
    preview = preview.replace(/\{\{name\}\}/gi, selectedLead?.name || 'John')
    preview = preview.replace(/\{\{phone\}\}/gi, selectedLead?.phone || '+8801XXXXXXXXX')
    preview = preview.replace(/\{\{project\}\}/gi, selectedLead?.project?.name || 'Project Name')
    preview = preview.replace(/\{\{company\}\}/gi, 'Matrica')
    preview = preview.replace(/\{\{date\}\}/gi, new Date().toLocaleDateString())
    preview = preview.replace(/\{\{time\}\}/gi, new Date().toLocaleTimeString())
    return preview
  }

  const handleSend = async () => {
    const recipient = composePhone || selectedLeadId
    if (!recipient && selectedLeadIds.length === 0) {
      toast.error('Please provide a recipient')
      return
    }
    if (!selectedTemplateId && !customMessage) {
      toast.error('Please select a template or write a message')
      return
    }

    setSending(true)
    try {
      const payload: Record<string, unknown> = {
        action: 'send',
        templateId: selectedTemplateId || undefined,
        message: customMessage || undefined,
      }

      if (multiMode && selectedLeadIds.length > 0) {
        payload.leadIds = selectedLeadIds
      } else if (selectedLeadId) {
        payload.leadId = selectedLeadId
      } else {
        payload.to = composePhone
      }

      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (data.sent !== undefined) toast.success(`Sent: ${data.sent}, Failed: ${data.failed}`)
        else toast.success('Message sent')
        setComposePhone(''); setSelectedLeadId(''); setSelectedLeadIds([]); setSelectedTemplateId(''); setCustomMessage('')
        fetchMessages(1, statusFilter); fetchStats(); fetchRecent()
      } else {
        toast.error(data.error || 'Send failed')
      }
    } catch { toast.error('Request failed') } finally { setSending(false) }
  }

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const filteredLeads = leads.filter(l =>
    !leadSearch || l.name.toLowerCase().includes(leadSearch.toLowerCase()) || l.phone.includes(leadSearch)
  )

  const formatTime = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const statusBadge = (status: string) => {
    const cls = status === 'sent'
      ? 'bg-emerald-500/15 text-emerald-400'
      : status === 'failed'
        ? 'bg-red-500/15 text-red-400'
        : 'bg-amber-500/15 text-amber-400'
    return <span className={`badge-status ${cls}`}>{status}</span>
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            WhatsApp Automation
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage templates, send messages, and track delivery</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t
                ? 'bg-slate-800 text-white shadow-lg shadow-black/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {t === 'Overview' && <BarChart3 className="w-4 h-4" />}
            {t === 'Templates' && <LayoutTemplate className="w-4 h-4" />}
            {t === 'Send & History' && <MessageSquare className="w-4 h-4" />}
            {t}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Overview                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Sent', value: stats?.totalSent ?? 0, icon: CheckCircle2, color: 'emerald' },
              { label: "Today's Sent", value: stats?.todaySent ?? 0, icon: Zap, color: 'amber' },
              { label: 'Failed', value: stats?.totalFailed ?? 0, icon: XCircle, color: 'red' },
              { label: 'Templates', value: stats?.templateCount ?? 0, icon: LayoutTemplate, color: 'cyan' },
            ].map(kpi => (
              <div key={kpi.label} className="admin-card p-5 stat-card group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm font-medium">{kpi.label}</span>
                  <kpi.icon className={`w-5 h-5 text-${kpi.color}-400/60 group-hover:text-${kpi.color}-400 transition-colors`} />
                </div>
                <p className="text-3xl font-bold text-white">
                  {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-500" /> : kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setTab('Send & History')} className="btn-admin btn-admin-primary">
              <Send className="w-4 h-4" /> Send Message
            </button>
            <button onClick={() => { setTab('Templates'); setShowTemplateForm(true) }} className="btn-admin btn-admin-secondary">
              <Plus className="w-4 h-4" /> Create Template
            </button>
            <button onClick={() => { fetchStats(); fetchRecent() }} className="btn-admin btn-admin-secondary">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Recent Messages */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Recent Messages
            </h3>
            {recentMessages.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No messages yet. Send your first WhatsApp message!</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {recentMessages.map(msg => (
                  <div key={msg.id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-900/40 border border-slate-800/40 hover:border-slate-700/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-white text-sm font-medium">{msg.to}</span>
                        {msg.lead && <span className="text-slate-500 text-xs">• {msg.lead.name}</span>}
                      </div>
                      <p className="text-slate-400 text-xs truncate">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {statusBadge(msg.status)}
                      <span className="text-slate-600 text-xs">{formatTime(msg.sentAt || msg.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Templates                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'Templates' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
            <button
              onClick={() => { resetTemplateForm(); setShowTemplateForm(true) }}
              className="btn-admin btn-admin-primary"
            >
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>

          {/* Template Form */}
          {showTemplateForm && (
            <div className="admin-card p-6 border-emerald-500/20">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
                <button onClick={resetTemplateForm} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">Template Name *</label>
                  <input className="admin-input" value={templateForm.name} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Welcome Message" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">Category</label>
                  <select className="admin-select" value={templateForm.category} onChange={e => setTemplateForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Description</label>
                <input className="admin-input" value={templateForm.description} onChange={e => setTemplateForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
              </div>
              <div className="mb-4">
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Body *</label>
                <textarea className="admin-input min-h-[120px] resize-y" value={templateForm.body} onChange={e => setTemplateForm(p => ({ ...p, body: e.target.value }))} placeholder="Hello {{name}}, thank you for your interest in {{project}}..." />
                <p className="text-slate-500 text-xs mt-2">
                  Available variables:{' '}
                  {VARIABLE_HINTS.map(v => (
                    <span key={v} className="inline-block bg-slate-800 text-emerald-400 text-xs px-1.5 py-0.5 rounded mr-1 mb-1 font-mono">{v}</span>
                  ))}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setTemplateForm(p => ({ ...p, isActive: !p.isActive }))} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  {templateForm.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                  {templateForm.isActive ? 'Active' : 'Inactive'}
                </button>
                <div className="flex gap-2">
                  <button onClick={resetTemplateForm} className="btn-admin btn-admin-secondary">Cancel</button>
                  <button onClick={handleSaveTemplate} className="btn-admin btn-admin-primary">{editingTemplate ? 'Update' : 'Create'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Template List */}
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : templates.length === 0 ? (
            <div className="admin-card p-8 text-center">
              <LayoutTemplate className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No templates yet</p>
              <p className="text-slate-500 text-sm mt-1">Create your first WhatsApp template</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {templates.map(tpl => (
                <div key={tpl.id} className="admin-card p-4 group hover:border-slate-600/40 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-white font-medium text-sm">{tpl.name}</span>
                        <span className="badge-status bg-cyan-500/15 text-cyan-400">{tpl.category}</span>
                        {tpl.isActive ? (
                          <span className="badge-status badge-active">Active</span>
                        ) : (
                          <span className="badge-status badge-inactive">Inactive</span>
                        )}
                      </div>
                      {tpl.description && <p className="text-slate-500 text-xs mb-1.5">{tpl.description}</p>}
                      <p className="text-slate-400 text-xs truncate font-mono">{tpl.body.substring(0, 100)}{tpl.body.length > 100 ? '...' : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleToggleTemplate(tpl)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors" title="Toggle active">
                        {tpl.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleEditTemplate(tpl)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Send & History                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'Send & History' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ─── Compose Panel ─────────────────────────────────────────────── */}
          <div className="admin-card p-5 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" /> Compose Message
            </h3>

            {/* Template Select */}
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">Template</label>
              <select className="admin-select" value={selectedTemplateId} onChange={e => { setSelectedTemplateId(e.target.value); if (e.target.value) setCustomMessage('') }}>
                <option value="">— Select a template —</option>
                {templates.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Custom Message */}
            {!selectedTemplateId && (
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Or write a custom message</label>
                <textarea className="admin-input min-h-[80px] resize-y" value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Type your message here..." />
              </div>
            )}

            {/* Multi-Mode Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-slate-400 text-xs font-medium">Select Multiple Leads</label>
              <button onClick={() => { setMultiMode(!multiMode); setSelectedLeadIds([]); setSelectedLeadId('') }} className="flex items-center gap-2 text-sm">
                {multiMode ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                <span className={multiMode ? 'text-emerald-400' : 'text-slate-500'}>{multiMode ? 'On' : 'Off'}</span>
              </button>
            </div>

            {/* Recipient Selection */}
            {!multiMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">Phone Number</label>
                  <input className="admin-input" value={composePhone} onChange={e => { setComposePhone(e.target.value); setSelectedLeadId('') }} placeholder="+8801XXXXXXXXX" />
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-xs">
                  <span className="h-px flex-1 bg-slate-800" /> OR <span className="h-px flex-1 bg-slate-800" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">Select Lead</label>
                  <select className="admin-select" value={selectedLeadId} onChange={e => { setSelectedLeadId(e.target.value); if (e.target.value) setComposePhone('') }}>
                    <option value="">— Select a lead —</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} • {l.phone}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input className="admin-input pl-9" value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Search leads..." />
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 border border-slate-800/40 rounded-lg p-2">
                  {filteredLeads.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-4">No leads found</p>
                  ) : (
                    filteredLeads.map(l => (
                      <label key={l.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-800/60 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(l.id)}
                          onChange={() => toggleLeadSelection(l.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20 accent-emerald-500"
                        />
                        <div className="min-w-0">
                          <span className="text-white text-sm">{l.name}</span>
                          <span className="text-slate-500 text-xs ml-2">{l.phone}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {selectedLeadIds.length > 0 && (
                  <p className="text-emerald-400 text-xs mt-2 font-medium">{selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected</p>
                )}
              </div>
            )}

            {/* Preview */}
            {renderPreview() && (
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Preview</label>
                <div className="bg-slate-900/60 border border-slate-800/40 rounded-lg p-3 text-slate-300 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                  {renderPreview()}
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-admin btn-admin-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
            </button>
          </div>

          {/* ─── Message History ──────────────────────────────────────────── */}
          <div className="admin-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" /> Message History
              </h3>
              <div className="flex items-center gap-2">
                <select className="admin-select !w-auto !py-1.5 text-xs" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setMessagePage(1) }}>
                  <option value="">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
                <button onClick={() => fetchMessages(messagePage, statusFilter)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loadingMessages ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
            ) : allMessages.length === 0 ? (
              <p className="text-slate-500 text-sm py-12 text-center">No messages found</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800/60">
                        <th className="text-left text-slate-400 font-medium py-2.5 px-2 text-xs">To</th>
                        <th className="text-left text-slate-400 font-medium py-2.5 px-2 text-xs hidden sm:table-cell">Lead</th>
                        <th className="text-left text-slate-400 font-medium py-2.5 px-2 text-xs hidden md:table-cell">Template</th>
                        <th className="text-left text-slate-400 font-medium py-2.5 px-2 text-xs">Status</th>
                        <th className="text-left text-slate-400 font-medium py-2.5 px-2 text-xs">Date</th>
                      </tr>
                    </thead>
                    <tbody className="max-h-96 overflow-y-auto">
                      {allMessages.map(msg => (
                        <tr key={msg.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                          <td className="py-2.5 px-2 text-white font-mono text-xs">{msg.to}</td>
                          <td className="py-2.5 px-2 text-slate-300 text-xs hidden sm:table-cell">{msg.lead?.name || '—'}</td>
                          <td className="py-2.5 px-2 text-slate-400 text-xs hidden md:table-cell">{msg.template?.name || 'Custom'}</td>
                          <td className="py-2.5 px-2">{statusBadge(msg.status)}</td>
                          <td className="py-2.5 px-2 text-slate-500 text-xs whitespace-nowrap">{formatTime(msg.sentAt || msg.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {messageTotal > 50 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/40">
                    <span className="text-slate-500 text-xs">{messageTotal} total</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMessagePage(p => Math.max(1, p - 1))}
                        disabled={messagePage <= 1}
                        className="btn-admin btn-admin-secondary !py-1 !px-3 text-xs disabled:opacity-30"
                      >
                        Previous
                      </button>
                      <span className="text-slate-400 text-xs flex items-center px-2">{messagePage} / {Math.ceil(messageTotal / 50)}</span>
                      <button
                        onClick={() => setMessagePage(p => p + 1)}
                        disabled={messagePage >= Math.ceil(messageTotal / 50)}
                        className="btn-admin btn-admin-secondary !py-1 !px-3 text-xs disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}