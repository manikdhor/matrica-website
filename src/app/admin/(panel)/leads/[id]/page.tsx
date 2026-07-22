'use client'

import React, { useState, useEffect } from 'react'
import { useFieldOptions } from '@/hooks/useFieldOptions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  User,
  MessageSquare,
  Send,
  Trash2,
  Pencil,
  Shield,
  Activity,
  FileText,
  Tag,
  ChevronRight,
  AlertCircle,
  Monitor,
  Globe2,
  Plus,
  X,
  Check,
  Search,
  CalendarCheck,
  List,
  Calendar,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Target,
  Brain,
  RefreshCw,
} from 'lucide-react'
import { useRef, useEffect as useEff } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import LeadFollowUpCalendar from '@/components/LeadFollowUpCalendar'
import AILeadAssistant from '@/components/AILeadAssistant'
import { toast } from 'sonner'
import { resolveLeadAccess, type LeadAccess } from '@/lib/permissions'

interface LeadTagAssignment {
  id: string
  tagId: string
  tagName: string
  tagColor: string
  assignedAt: string
}

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  source: string
  projectId: string | null
  project: { name: string } | null
  message: string | null
  status: string
  priority: string
  score: number
  assignedTo: string | null
  formContext: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  updatedAt: string
  notes: Note[]
  activities: Activity[]
  tags: { id: string; tagId: string; tag: { id: string; name: string; color: string }; createdAt: string }[]
  aiScore: number | null
  aiInsights: string | null
  aiNextAction: string | null
  aiAnalyzedAt: string | null
}

interface Note {
  id: string
  content: string
  createdBy: string | null
  createdAt: string
}

interface Activity {
  id: string
  type: string
  description: string
  oldStatus: string | null
  newStatus: string | null
  createdBy: string | null
  createdAt: string
}

interface FollowUp {
  id: string
  leadId: string
  type: string
  dueDate: string
  dueTime: string | null
  note: string | null
  status: string
  completedAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  isOverdue?: boolean
}

const FOLLOW_UP_TYPES: Record<string, { label: string; color: string; icon: typeof Phone }> = {
  call: { label: 'Call', color: '#3B82F6', icon: Phone },
  email: { label: 'Email', color: '#8B5CF6', icon: Mail },
  meeting: { label: 'Meeting', color: '#F59E0B', icon: CalendarCheck },
  whatsapp: { label: 'WhatsApp', color: '#10B981', icon: MessageSquare },
  other: { label: 'Other', color: '#64748B', icon: MessageSquare },
}

// STATUSES and STATUS_LABELS are now loaded dynamically via useFieldOptions hook

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  created: <User className="w-3.5 h-3.5 text-blue-400" />,
  status_change: <Activity className="w-3.5 h-3.5 text-amber-400" />,
  note_added: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
  note: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
  updated: <Pencil className="w-3.5 h-3.5 text-purple-400" />,
  bulk_update: <Shield className="w-3.5 h-3.5 text-cyan-400" />,
  follow_up: <MessageCircle className="w-3.5 h-3.5 text-amber-400" />,
  email_sent: <Mail className="w-3.5 h-3.5 text-violet-400" />,
}

const ACTIVITY_COLORS: Record<string, string> = {
  status_change: '#3B82F6',
  note: '#10B981',
  note_added: '#10B981',
  follow_up: '#F59E0B',
  created: '#34D399',
}

function getActivityColor(type: string): string {
  return ACTIVITY_COLORS[type] || '#64748B'
}

function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    created: 'Created',
    status_change: 'Status Change',
    note: 'Note',
    note_added: 'Note Added',
    follow_up: 'Follow Up',
    updated: 'Updated',
    bulk_update: 'Bulk Update',
    email_sent: 'Email Sent',
  }
  return labels[type] || type.replace(/_/g, ' ')
}

function formatTimelineTime(d: string): string {
  const date = new Date(d)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getScoreColor(score: number): string {
  if (score >= 81) return '#34D399'
  if (score >= 61) return '#3B82F6'
  if (score >= 31) return '#F59E0B'
  return '#EF4444'
}

function getScoreLabel(score: number): string {
  if (score >= 81) return 'Hot Lead'
  if (score >= 61) return 'Warm Lead'
  if (score >= 31) return 'Cool Lead'
  return 'Cold Lead'
}

function getScoreFactors(lead: Lead): { label: string; points: number; active: boolean }[] {
  return [
    { label: 'Has Email', points: 10, active: !!lead.email },
    { label: 'From Website', points: 5, active: lead.source === 'website' },
    { label: 'Project Selected', points: 10, active: !!lead.projectId },
    { label: 'Has Message', points: 5, active: !!lead.message && lead.message.trim().length > 0 },
  ]
}

function getAIScoreColor(score: number): string {
  if (score >= 70) return '#34D399'
  if (score >= 40) return '#FBBF24'
  return '#F87171'
}

function AIScoreGauge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
        <span className="text-[8px] text-slate-600 text-center leading-tight">Not<br/>scored</span>
      </div>
    )
  }

  const color = getAIScoreColor(score)
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const offset = circumference - progress

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(51,65,85,0.4)" strokeWidth="3.5" />
      <circle
        cx="24" cy="24" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
      />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="central" className="fill-white text-[13px] font-bold" style={{ transform: 'rotate(90deg)', transformOrigin: '24px 24px' }}>
        {score}
      </text>
    </svg>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const { getValues, getLabel } = useFieldOptions()
  const STATUSES = getValues('lead_statuses')
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ type: 'call', dueDate: '', dueTime: '', note: '' })
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [followUpView, setFollowUpView] = useState<'list' | 'calendar'>('list')
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', priority: 'medium', score: 0, assignedTo: '', message: '' })
  const [showTemplates, setShowTemplates] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [agents, setAgents] = useState<{ id: string; name: string; username: string }[]>([])
  const [showEmail, setShowEmail] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiScoring, setAiScoring] = useState(false)

  // Capability-based UI gating (sales = own leads, status/remarks only).
  // Server enforces everything; this just hides controls that would 403.
  // Defaults to full access so admins never flash a stripped UI.
  const [access, setAccess] = useState<LeadAccess>({ scope: 'all', canEdit: true, canStatus: true, canAssign: true })
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('admin-auth-user')
      if (raw) {
        const a = resolveLeadAccess(JSON.parse(raw))
        if (a) setAccess(a)
      }
    } catch { /* keep default */ }
  }, [])

  // Tags state
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string; leadCount: number }[]>([])
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6366F1')
  const [tagLoading, setTagLoading] = useState(false)
  const tagDropdownRef = useRef<HTMLDivElement>(null)

  const PRESET_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

  const leadTags = (lead?.tags || []).map((t: any) => ({
    assignmentId: t.id,
    tagId: t.tag.id,
    tagName: t.tag.name,
    tagColor: t.tag.color,
  }))

  const assignedTagIds = new Set(leadTags.map((t) => t.tagId))
  const availableTags = allTags.filter((t) => !assignedTagIds.has(t.id))
  const filteredAvailable = tagSearch
    ? availableTags.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : availableTags

  const fetchAllTags = async () => {
    try {
      const res = await fetch('/api/admin/leads/tags')
      const data = await res.json()
      if (Array.isArray(data)) setAllTags(data)
    } catch { /* ignore */ }
  }

  const removeTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Tag removed')
        fetchLead()
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch { toast.error('Failed to remove tag') }
  }

  const assignTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Tag assigned')
        fetchLead()
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch { toast.error('Failed to assign tag') }
  }

  const createAndAssignTag = async () => {
    if (!newTagName.trim()) return
    setTagLoading(true)
    try {
      const res = await fetch('/api/admin/leads/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      })
      const data = await res.json()
      if (data.success && data.tag) {
        await assignTag(data.tag.id)
        setNewTagName('')
        setNewTagColor('#6366F1')
        setShowNewTag(false)
        fetchAllTags()
      } else {
        toast.error(data.error || 'Failed to create tag')
      }
    } catch { toast.error('Failed to create tag') }
    setTagLoading(false)
  }

  useEff(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false)
        setShowNewTag(false)
        setTagSearch('')
      }
    }
    if (showTagDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTagDropdown])

  const fetchFollowUps = async () => {
    try {
      const res = await fetch(`/api/admin/leads/${id}/follow-ups`)
      const data = await res.json()
      if (Array.isArray(data)) setFollowUps(data)
    } catch { /* ignore */ }
  }

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`)
      const data = await res.json()
      if (data.error) { router.push('/admin/leads'); return }
      setLead(data)
      setEditForm({
        name: data.name, phone: data.phone, email: data.email || '',
        priority: data.priority || 'medium', score: data.score || 0,
        assignedTo: data.assignedTo || '', message: data.message || '',
      })
    } catch { toast.error('Failed to load lead') }
    setLoading(false)
  }

  useEffect(() => {
    fetchLead()
    fetchFollowUps()
  }, [id])

  useEffect(() => {
    fetch('/api/admin/leads/agents')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.agents)) setAgents(d.agents) })
      .catch(() => {})
  }, [])

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) { toast.error('Subject and message required'); return }
    setEmailSending(true)
    try {
      const res = await fetch('/api/admin/leads/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id, subject: emailSubject.trim(), message: emailMessage.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Email sent')
        setShowEmail(false)
        setEmailSubject('')
        setEmailMessage('')
        fetchLead()
      } else {
        toast.error(data.error || 'Email send failed')
      }
    } catch { toast.error('Email send failed') }
    setEmailSending(false)
  }

  const createFollowUp = async () => {
    if (!scheduleForm.dueDate) return
    setFollowUpLoading(true)
    try {
      const res = await fetch(`/api/admin/leads/${id}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Follow-up scheduled')
        setShowScheduleDialog(false)
        setScheduleForm({ type: 'call', dueDate: '', dueTime: '', note: '' })
        fetchFollowUps()
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch { toast.error('Failed to schedule follow-up') }
    setFollowUpLoading(false)
  }

  const markComplete = async (fuId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/follow-ups/${fuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Follow-up completed')
        fetchFollowUps()
      }
    } catch { toast.error('Failed to complete') }
  }

  const deleteFollowUp = async (fuId: string) => {
    try {
      const res = await fetch(`/api/admin/leads/follow-ups/${fuId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Follow-up deleted')
        fetchFollowUps()
      }
    } catch { toast.error('Failed to delete') }
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    try {
      const res = await fetch(`/api/admin/leads/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText }),
      })
      const data = await res.json()
      if (data.success) {
        setNoteText('')
        toast.success('Note added')
        fetchLead()
      }
    } catch { toast.error('Failed to add note') }
  }

  const changeStatus = async (newStatus: string) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Status changed to ${getLabel('lead_statuses', newStatus)}`)
        setShowStatusChange(false)
        fetchLead()
      }
    } catch { toast.error('Failed to change status') }
    setSubmitting(false)
  }

  const saveEdit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Lead updated')
        setShowEdit(false)
        fetchLead()
      }
    } catch { toast.error('Failed to update') }
    setSubmitting(false)
  }

  const scoreWithAI = async () => {
    if (!lead) return
    setAiScoring(true)
    try {
      const res = await fetch('/api/admin/ai/bulk-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [lead.id] }),
      })
      const data = await res.json()
      if (data.success || data.scored) {
        toast.success('AI scoring complete')
        fetchLead()
      } else {
        toast.error(data.error || 'AI scoring failed')
      }
    } catch {
      toast.error('AI scoring failed')
    }
    setAiScoring(false)
  }

  const deleteLead = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Lead deleted')
        router.push('/admin/leads')
      }
    } catch { toast.error('Failed to delete') }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="admin-card h-48" />
          <div className="admin-card h-48" />
        </div>
      </div>
    )
  }

  if (!lead) return null

  const currentStatusIdx = STATUSES.indexOf(lead.status)
  let formCtx = null
  if (lead.formContext) {
    try { formCtx = JSON.parse(lead.formContext) } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/leads" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
              <span className={`badge-status badge-${lead.status}`}>{getLabel('lead_statuses', lead.status) || lead.status}</span>
              <span className={`badge-status badge-${lead.priority}`}>{lead.priority}</span>
              {lead.aiScore !== null && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: `${getAIScoreColor(lead.aiScore)}18`,
                    color: getAIScoreColor(lead.aiScore),
                    border: `1px solid ${getAIScoreColor(lead.aiScore)}30`,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  AI: {lead.aiScore}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Created {formatDate(lead.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {access.canEdit && (
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#1E6B3A' }}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Assistant
          </button>
          )}
          {access.canStatus && (
          <button onClick={() => setShowStatusChange(true)} className="btn-admin btn-admin-secondary text-sm">
            <Activity className="w-4 h-4" /> Change Status
          </button>
          )}
          {access.canEdit && (
          <button onClick={() => setShowEdit(true)} className="btn-admin btn-admin-secondary text-sm">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          )}
          {access.canEdit && (
          <button onClick={() => setShowDelete(true)} className="btn-admin btn-admin-danger text-sm">
            <Trash2 className="w-4 h-4" />
          </button>
          )}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="admin-card p-4 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[600px]">
          {STATUSES.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => access.canStatus && s !== lead.status && changeStatus(s)}
                disabled={s === lead.status || !access.canStatus}
                className={`flex-1 text-center px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  i <= currentStatusIdx && lead.status !== 'lost'
                    ? 'bg-[#1E6B3A]/20 text-[#34D399] border border-[#1E6B3A]/30'
                    : i === STATUSES.indexOf('lost') && lead.status === 'lost'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-800/30 text-slate-500 border border-transparent hover:bg-slate-800 hover:text-slate-300 cursor-pointer'
                } ${s === lead.status ? 'ring-1 ring-[#1E6B3A]/50' : ''}`}
              >
                {getLabel('lead_statuses', s)}
              </button>
              {i < STATUSES.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-700 mx-1 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact Info */}
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" /> Contact Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={lead.name} />
            {/* Phone with Quick Call & WhatsApp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="w-4 h-4" />
                <span className="text-xs">Phone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-slate-300 mr-1">{lead.phone}</span>
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/50 transition-colors"
                  title="Quick Call"
                >
                  <Phone className="w-3 h-3" />
                  <span className="hidden sm:inline">Call</span>
                </a>
              </div>
            </div>

            {/* WhatsApp Quick Send */}
            <div className="pt-1">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: '#1E6B3A' }}
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
                {showTemplates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTemplates && (
                <div className="mt-2 p-3 bg-slate-800/70 rounded-lg border border-slate-700/50 space-y-2">
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Quick Templates</p>
                  {getWhatsAppTemplates(lead).map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const waUrl = `https://wa.me/${normalizePhoneForWhatsApp(lead.phone)}?text=${encodeURIComponent(tpl.text)}`
                        window.open(waUrl, '_blank')
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-xs text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors border border-transparent hover:border-slate-600/50"
                    >
                      <span className="block font-medium text-slate-200 mb-0.5">{tpl.label}</span>
                      <span className="block text-slate-400 leading-relaxed line-clamp-2">{tpl.text}</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-700/50 pt-2 mt-2">
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1.5">Custom Message</p>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-md bg-slate-900/80 border border-slate-700/50 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-[#1E6B3A] focus:ring-1 focus:ring-[#1E6B3A]/50 resize-none transition-colors"
                    />
                    <button
                      onClick={() => {
                        if (!customMessage.trim()) {
                          toast.error('Please enter a message')
                          return
                        }
                        const waUrl = `https://wa.me/${normalizePhoneForWhatsApp(lead.phone)}?text=${encodeURIComponent(customMessage.trim())}`
                        window.open(waUrl, '_blank')
                      }}
                      className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: '#1E6B3A' }}
                    >
                      <Send className="w-3 h-3" />
                      Send Custom Message
                    </button>
                  </div>
                </div>
              )}
            </div>

            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email || 'No email (optional)'} />

            {/* Email Quick Send (needs full leads-write on the server) */}
            {lead.email && access.canEdit && (
              <div className="pt-1">
                <button
                  onClick={() => setShowEmail(!showEmail)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-200 border border-slate-700/60 hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                  {showEmail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showEmail && (
                  <div className="mt-2 p-3 bg-slate-800/70 rounded-lg border border-slate-700/50 space-y-2">
                    <input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full px-3 py-2 rounded-md bg-slate-900/80 border border-slate-700/50 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-[#1E6B3A] focus:ring-1 focus:ring-[#1E6B3A]/50 transition-colors"
                    />
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Write your email..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-md bg-slate-900/80 border border-slate-700/50 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-[#1E6B3A] focus:ring-1 focus:ring-[#1E6B3A]/50 resize-none transition-colors"
                    />
                    <button
                      onClick={sendEmail}
                      disabled={emailSending || !emailSubject.trim() || !emailMessage.trim()}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#1E6B3A' }}
                    >
                      <Send className="w-3 h-3" />
                      {emailSending ? 'Sending...' : 'Send Email'}
                    </button>
                    <p className="text-[10px] text-slate-500">Requires SMTP configured in Settings.</p>
                  </div>
                )}
              </div>
            )}

            <InfoRow icon={<Globe className="w-4 h-4" />} label="Source" value={lead.source.replace(/_/g, ' ')} badge={`badge-${lead.source === 'manual' ? 'contacted' : 'new'}`} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Project" value={lead.project?.name || '—'} />
          </div>
        </div>

        {/* Lead Details */}
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" /> Lead Details
          </h3>
          <div className="space-y-3">
            <InfoRow icon={<Activity className="w-4 h-4" />} label="Status" value={getLabel('lead_statuses', lead.status) || lead.status} badge={`badge-${lead.status}`} />
            <InfoRow icon={<Shield className="w-4 h-4" />} label="Priority" value={lead.priority} badge={`badge-${lead.priority}`} />
            {/* Score Breakdown */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs">Score</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: getScoreColor(lead.score) }}>{lead.score}/100</span>
              </div>
              {/* Score Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, lead.score))}%`,
                    backgroundColor: getScoreColor(lead.score),
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-medium" style={{ color: getScoreColor(lead.score) }}>{getScoreLabel(lead.score)}</span>
                <span className="text-[10px] text-slate-600">{lead.score >= 81 ? 'Excellent' : lead.score >= 61 ? 'Good' : lead.score >= 31 ? 'Fair' : 'Low'}</span>
              </div>
              {/* Score Factors */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {getScoreFactors(lead).map((f) => (
                  <span
                    key={f.label}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                      f.active
                        ? 'bg-[#1E6B3A]/15 text-[#34D399]'
                        : 'bg-slate-800/50 text-slate-600'
                    }`}
                  >
                    {f.active ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    {f.label}
                    <span className="opacity-70">+{f.points}</span>
                  </span>
                ))}
              </div>
            </div>
            <InfoRow icon={<User className="w-4 h-4" />} label="Assigned To" value={lead.assignedTo || 'Unassigned'} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Created" value={formatDate(lead.createdAt)} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Updated" value={formatDate(lead.updatedAt)} />
          </div>
          {lead.message && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Message</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{lead.message}</p>
            </div>
          )}
        </div>

        {/* AI Analysis Card */}
        <div
          className={`admin-card p-5 lg:col-start-2 ${lead.aiScore !== null ? 'border-[#1E6B3A]/30' : ''}`}
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#A98B4F]" /> AI Analysis
          </h3>

          {lead.aiScore !== null ? (
            <div className="space-y-4">
              {/* Score Gauge */}
              <div className="flex items-center gap-4">
                <AIScoreGauge score={lead.aiScore} />
                <div>
                  <p className="text-sm font-semibold text-white">Conversion Probability</p>
                  <p className="text-xs text-slate-400">
                    {lead.aiScore >= 70 ? 'High likelihood' : lead.aiScore >= 40 ? 'Moderate likelihood' : 'Low likelihood'}
                  </p>
                </div>
              </div>

              {/* AI Insights */}
              {lead.aiInsights && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Brain className="w-3 h-3" /> Insights
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{lead.aiInsights}</p>
                </div>
              )}

              {/* AI Next Action */}
              {lead.aiNextAction && (
                <div className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-[#1E6B3A]">
                  <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Recommended Action
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#A98B4F] shrink-0 mt-0.5" />
                    {lead.aiNextAction}
                  </p>
                </div>
              )}

              {/* Analyzed timestamp */}
              {lead.aiAnalyzedAt && (
                <p className="text-[10px] text-slate-600 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Analyzed {formatTimelineTime(lead.aiAnalyzedAt)}
                </p>
              )}

              {/* Re-score button (ai module — hidden for sales) */}
              {access.canEdit && (
              <button
                onClick={scoreWithAI}
                disabled={aiScoring}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${aiScoring ? 'animate-spin' : ''}`} />
                {aiScoring ? 'Analyzing...' : 'Re-analyze with AI'}
              </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Brain className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-sm text-slate-500 mb-1">Not yet analyzed</p>
              <p className="text-xs text-slate-600 mb-4">Run AI analysis to get conversion probability and insights</p>
              {access.canEdit && (
              <button
                onClick={scoreWithAI}
                disabled={aiScoring}
                className="btn-admin btn-admin-primary text-xs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${aiScoring ? 'animate-spin' : ''}`} />
                {aiScoring ? 'Analyzing...' : 'Score with AI'}
              </button>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" /> Tags
            </h3>
            {access.canEdit && (
            <button
              onClick={() => { setShowTagDropdown(!showTagDropdown); setShowNewTag(false); setTagSearch(''); if (!showTagDropdown) fetchAllTags() }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tag
            </button>
            )}
          </div>

          {/* Tag Pills */}
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {leadTags.length === 0 ? (
              <p className="text-slate-600 text-xs">No tags assigned</p>
            ) : (
              leadTags.map((t) => (
                <span
                  key={t.tagId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{ backgroundColor: `${t.tagColor}15`, color: t.tagColor }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.tagColor }} />
                  {t.tagName}
                  {access.canEdit && (
                  <button
                    onClick={() => removeTag(t.tagId)}
                    className="ml-0.5 hover:opacity-70 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  )}
                </span>
              ))
            )}
          </div>

          {/* Tag Dropdown */}
          {showTagDropdown && (
            <div ref={tagDropdownRef} className="relative mt-3">
              <div className="absolute right-0 top-0 z-50 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-slate-800">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      autoFocus
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
                      placeholder="Search tags..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tag List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredAvailable.length === 0 && !showNewTag ? (
                    <p className="text-slate-500 text-xs text-center py-4">
                      {tagSearch ? 'No matching tags' : 'All tags assigned'}
                    </p>
                  ) : (
                    filteredAvailable.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { assignTag(t.id); setShowTagDropdown(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-800/60 transition-colors"
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-sm text-slate-300 flex-1">{t.name}</span>
                        <span className="text-[10px] text-slate-600">{t.leadCount} leads</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Create New Tag */}
                {!showNewTag ? (
                  <button
                    onClick={() => setShowNewTag(true)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left border-t border-slate-800 hover:bg-slate-800/60 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">Create New Tag</span>
                  </button>
                ) : (
                  <div className="p-3 border-t border-slate-800 space-y-2.5">
                    <input
                      autoFocus
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
                      placeholder="Tag name..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createAndAssignTag()}
                    />
                    <div className="flex items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewTagColor(c)}
                          className={`w-5 h-5 rounded-full transition-all ${newTagColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' : 'hover:scale-110'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={createAndAssignTag}
                        disabled={tagLoading || !newTagName.trim()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E6B3A] text-white hover:bg-[#1E6B3A]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        {tagLoading ? 'Creating...' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setShowNewTag(false); setNewTagName('') }}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Technical Info */}
        {(lead.ipAddress || lead.userAgent || formCtx) && (
          <div className="admin-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-slate-400" /> Technical Info
            </h3>
            <div className="space-y-3">
              {lead.ipAddress && <InfoRow icon={<Globe2 className="w-4 h-4" />} label="IP Address" value={lead.ipAddress} />}
              {lead.userAgent && (
                <div>
                  <p className="text-xs text-slate-500">User Agent</p>
                  <p className="text-xs text-slate-400 mt-0.5 break-all max-h-20 overflow-y-auto">{lead.userAgent}</p>
                </div>
              )}
              {formCtx && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Form Context</p>
                  <pre className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg overflow-x-auto max-h-32">
                    {JSON.stringify(formCtx, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notes, Follow-ups & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notes */}
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Notes ({lead.notes.length})
          </h3>
          {access.canStatus && (
          <div className="flex gap-2 mb-4">
            <input
              className="admin-input flex-1"
              placeholder="Add a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button onClick={addNote} disabled={!noteText.trim()} className="btn-admin btn-admin-primary shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
          )}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lead.notes.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No notes yet</p>
            ) : (
              lead.notes.map((note) => (
                <div key={note.id} className="p-3 bg-slate-800/40 rounded-lg border-l-2 border-[#1E6B3A]/50">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-600">by {note.createdBy || 'Admin'}</span>
                    <span className="text-[10px] text-slate-600">{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Follow-ups */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-slate-400" /> Follow-ups ({followUps.length})
            </h3>
            <div className="flex items-center gap-1.5">
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => setFollowUpView('list')}
                  className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    followUpView === 'list'
                      ? 'bg-slate-700/80 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <List className="w-3 h-3" /> List
                </button>
                <button
                  onClick={() => setFollowUpView('calendar')}
                  className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    followUpView === 'calendar'
                      ? 'bg-slate-700/80 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Calendar className="w-3 h-3" /> Calendar
                </button>
              </div>
              {access.canStatus && (
              <button
                onClick={() => setShowScheduleDialog(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule
              </button>
              )}
            </div>
          </div>
          {followUpView === 'calendar' ? (
            <LeadFollowUpCalendar
              followUps={followUps}
              onMarkComplete={markComplete}
              onDelete={deleteFollowUp}
            />
          ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {followUps.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No follow-ups scheduled</p>
            ) : (
              followUps.map((fu) => {
                const typeInfo = FOLLOW_UP_TYPES[fu.type] || FOLLOW_UP_TYPES.other
                const TypeIcon = typeInfo.icon
                const isCompleted = fu.status === 'completed'
                const isCancelled = fu.status === 'cancelled'
                return (
                  <div
                    key={fu.id}
                    className={`p-3 rounded-lg border border-slate-800/60 transition-colors ${isCompleted ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${typeInfo.color}15` }}
                      >
                        <TypeIcon className="w-4 h-4" style={{ color: typeInfo.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-slate-300" style={{ color: typeInfo.color }}>
                            {typeInfo.label}
                          </span>
                          <span className={`text-xs ${isCompleted ? 'line-through text-slate-500' : 'text-slate-400'}`}>
                            {fu.dueDate}{fu.dueTime ? ` · ${fu.dueTime}` : ''}
                          </span>
                        </div>
                        {fu.note && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{fu.note}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {/* Status badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              fu.status === 'pending'
                                ? 'bg-amber-500/15 text-amber-400'
                                : fu.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {fu.status === 'pending' ? 'Pending' : fu.status === 'completed' ? 'Completed' : 'Cancelled'}
                          </span>
                          {/* Overdue indicator */}
                          {fu.isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              Overdue
                            </span>
                          )}
                        </div>
                        {/* Actions */}
                        {access.canStatus && !isCompleted && !isCancelled && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              onClick={() => markComplete(fu.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Complete
                            </button>
                            <button
                              onClick={() => deleteFollowUp(fu.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Overdue banner */}
                    {fu.isOverdue && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                        <p className="text-[10px] text-red-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> This follow-up is overdue
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" /> Activity Timeline ({lead.activities.length})
          </h3>
          <div className="max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {lead.activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Activity className="w-8 h-8 mb-2 text-slate-700" />
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div
                  className="absolute left-[19px] top-3 bottom-3 w-[2px] rounded-full"
                  style={{
                    background: `linear-gradient(to bottom, ${getActivityColor(lead.activities[0]?.type || '')}60, #1E293B40)`,
                  }}
                />
                <div className="space-y-1">
                  {lead.activities.map((act, i) => {
                    const color = getActivityColor(act.type)
                    const isFirst = i === 0
                    const isLast = i === lead.activities.length - 1
                    return (
                      <div
                        key={act.id}
                        className="group relative flex gap-4"
                        style={{
                          paddingTop: isFirst ? '0' : '8px',
                          paddingBottom: isLast ? '0' : '8px',
                        }}
                      >
                        {/* Timeline dot + time column */}
                        <div className="relative flex flex-col items-center shrink-0 w-10">
                          {/* Colored dot on the line */}
                          <div
                            className="relative z-10 w-[10px] h-[10px] rounded-full border-2 transition-transform duration-200 group-hover:scale-125"
                            style={{
                              backgroundColor: color,
                              borderColor: isFirst ? color : `${color}40`,
                              boxShadow: isFirst ? `0 0 8px ${color}60` : 'none',
                            }}
                          />
                          {/* Relative time below dot */}
                          <span className="mt-1.5 text-[10px] text-slate-600 whitespace-nowrap">
                            {formatTimelineTime(act.createdAt)}
                          </span>
                        </div>

                        {/* Activity card */}
                        <div
                          className="flex-1 min-w-0 rounded-lg border transition-all duration-200 group-hover:border-slate-600/80 group-hover:bg-slate-800/60"
                          style={{
                            backgroundColor: isFirst ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                            borderColor: isFirst ? `${color}30` : 'rgba(51, 65, 85, 0.3)',
                          }}
                        >
                          <div className="px-3.5 py-2.5">
                            {/* Top row: type badge + who */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${color}15`,
                                  color: color,
                                }}
                              >
                                {getActivityTypeLabel(act.type)}
                              </span>
                              {act.createdBy && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <User className="w-2.5 h-2.5" />
                                  {act.createdBy}
                                </span>
                              )}
                            </div>
                            {/* Description */}
                            <p className="text-[13px] text-slate-300 leading-relaxed">{act.description}</p>
                            {/* Full date on hover hint */}
                            <p className="text-[10px] text-slate-600 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {formatDate(act.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChange} onOpenChange={setShowStatusChange}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Change Lead Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={submitting || s === lead.status}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                  s === lead.status
                    ? 'bg-[#1E6B3A]/20 text-[#34D399]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={`badge-status badge-${s}`}>{getLabel('lead_statuses', s)}</span>
                {s === lead.status && <span className="text-xs text-slate-500 ml-auto">Current</span>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Name *</label>
                <input className="admin-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Phone *</label>
                <input className="admin-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email <span className="text-slate-600">(optional)</span></label>
              <input className="admin-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Not provided" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Priority</label>
                <select className="admin-select" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Score</label>
                <input className="admin-input" type="number" value={editForm.score} onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Assigned To</label>
              <select className="admin-select" value={editForm.assignedTo} onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
                {editForm.assignedTo && !agents.some((a) => a.name === editForm.assignedTo) && (
                  <option value={editForm.assignedTo}>{editForm.assignedTo} (legacy)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Message</label>
              <textarea className="admin-input min-h-[80px] resize-y" value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowEdit(false)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button onClick={saveEdit} disabled={submitting} className="btn-admin btn-admin-primary text-sm">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" /> Delete Lead
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm">
            Are you sure you want to delete <strong className="text-white">{lead.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <button onClick={() => setShowDelete(false)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button onClick={deleteLead} disabled={submitting} className="btn-admin btn-admin-danger text-sm">
              {submitting ? 'Deleting...' : 'Delete Lead'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#A98B4F]" /> Schedule Follow-up
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Type</label>
              <select
                className="admin-select"
                value={scheduleForm.type}
                onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
              >
                {Object.entries(FOLLOW_UP_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Due Date *</label>
              <input
                type="date"
                className="admin-input"
                value={scheduleForm.dueDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Due Time (optional)</label>
              <input
                type="time"
                className="admin-input"
                value={scheduleForm.dueTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, dueTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Note</label>
              <textarea
                className="admin-input min-h-[72px] resize-y"
                placeholder="Add a note..."
                value={scheduleForm.note}
                onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowScheduleDialog(false)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button
              onClick={createFollowUp}
              disabled={followUpLoading || !scheduleForm.dueDate}
              className="btn-admin btn-admin-primary text-sm"
            >
              {followUpLoading ? 'Saving...' : 'Save'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Lead Assistant Panel */}
      <AILeadAssistant lead={lead} isOpen={showAI} onClose={() => setShowAI(false)} />
    </div>
  )
}

/** Normalize a BD phone number for WhatsApp wa.me links */
function normalizePhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/[^0-9]/g, '')
  // Strip +880 or 880 prefix
  if (digits.startsWith('880')) digits = digits.slice(3)
  // Strip leading 0
  if (digits.startsWith('0')) digits = digits.slice(1)
  // Prepend Bangladesh country code
  return `880${digits}`
}

function getWhatsAppTemplates(lead: Lead) {
  const project = lead.project?.name || 'our project'
  return [
    {
      label: 'Site Visit Invitation',
      text: `Thank you for your interest in ${project}. Would you like to schedule a site visit?`,
    },
    {
      label: 'Follow-up',
      text: `This is from Matrica Real Estate. Following up on your inquiry about ${project}.`,
    },
    {
      label: 'Special Offer',
      text: `Great news! We have special offers available at ${project}. Would you like to know more?`,
    },
  ]
}

function InfoRow({ icon, label, value, badge }: { icon: React.ReactNode; label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      {badge ? (
        <span className={`badge-status ${badge}`}>{value}</span>
      ) : (
        <span className="text-sm text-slate-300">{value}</span>
      )}
    </div>
  )
}