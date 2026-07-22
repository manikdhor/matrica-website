'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  FileText,
  BarChart3,
  Clock,
  Sparkles,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts'

interface OverdueFollowUp {
  id: string
  type: string
  dueDate: string
  dueTime: string | null
  note: string | null
  leadId: string
  leadName: string
  leadPhone: string
}

interface DashboardData {
  stats: {
    totalLeads: number
    newLeads: number
    todayLeads: number
    weekLeads: number
    totalSiteVisits: number
    pendingSiteVisits: number
    conversionRate: number
  }
  leadsBySource: { source: string; count: number }[]
  leadsByStatus: { status: string; count: number }[]
  leadsTrend: { date: string; count: number }[]
  funnelData: { status: string; count: number }[]
  recentLeads: {
    id: string
    name: string
    phone: string
    source: string
    status: string
    projectName: string
    createdAt: string
  }[]
  recentSiteVisits: {
    id: string
    name: string
    phone: string
    preferredDate: string
    status: string
    projectName: string
    createdAt: string
  }[]
  upcomingVisits: {
    id: string
    name: string
    phone: string
    preferredDate: string
    preferredTime: string
    status: string
    projectName: string
  }[]
}

const CHART_COLORS = ['#1E6B3A', '#A98B4F', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']
const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  contacted: '#F59E0B',
  qualified: '#8B5CF6',
  site_visit: '#06B6D4',
  negotiation: '#F97316',
  won: '#10B981',
  lost: '#EF4444',
}

const FUNNEL_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  site_visit: 'Site Visit',
  negotiation: 'Negotiation',
  won: 'Won',
}

interface RiskAlert {
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  type: string
  leadId?: string
}

interface AIInsightsData {
  pipelineHealth: number
  predictions: {
    expectedLeads: number
    predictedConversions: number
  }
  riskAlerts: RiskAlert[]
}

type DateRangeOption = 'today' | '7d' | '30d' | '90d' | 'year' | 'all'

const DATE_RANGES: { key: DateRangeOption; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
]

function getDateRange(key: DateRangeOption): { from?: string; to?: string } {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  switch (key) {
    case 'today':
      return { from: today, to: today }
    case '7d': {
      const from = new Date(y, m, d - 6).toISOString().split('T')[0]
      return { from, to: today }
    }
    case '30d': {
      const from = new Date(y, m, d - 29).toISOString().split('T')[0]
      return { from, to: today }
    }
    case '90d': {
      const from = new Date(y, m, d - 89).toISOString().split('T')[0]
      return { from, to: today }
    }
    case 'year':
      return { from: `${y}-01-01`, to: today }
    case 'all':
      return {}
  }
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function statusBadge(status: string) {
  const cls = `badge-${status}` as keyof typeof badgeClasses
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return <span className={`badge-status ${cls}`}>{label}</span>
}
const badgeClasses: Record<string, string> = {}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function PipelineGauge({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const color =
    clampedScore >= 70 ? '#10B981' : clampedScore >= 40 ? '#F59E0B' : '#EF4444'
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedScore / 100) * circumference
  const center = 30
  const svgSize = 56

  return (
    <svg width={svgSize} height={svgSize} className="shrink-0">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#1E293B"
        strokeWidth={4}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-700"
      />
      <text
        x={center}
        y={center + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={14}
        fontWeight={700}
      >
        {clampedScore}
      </text>
    </svg>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [overdueData, setOverdueData] = useState<{ count: number; followUps: OverdueFollowUp[] } | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AIInsightsData | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(false)
  const aiCacheRef = useRef<{ timestamp: number; data: AIInsightsData } | null>(null)
  const aiFetchInitiated = useRef(false)

  const fetchAIInsights = useCallback(async (force = false) => {
    const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
    const cached = aiCacheRef.current
    if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setAiInsights(cached.data)
      return
    }
    setAiLoading(true)
    setAiError(false)
    try {
      const res = await fetch('/api/admin/ai/insights', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to fetch AI insights')
      const data: AIInsightsData = await res.json()
      aiCacheRef.current = { timestamp: Date.now(), data }
      setAiInsights(data)
    } catch {
      setAiError(true)
    } finally {
      setAiLoading(false)
    }
  }, [])

  const loadDashboard = async (range: DateRangeOption, isRefresh: boolean) => {
    const { from, to } = getDateRange(range)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const url = `/api/admin/dashboard?${params.toString()}`
    const cacheKey = `admin-dashboard:${url}`

    // Stale-while-revalidate: paint the last snapshot for this range
    // immediately, then refresh from the remote DB in the background.
    let hadCache = false
    if (!isRefresh) {
      try {
        const raw = sessionStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw)
          // Only trust a well-formed snapshot; a stale error payload must not
          // slip past the render guard and crash on data.stats.
          if (cached && cached.stats) {
            setData(cached)
            hadCache = true
          } else {
            sessionStorage.removeItem(cacheKey)
          }
        }
      } catch {}
      if (!hadCache) setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const res = await fetch(url)
      const d = await res.json()
      // The API returns { error } on auth/DB failures — never feed that to the
      // renderer or cache it, or every later load reads back a broken payload.
      if (res.ok && d && d.stats) {
        setData(d)
        try { sessionStorage.setItem(cacheKey, JSON.stringify(d)) } catch {}
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastUpdated(new Date().toLocaleTimeString())
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 2000)
    }
  }

  useEffect(() => {
    loadDashboard(dateRange, false)
    fetch('/api/admin/leads/follow-ups/overdue')
      .then((r) => r.json())
      .then((d) => { if (d.followUps) setOverdueData(d) })
      .catch(() => { /* ignore */ })
  }, [dateRange])

  useEffect(() => {
    if (!aiFetchInitiated.current) {
      aiFetchInitiated.current = true
      fetchAIInsights()
    }
  }, [fetchAIInsights])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!document.hidden) loadDashboard(dateRange, true)
    }, 60000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [dateRange])

  if (loading || !data || !data.stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="admin-card p-5 h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="admin-card h-72" />
          <div className="admin-card h-72" />
        </div>
      </div>
    )
  }

  const { stats } = data

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      sub: `${stats.todayLeads} today`,
      icon: Users,
      color: '#1E6B3A',
      trend: stats.weekLeads > 0 ? `+${stats.weekLeads} this week` : '',
      trendUp: true,
    },
    {
      label: 'New Leads',
      value: stats.newLeads,
      sub: 'Awaiting contact',
      icon: UserPlus,
      color: '#3B82F6',
      trend: '',
      trendUp: true,
    },
    {
      label: 'Site Visits',
      value: stats.totalSiteVisits,
      sub: `${stats.pendingSiteVisits} pending`,
      icon: CalendarCheck,
      color: '#A98B4F',
      trend: '',
      trendUp: true,
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      sub: `${stats.totalLeads} total leads`,
      icon: TrendingUp,
      color: '#10B981',
      trend: '',
      trendUp: stats.conversionRate > 10,
    },
  ]

  const quickActions = [
    {
      label: 'Add Lead',
      description: 'Create a new lead entry',
      icon: UserPlus,
      color: '#10B981',
      href: '/admin/leads?action=add',
    },
    {
      label: 'Schedule Visit',
      description: 'Manage site visit bookings',
      icon: CalendarCheck,
      color: '#F59E0B',
      href: '/admin/site-visits',
    },
    {
      label: 'New Blog Post',
      description: 'Write and publish articles',
      icon: FileText,
      color: '#3B82F6',
      href: '/admin/blog/new',
    },
    {
      label: 'View Reports',
      description: 'Analytics and insights',
      icon: BarChart3,
      color: '#8B5CF6',
      href: '/admin/reports',
    },
  ]

  // Funnel calculations
  const funnelTotal = data.funnelData.reduce((sum, d) => sum + d.count, 0)
  const maxFunnelCount = Math.max(...data.funnelData.map((d) => d.count), 1)

  // Time label for preferredTime
  const timeLabel = (t: string) => {
    switch (t) {
      case 'morning': return 'Morning'
      case 'afternoon': return 'Afternoon'
      case 'evening': return 'Evening'
      default: return t
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title + Date Range + Auto-refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of your real estate business</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Auto-refresh indicator */}
          <span className="text-slate-600 text-xs flex items-center gap-1.5">
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {showFlash ? (
              <span className="text-[#34D399] transition-opacity">Updated just now</span>
            ) : lastUpdated ? (
              <>Auto-refreshing &middot; {lastUpdated}</>
            ) : (
              <>Auto-refreshing every 60s</>
            )}
          </span>

          {/* Date Range Pills */}
          <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl p-1 border border-slate-800/50">
            {DATE_RANGES.map((dr) => (
              <button
                key={dr.key}
                onClick={() => setDateRange(dr.key)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  dateRange === dr.key
                    ? 'bg-[#1E6B3A]/20 text-[#34D399] border border-[#1E6B3A]/30'
                    : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-transparent'
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>

          <Link href="/admin/leads" className="btn-admin btn-admin-primary text-sm whitespace-nowrap">
            View All Leads <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Overdue Follow-ups Alert */}
      {overdueData && overdueData.count > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {overdueData.count} Overdue Follow-up{overdueData.count !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-400/70 mt-0.5">
                  {overdueData.followUps.slice(0, 3).map((fu) => fu.leadName).join(', ')}
                  {overdueData.count > 3 ? ` and ${overdueData.count - 3} more` : ''}
                </p>
              </div>
            </div>
            <Link
              href={overdueData.followUps[0] ? `/admin/leads/${overdueData.followUps[0].leadId}` : '/admin/leads'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-300 hover:bg-red-500/15 border border-red-500/20 transition-colors"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="admin-card stat-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {card.trend && (
                  <span
                    className={`text-xs font-medium flex items-center gap-0.5 ${
                      card.trendUp ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {card.trendUp ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {card.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-slate-400 text-xs mt-1">{card.label}</p>
              {card.sub && (
                <p className="text-slate-500 text-xs mt-0.5">{card.sub}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className="admin-card p-4 cursor-pointer hover:border-opacity-30 transition-all hover:scale-[1.02] group"
              style={{
                ['--hover-border' as string]: action.color,
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = `${action.color}30`
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = ''
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
                style={{ background: `${action.color}12` }}
              >
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-slate-100 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-slate-500 mt-1">{action.description}</p>
            </Link>
          )
        })}
      </div>

      {/* AI Insights Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-800/30 rounded-xl p-4">
        {aiLoading ? (
          <div className="flex items-center gap-6 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
            <div className="h-8 w-36 bg-slate-800 rounded-lg shrink-0" />
          </div>
        ) : aiError || !aiInsights ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-500">AI insights unavailable</span>
            </div>
            <button
              onClick={() => fetchAIInsights(true)}
              className="flex items-center gap-1.5 text-xs text-[#A98B4F] hover:text-[#A98B4F]/80 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            {/* Left: Pipeline Health Gauge */}
            <div className="flex items-center gap-3 shrink-0">
              <PipelineGauge score={aiInsights.pipelineHealth} />
              <div>
                <p className="text-xs text-slate-500">Pipeline</p>
                <p className="text-xs font-semibold text-white">Health</p>
              </div>
            </div>

            {/* Center: Key Prediction */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-[#A98B4F]" />
                <span className="text-xs font-medium text-[#A98B4F]">AI Prediction</span>
              </div>
              <p className="text-sm text-slate-300">
                Next week: <span className="text-white font-semibold">{aiInsights.predictions.expectedLeads} leads</span> expected,{' '}
                <span className="text-white font-semibold">{aiInsights.predictions.predictedConversions} conversions</span> predicted
              </p>
            </div>

            {/* Right: View Full Analysis Link */}
            <Link
              href="/admin/ai-insights"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 hover:bg-emerald-900/30 transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              View Full AI Analysis
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* AI Risk Alerts Strip */}
      {aiInsights && aiInsights.riskAlerts && (
        (() => {
          const visibleAlerts = aiInsights.riskAlerts.filter(
            (a) => a.severity === 'critical' || a.severity === 'high'
          ).slice(0, 3)
          if (visibleAlerts.length === 0) return null
          return (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
                AI Alerts
              </span>
              <div className="flex items-center gap-2">
                {visibleAlerts.map((alert, i) => (
                  <Link
                    key={i}
                    href={alert.leadId ? `/admin/leads/${alert.leadId}` : '/admin/leads'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                      alert.severity === 'critical'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                    }`} />
                    {alert.message}
                  </Link>
                ))}
              </div>
            </div>
          )
        })()
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads by Source */}
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Leads by Source</h3>
          {data.leadsBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.leadsBySource} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="source"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={{ stroke: '#1E293B' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    color: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#1E6B3A" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">
              No lead data for this period
            </div>
          )}
        </div>

        {/* Leads by Status */}
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Leads by Status</h3>
          {data.leadsByStatus.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={240}>
                <PieChart>
                  <Pie
                    data={data.leadsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {data.leadsByStatus.map((entry, i) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [value, 'Leads']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.leadsByStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[s.status] || '#64748B' }}
                      />
                      <span className="text-slate-400 capitalize">
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-white font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">
              No lead data for this period
            </div>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="admin-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          Leads Trend ({DATE_RANGES.find((d) => d.key === dateRange)?.label || 'Last 30 Days'})
        </h3>
        {data.leadsTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.leadsTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E6B3A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1E6B3A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={{ stroke: '#1E293B' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  fontSize: '12px',
                }}
                labelFormatter={(v) => `Date: ${v}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#1E6B3A"
                strokeWidth={2}
                fill="url(#leadGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">
            No trend data for this period
          </div>
        )}
      </div>

      {/* Lead Conversion Funnel */}
      <div className="admin-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Lead Conversion Funnel</h3>
        {data.funnelData.some((d) => d.count > 0) ? (
          <div className="space-y-3">
            {data.funnelData.map((stage, i) => {
              const pct = funnelTotal > 0 ? ((stage.count / funnelTotal) * 100).toFixed(1) : '0'
              const widthPct = maxFunnelCount > 0 ? (stage.count / maxFunnelCount) * 100 : 0
              const color = STATUS_COLORS[stage.status] || '#64748B'
              const label = FUNNEL_LABELS[stage.status] || stage.status
              // Shrink factor for funnel visual (wider at top, narrower at bottom)
              const funnelShrink = 100 - i * 8
              const barWidth = Math.max(20, (widthPct / 100) * funnelShrink)

              return (
                <div key={stage.status} className="flex items-center gap-4">
                  <div className="w-24 text-right shrink-0">
                    <span className="text-xs text-slate-400 font-medium">{label}</span>
                  </div>
                  <div className="flex-1 relative">
                    <div
                      className="h-9 rounded-lg flex items-center px-3 transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: `${color}18`,
                        borderLeft: `3px solid ${color}`,
                        minHeight: '36px',
                      }}
                    >
                      <span className="text-sm font-semibold" style={{ color }}>
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <div className="w-14 text-right shrink-0">
                    <span className="text-xs text-slate-500">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
            No funnel data for this period
          </div>
        )}
      </div>

      {/* Bottom Row: Upcoming Visits + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Site Visits */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A98B4F]" />
              <h3 className="text-sm font-semibold text-white">Upcoming Site Visits</h3>
            </div>
            <Link href="/admin/site-visits" className="text-xs text-[#1E6B3A] hover:underline flex items-center gap-1">
              View All <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {data.upcomingVisits.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {data.upcomingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-3 rounded-lg bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">{visit.name}</p>
                    <span className={`badge-status badge-${visit.status} shrink-0 ml-2`}>
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3" />
                      {formatDate(visit.preferredDate)}
                    </span>
                    <span>{timeLabel(visit.preferredTime)}</span>
                    <span className="truncate">{visit.projectName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No upcoming visits</p>
          )}
        </div>

        {/* Recent Leads */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Leads</h3>
            <Link href="/admin/leads" className="text-xs text-[#1E6B3A] hover:underline flex items-center gap-1">
              View All <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {data.recentLeads.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {data.recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate group-hover:text-[#34D399] transition-colors">
                      {lead.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    {statusBadge(lead.status)}
                    <p className="text-[10px] text-slate-600 mt-1">{relativeTime(lead.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No leads yet</p>
          )}
        </div>

        {/* Recent Site Visits */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Site Visit Bookings</h3>
            <Link href="/admin/site-visits" className="text-xs text-[#1E6B3A] hover:underline flex items-center gap-1">
              View All <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {data.recentSiteVisits.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {data.recentSiteVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{visit.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {visit.preferredDate} &middot; {visit.projectName}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <span className={`badge-status badge-${visit.status}`}>
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </span>
                    <p className="text-[10px] text-slate-600 mt-1">{relativeTime(visit.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No bookings yet</p>
          )}
        </div>
      </div>
    </div>
  )
}