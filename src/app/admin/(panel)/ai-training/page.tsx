'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  GraduationCap, BookOpen, MessageSquare, User,
  Plus, Edit2, Trash2, ChevronUp, ChevronDown,
  Loader2, Power, PowerOff, Send, Save, Bot,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ─── Types ─────────────────────────────────────────────────────────
interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: string | null
  enabled: boolean
  sortOrder: number
}

interface PersonaForm {
  chat_persona_name: string
  chat_persona_role: string
  chat_persona_style: string
  chat_persona_language: string
  chat_greeting: string
  chat_human_mode: string
  chat_handoff_number: string
}

const defaultPersona: PersonaForm = {
  chat_persona_name: 'Ayesha',
  chat_persona_role: 'Sales Consultant',
  chat_persona_style: '',
  chat_persona_language: 'mixed',
  chat_greeting: '',
  chat_human_mode: 'true',
  chat_handoff_number: '',
}

interface KnowledgeForm {
  title: string
  content: string
  category: string
  enabled: boolean
}

const emptyKnowledgeForm: KnowledgeForm = {
  title: '',
  content: '',
  category: '',
  enabled: true,
}

interface TestMessage {
  id: number
  text: string
  isBot: boolean
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function AiTrainingPage() {
  // Persona state
  const [persona, setPersona] = useState<PersonaForm>(defaultPersona)
  const [personaLoading, setPersonaLoading] = useState(true)
  const [personaSaving, setPersonaSaving] = useState(false)

  // Knowledge state
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<KnowledgeForm>(emptyKnowledgeForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Test chat state
  const [testMessages, setTestMessages] = useState<TestMessage[]>([])
  const [testInput, setTestInput] = useState('')
  const [testSending, setTestSending] = useState(false)
  const testEndRef = useRef<HTMLDivElement>(null)
  const testNextId = useRef(0)

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [testMessages, testSending])

  // ─── Persona load / save ─────────────────────────────────────────
  // Persona is served by /api/admin/ai-training (the 'ai' module), NOT
  // /api/admin/settings — admins with AI access but without the 'settings'
  // permission must still be able to manage the chat persona.
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/ai-training')
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data = await res.json()
        const loaded: Record<string, string | null> = data.persona || {}
        setPersona((p) => {
          const next = { ...p }
          for (const key of Object.keys(defaultPersona) as (keyof PersonaForm)[]) {
            if (loaded[key]) next[key] = loaded[key] as string
          }
          return next
        })
      } catch {
        toast.error('Failed to load persona settings')
      } finally {
        setPersonaLoading(false)
      }
    }
    load()
  }, [])

  const savePersona = async () => {
    setPersonaSaving(true)
    try {
      const res = await fetch('/api/admin/ai-training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      })
      const data = await res.json()
      if (res.ok && data.success) toast.success('Persona saved')
      else toast.error(data.error || 'Failed to save persona')
    } catch {
      toast.error('Request failed')
    }
    setPersonaSaving(false)
  }

  // ─── Knowledge CRUD ───────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-training')
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = await res.json()
      setEntries(data.entries || [])
    } catch {
      toast.error('Failed to load knowledge base')
    } finally {
      setEntriesLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyKnowledgeForm)
    setDialogOpen(true)
  }

  const openEditDialog = (entry: KnowledgeEntry) => {
    setEditingId(entry.id)
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category || '',
      enabled: entry.enabled,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.content.trim()) { toast.error('Content is required'); return }

    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId
        ? { id: editingId, ...form }
        : { ...form, sortOrder: entries.length > 0 ? Math.max(...entries.map(e => e.sortOrder)) + 1 : 0 }
      const res = await fetch('/api/admin/ai-training', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingId ? 'Knowledge entry updated' : 'Knowledge entry added')
        setDialogOpen(false)
        fetchEntries()
      } else {
        toast.error('Operation failed')
      }
    } catch {
      toast.error('Request failed')
    }
    setSaving(false)
  }

  const handleToggle = async (entry: KnowledgeEntry) => {
    try {
      const res = await fetch('/api/admin/ai-training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, enabled: !entry.enabled }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(entry.enabled ? 'Entry disabled' : 'Entry enabled')
        fetchEntries()
      }
    } catch {
      toast.error('Failed to toggle')
    }
  }

  const handleReorder = async (entry: KnowledgeEntry, direction: 'up' | 'down') => {
    const idx = entries.findIndex(e => e.id === entry.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= entries.length) return

    // Clone the rows before changing sortOrder — never mutate objects held in state
    const a = { ...entries[idx] }
    const b = { ...entries[swapIdx] }
    // Swap sortOrder values; if they collide (e.g. both default 0), use positions
    if (a.sortOrder === b.sortOrder) {
      a.sortOrder = swapIdx
      b.sortOrder = idx
    } else {
      const temp = a.sortOrder
      a.sortOrder = b.sortOrder
      b.sortOrder = temp
    }

    try {
      await Promise.all([
        fetch('/api/admin/ai-training', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: a.id, sortOrder: a.sortOrder }),
        }),
        fetch('/api/admin/ai-training', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: b.id, sortOrder: b.sortOrder }),
        }),
      ])
      fetchEntries()
    } catch {
      toast.error('Failed to reorder')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch('/api/admin/ai-training', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Knowledge entry deleted')
        setDeletingId(null)
        fetchEntries()
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  // ─── Test chat ────────────────────────────────────────────────────
  const sendTestMessage = async () => {
    const text = testInput.trim()
    if (!text || testSending) return
    setTestInput('')
    const history = testMessages.slice(-10).map((m) => ({
      role: m.isBot ? 'assistant' : 'user',
      content: m.text,
    }))
    setTestMessages((prev) => [...prev, { id: testNextId.current++, text, isBot: false }])
    setTestSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      setTestMessages((prev) => [...prev, {
        id: testNextId.current++,
        text: data.reply || data.error || 'No reply',
        isBot: true,
      }])
    } catch {
      setTestMessages((prev) => [...prev, { id: testNextId.current++, text: 'Request failed', isBot: true }])
    }
    setTestSending(false)
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E6B3A]/15 border border-[#1E6B3A]/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#34D399]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Training</h1>
            <p className="text-sm text-slate-400">Teach the public chat assistant to talk like a real agent</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-6">
          {/* ─── Section 1: Persona ────────────────────────────── */}
          <div className="admin-card p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <User className="w-4 h-4 text-[#34D399]" />
              <h2 className="text-base font-semibold text-white">Persona</h2>
            </div>

            {personaLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-[#34D399] animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Agent Name</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Ayesha"
                      value={persona.chat_persona_name}
                      onChange={(e) => setPersona(p => ({ ...p, chat_persona_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Role / Title</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Sales Consultant"
                      value={persona.chat_persona_role}
                      onChange={(e) => setPersona(p => ({ ...p, chat_persona_role: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Personality & Instructions <span className="text-slate-600">(free text)</span></label>
                  <textarea
                    className="admin-input min-h-[90px] resize-y"
                    placeholder="e.g. Friendly and down-to-earth. Loves helping first-time land buyers feel at ease. Uses simple words, avoids jargon."
                    value={persona.chat_persona_style}
                    onChange={(e) => setPersona(p => ({ ...p, chat_persona_style: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Language</label>
                    <select
                      className="admin-input"
                      value={persona.chat_persona_language}
                      onChange={(e) => setPersona(p => ({ ...p, chat_persona_language: e.target.value }))}
                    >
                      <option value="mixed">Mixed (mirror the visitor)</option>
                      <option value="english">English</option>
                      <option value="bangla">Bangla</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Handoff WhatsApp Number <span className="text-slate-600">(empty = site default)</span></label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="+8801XXXXXXXXX"
                      value={persona.chat_handoff_number}
                      onChange={(e) => setPersona(p => ({ ...p, chat_handoff_number: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Greeting Message <span className="text-slate-600">(first message in the widget)</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Hi! I'm Ayesha from MATRICA. How can I help you today?"
                    value={persona.chat_greeting}
                    onChange={(e) => setPersona(p => ({ ...p, chat_greeting: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPersona(p => ({ ...p, chat_human_mode: p.chat_human_mode === 'true' ? 'false' : 'true' }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${persona.chat_human_mode === 'true' ? 'bg-[#1E6B3A]' : 'bg-slate-600'}`}
                      aria-label="Toggle human mode"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${persona.chat_human_mode === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <div>
                      <span className="text-xs text-slate-300 block">Human mode</span>
                      <span className="text-[11px] text-slate-500">Short casual replies, admits when unsure, offers WhatsApp handoff</span>
                    </div>
                  </div>
                  <button onClick={savePersona} disabled={personaSaving} className="btn-admin btn-admin-primary text-sm">
                    {personaSaving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Persona</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Section 2: Knowledge Base ─────────────────────── */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#34D399]" />
                <h2 className="text-base font-semibold text-white">Knowledge Base</h2>
              </div>
              <button onClick={openAddDialog} className="btn-admin btn-admin-primary text-sm">
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </div>

            {entriesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-[#34D399] animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-7 h-7 text-slate-600" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">No knowledge entries yet</h3>
                <p className="text-xs text-slate-400 mb-4">Add facts, FAQs, or talking points the AI should know.</p>
                <button onClick={openAddDialog} className="btn-admin btn-admin-primary text-sm">
                  <Plus className="w-4 h-4" /> Add Entry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`bg-slate-900 border rounded-xl p-4 transition-all ${
                      entry.enabled
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-slate-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-white truncate">{entry.title}</h3>
                          {entry.category && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1E6B3A]/15 text-[#34D399] border border-[#1E6B3A]/20">
                              {entry.category}
                            </span>
                          )}
                          {!entry.enabled && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-500 border border-slate-700/50">
                              Off
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{entry.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono shrink-0">#{entry.sortOrder}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReorder(entry, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReorder(entry, 'down')}
                          disabled={idx === entries.length - 1}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-slate-800 mx-1" />
                        <button
                          onClick={() => handleToggle(entry)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            entry.enabled
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                          }`}
                          title={entry.enabled ? 'Disable' : 'Enable'}
                        >
                          {entry.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditDialog(entry)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(entry.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Section 3: Test Chat ────────────────────────────── */}
        <div className="admin-card p-0 overflow-hidden flex flex-col xl:sticky xl:top-6" style={{ height: '560px' }}>
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800">
            <MessageSquare className="w-4 h-4 text-[#34D399]" />
            <div>
              <h2 className="text-base font-semibold text-white leading-tight">Test Chat</h2>
              <p className="text-[11px] text-slate-500">Try the persona live — uses the real /api/chat</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {testMessages.length === 0 && (
              <div className="text-center py-10">
                <Bot className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Send a message to test how {persona.chat_persona_name || 'the agent'} replies.</p>
              </div>
            )}
            {testMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.isBot
                      ? 'bg-slate-800 text-slate-200 rounded-bl-md border border-slate-700/50'
                      : 'bg-[#1E6B3A] text-white rounded-br-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {testSending && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 border border-slate-700/50">
                  <span className="w-2 h-2 rounded-full bg-[#34D399]/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#34D399]/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#34D399]/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={testEndRef} />
          </div>

          <div className="border-t border-slate-800 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendTestMessage()
                  }
                }}
                placeholder="Ask something as a visitor..."
                className="admin-input flex-1"
              />
              <button
                onClick={sendTestMessage}
                disabled={!testInput.trim() || testSending}
                className="w-9 h-9 rounded-lg bg-[#1E6B3A] text-white flex items-center justify-center hover:bg-[#1E6B3A]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                aria-label="Send test message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Add / Edit Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[520px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-white text-lg">
              {editingId ? 'Edit Knowledge Entry' : 'Add Knowledge Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-4 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Title / Topic <span className="text-red-400">*</span></label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Plot handover timeline"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Content <span className="text-red-400">*</span></label>
              <textarea
                className="admin-input min-h-[120px] resize-y"
                placeholder="What the AI should know or how it should answer this topic..."
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Category <span className="text-slate-600">(optional)</span></label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Pricing, Legal, Location"
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled ? 'bg-[#1E6B3A]' : 'bg-slate-600'}`}
                    aria-label={form.enabled ? 'Disable' : 'Enable'}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-xs text-slate-300">Enabled</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setDialogOpen(false)} className="btn-admin btn-admin-secondary text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-admin btn-admin-primary text-sm">
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : editingId ? (
                  'Update Entry'
                ) : (
                  'Add Entry'
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
            <DialogTitle className="text-white text-lg">Delete Knowledge Entry</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <p className="text-sm text-slate-300 mb-6">
              Are you sure you want to delete this entry? The AI will no longer know this information.
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
