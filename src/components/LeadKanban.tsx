'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Phone,
  Clock,
  User,
  Tag,
  AlertCircle,
  MessageSquare,
  Eye,
  ArrowRightLeft,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  contacted: '#F59E0B',
  qualified: '#8B5CF6',
  site_visit: '#06B6D4',
  negotiation: '#F97316',
  won: '#10B981',
  lost: '#EF4444',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#6B7280',
}

interface KanbanTag {
  id: string
  name: string
  color: string
}

interface KanbanLead {
  id: string
  name: string
  phone: string
  email: string | null
  source: string
  projectName: string
  priority: string
  score: number
  aiScore: number | null
  aiNextAction: string | null
  tags: KanbanTag[]
  assignedTo: string | null
  createdAt: string
  overdueFollowUps: number
  status: string
}

interface KanbanColumn {
  status: string
  label: string
  count: number
  leads: KanbanLead[]
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

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const STATUS_QUICK_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'qualified', 'lost'],
  contacted: ['qualified', 'new', 'lost'],
  qualified: ['site_visit', 'negotiation', 'lost'],
  site_visit: ['negotiation', 'qualified', 'lost'],
  negotiation: ['won', 'qualified', 'lost'],
  won: [],
  lost: ['new'],
}

export default function LeadKanban() {
  const router = useRouter()
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [transitioningId, setTransitioningId] = useState<string | null>(null)

  const fetchKanban = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/leads/kanban')
      const data = await res.json()
      if (data.columns) {
        setColumns(data.columns)
      }
    } catch {
      toast.error('Failed to load kanban board')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchKanban()
  }, [])

  const handleQuickTransition = async (leadId: string, newStatus: string) => {
    setTransitioningId(leadId)
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [leadId], status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Moved to ${newStatus.replace(/_/g, ' ')}`)
        fetchKanban()
      }
    } catch {
      toast.error('Failed to update status')
    }
    setTransitioningId(null)
  }

  if (loading) {
    return (
      <div className="admin-card p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading board...</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4 -mx-2 px-2">
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => {
          const color = STATUS_COLORS[col.status] || '#6B7280'
          return (
            <div
              key={col.status}
              className="flex-shrink-0 w-[300px] md:w-[320px] flex flex-col"
            >
              {/* Column Header */}
              <div
                className="rounded-t-lg px-4 py-3 flex items-center justify-between gap-2"
                style={{
                  borderLeft: `4px solid ${color}`,
                  backgroundColor: hexToRgba(color, 0.08),
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <h3 className="text-sm font-semibold text-white whitespace-nowrap">
                    {col.label}
                  </h3>
                  {col.leads.some((l) => l.aiScore != null) && (
                    <span className="text-[10px] text-emerald-400/70">
                      <Sparkles className="w-3 h-3 inline" />
                    </span>
                  )}
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: hexToRgba(color, 0.7) }}
                >
                  {col.count}
                </span>
              </div>

              {/* Cards Container */}
              <div className="bg-slate-900/40 rounded-b-lg border border-t-0 border-slate-800/50">
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-2 space-y-2 kanban-scrollbar">
                  {col.leads.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 text-xs">
                      No leads
                    </div>
                  ) : (
                    col.leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        color={color}
                        isHovered={hoveredCard === lead.id}
                        isTransitioning={transitioningId === lead.id}
                        onHoverChange={(h) => setHoveredCard(h ? lead.id : null)}
                        onNavigate={() => router.push(`/admin/leads/${lead.id}`)}
                        onQuickTransition={(newStatus) =>
                          handleQuickTransition(lead.id, newStatus)
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .kanban-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .kanban-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .kanban-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.15);
          border-radius: 9999px;
        }
        .kanban-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.3);
        }
      `}</style>
    </div>
  )
}

/* Lead Card Sub-Component */
function LeadCard({
  lead,
  color,
  isHovered,
  isTransitioning,
  onHoverChange,
  onNavigate,
  onQuickTransition,
}: {
  lead: KanbanLead
  color: string
  isHovered: boolean
  isTransitioning: boolean
  onHoverChange: (h: boolean) => void
  onNavigate: () => void
  onQuickTransition: (status: string) => void
}) {
  const priorityColor = PRIORITY_COLORS[lead.priority] || '#6B7280'
  const transitions = STATUS_QUICK_TRANSITIONS[lead.status] || []

  return (
    <div
      className="group relative rounded-lg border border-slate-700/40 bg-slate-800/40 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
      style={{ borderLeftWidth: '3px', borderLeftColor: priorityColor }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onClick={onNavigate}
    >
      <div className="p-3">
        {/* Top row: name + AI score + overdue badge */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-sm font-medium text-white leading-tight truncate">
            {lead.name}
          </h4>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lead.aiScore != null && (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: lead.aiScore >= 70 ? 'rgba(52,211,153,0.15)' : lead.aiScore >= 40 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                  color: lead.aiScore >= 70 ? '#34D399' : lead.aiScore >= 40 ? '#FBBF24' : '#F87171',
                }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {lead.aiScore}
              </span>
            )}
            {lead.overdueFollowUps > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" />
                {lead.overdueFollowUps}
              </span>
            )}
          </div>
        </div>

        {/* AI Next Action */}
        {lead.aiNextAction && (
          <div className="flex items-start gap-1.5 mb-2 text-[11px] text-slate-400 bg-emerald-500/5 border border-emerald-500/10 rounded-md px-2 py-1.5">
            <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{lead.aiNextAction}</span>
          </div>
        )}

        {/* Phone */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Phone className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{lead.phone}</span>
        </div>

        {/* Source badge + Project */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize"
            style={{
              backgroundColor: hexToRgba(color, 0.15),
              color: color,
            }}
          >
            {lead.source.replace(/_/g, ' ')}
          </span>
          {lead.projectName && (
            <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
              {lead.projectName}
            </span>
          )}
        </div>

        {/* Tags */}
        {lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {lead.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full truncate max-w-[100px]"
                style={{
                  backgroundColor: hexToRgba(tag.color, 0.15),
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
            {lead.tags.length > 3 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5" /> +{lead.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom row: assigned + time + priority */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2 min-w-0">
            {lead.assignedTo ? (
              <span className="flex items-center gap-1 truncate">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{lead.assignedTo}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-600">
                <User className="w-3 h-3" />
                Unassigned
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{relativeTime(lead.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Hover action overlay */}
      {isHovered && !isTransitioning && (
        <div
          className="absolute inset-0 rounded-lg bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center gap-2 px-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href={`/admin/leads/${lead.id}`}
            className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {transitions.length > 0 && (
            <div className="relative group/transition">
              <button
                className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                title="Change status"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
              {/* Quick status dropdown */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/transition:flex flex-col gap-0.5 bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-xl min-w-[140px] z-20">
                <div className="text-[10px] text-slate-500 px-2 py-1 font-medium uppercase tracking-wider">
                  Move to
                </div>
                {transitions.map((s) => {
                  const sColor = STATUS_COLORS[s] || '#6B7280'
                  return (
                    <button
                      key={s}
                      onClick={() => onQuickTransition(s)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors capitalize"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sColor }}
                      />
                      {s.replace(/_/g, ' ')}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate()
            }}
            className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="Add note"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Transitioning overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 rounded-lg bg-slate-900/60 flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      )}
    </div>
  )
}