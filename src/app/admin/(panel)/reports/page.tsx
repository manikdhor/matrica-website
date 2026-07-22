'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Users, TrendingUp, Clock, CalendarCheck, Download, BarChart3, Globe,
  Zap, Activity, ArrowUpRight, ArrowDownRight, Target,
  Truck, UsersRound, FileText, Star, HelpCircle, Image as ImageIcon, Mail, Filter,
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ComposedChart,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportsV2Data {
  leadAnalytics: {
    totalLeads: number
    winRate: number
    avgScore: number
    avgResponseTime: number
    leadFunnel: { stage: string; count: number; key: string }[]
    leadTrend: { date: string; leads: number; won: number }[]
    scoreDistribution: { range: string; count: number }[]
    scoreVsConversion: { range: string; leads: number; winRate: number }[]
  }
  pipeline: {
    activePipeline: number
    stalledLeads: number
    avgDaysToConvert: number
    stageVelocity: { stage: string; avgDays: number; totalLeads: number; forwardRate: number; key: string }[]
    bottleneck: { stage: string; avgDays: number }
    pipelineDistribution: { name: string; value: number }[]
  }
  activity: {
    totalFollowUps: number
    completionRate: number
    overdue: number
    avgCompletionTime: number
    followUpTypeBreakdown: { name: string; value: number }[]
    followUpTrend: { date: string; created: number; completed: number }[]
    responseTimeDistribution: { range: string; count: number }[]
  }
  sources: {
    totalSources: number
    bestSource: string
    avgConversionRate: number
    sourceEffectiveness: {
      source: string; leads: number; won: number; conversionRate: number; avgScore: number; avgResponseTime: number
    }[]
    sourceTrend: Record<string, string | number>[]
    sourceTrendKeys: string[]
    sourcePieData: { name: string; value: number }[]
  }
  siteVisits: {
    totalBookings: number
    completionRate: number
    transportRequests: number
    avgGroupSize: number
    visitFunnel: { stage: string; count: number; color: string }[]
    visitTrend: { date: string; bookings: number; completed: number }[]
    preferredTimes: { time: string; count: number }[]
    transportRate: number
  }
  growth: {
    totalSubscribers: number
    publishedPosts: number
    activeFaqs: number
    galleryItems: number
    newsletterGrowth: { date: string; subscribers: number }[]
    kpiTrend: { date: string; leads: number; won: number; visits: number; subscribers: number }[]
  }
  team: {
    totalAgents: number
    assignedLeads: number
    unassignedLeads: number
    topAgent: string
    agentPerformance: {
      agent: string; leads: number; won: number; conversionRate: number; avgScore: number; avgResponseTime: string
    }[]
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#34D399', '#A98B4F', '#3B82F6', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#EC4899']
const STAGE_COLORS: Record<string, string> = {
  new: '#3B82F6', contacted: '#F59E0B', qualified: '#8B5CF6',
  'site_visit': '#06B6D4', negotiation: '#F97316', won: '#34D399', lost: '#EF4444',
}
const RESPONSE_COLORS: Record<string, string> = {
  '<1h': '#34D399', '1-4h': '#06B6D4', '4-24h': '#A98B4F', '1-3d': '#F97316', '>3d': '#EF4444',
}
const SOURCE_COLORS = ['#34D399', '#A98B4F', '#3B82F6', '#EF4444', '#8B5CF6', '#F97316']

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
}

const axisProps = {
  tick: { fill: '#64748b', fontSize: 11 },
  axisLine: { stroke: '#334155' },
  tickLine: { stroke: '#334155' },
}

const gridProps = {
  strokeDasharray: '3 3' as const,
  stroke: '#1e293b',
}

const TABS = [
  { key: 'leads', label: 'Lead Analytics', icon: Users },
  { key: 'pipeline', label: 'Pipeline', icon: Activity },
  { key: 'activity', label: 'Activity', icon: Zap },
  { key: 'sources', label: 'Sources', icon: Globe },
  { key: 'visits', label: 'Site Visits', icon: CalendarCheck },
  { key: 'team', label: 'Team', icon: UsersRound },
  { key: 'growth', label: 'Growth', icon: TrendingUp },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateParam(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatResponseTime(ms: number): string {
  if (ms === 0) return 'N/A'
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  if (ms < 86400000) return `${(ms / 3600000).toFixed(1)}h`
  return `${(ms / 86400000).toFixed(1)}d`
}

function formatHours(hours: number): string {
  if (hours === 0) return 'N/A'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, trend, trendValue, isNegative }: {
  label: string
  value: string | number
  icon: React.ElementType
  trend?: 'up' | 'down'
  trendValue?: string
  isNegative?: boolean
}) {
  return (
    <div className="admin-card stat-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up' ? (
            <ArrowUpRight className={`w-3 h-3 ${isNegative ? 'text-[#EF4444]' : 'text-[#34D399]'}`} />
          ) : (
            <ArrowDownRight className={`w-3 h-3 ${isNegative ? 'text-[#34D399]' : 'text-[#EF4444]'}`} />
          )}
          <span className={`text-xs ${isNegative ? 'text-[#EF4444]' : 'text-[#34D399]'}`}>{trendValue}</span>
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`admin-card p-5 ${className}`}>
      {title && <h3 className="text-sm font-medium text-slate-300 mb-4">{title}</h3>}
      {children}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="admin-card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-20 bg-slate-800 rounded" />
        <div className="h-4 w-4 bg-slate-800 rounded" />
      </div>
      <div className="h-8 w-24 bg-slate-800 rounded" />
      <div className="h-3 w-16 bg-slate-800 rounded mt-2" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="admin-card p-5 animate-pulse">
      <div className="h-4 w-32 bg-slate-800 rounded mb-4" />
      <div className="h-[250px] bg-slate-800/50 rounded" />
    </div>
  )
}

function NoData({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-slate-500 text-sm">
      {message}
    </div>
  )
}

// Custom label for pie charts
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function TabLeadAnalytics({ data }: { data: ReportsV2Data['leadAnalytics'] }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={data.totalLeads} icon={Users} trend="up" trendValue="+12%" />
        <KpiCard label="Win Rate" value={`${data.winRate}%`} icon={Target} trend="up" trendValue="+2.3%" />
        <KpiCard label="Avg Score" value={data.avgScore} icon={Star} trend="up" trendValue="+1.4" />
        <KpiCard label="Avg Response Time" value={formatResponseTime(data.avgResponseTime)} icon={Clock} trend="down" trendValue="-8%" isNegative={false} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Funnel */}
        <ChartCard title="Lead Funnel">
          {data.leadFunnel.some((s) => s.count > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.leadFunnel} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="stage" width={80} tick={{ ...axisProps.tick }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {data.leadFunnel.map((entry, i) => (
                    <Cell key={i} fill={STAGE_COLORS[entry.key] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Lead Trend 30d */}
        <ChartCard title="Lead Trend (30 Days)">
          {data.leadTrend.some((d) => d.leads > 0 || d.won > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.leadTrend} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A98B4F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A98B4F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                <Area type="monotone" dataKey="leads" stroke="#34D399" fill="url(#gradLeads)" strokeWidth={2} name="Leads" />
                <Area type="monotone" dataKey="won" stroke="#A98B4F" fill="url(#gradWon)" strokeWidth={2} name="Won" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score Distribution */}
        <ChartCard title="Score Distribution">
          {data.scoreDistribution.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.scoreDistribution} margin={{ left: -20, right: 10 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="range" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={36} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Score vs Conversion */}
        <ChartCard title="Score vs Conversion">
          {data.scoreVsConversion.some((d) => d.leads > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={data.scoreVsConversion} margin={{ left: -20, right: 10 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="range" {...axisProps} />
                <YAxis yAxisId="left" {...axisProps} />
                <YAxis yAxisId="right" orientation="right" {...axisProps} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                <Bar yAxisId="left" dataKey="leads" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={28} name="Leads" />
                <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#A98B4F" strokeWidth={2} dot={{ fill: '#A98B4F', r: 4 }} name="Win Rate %" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
    </div>
  )
}

function TabPipeline({ data }: { data: ReportsV2Data['pipeline'] }) {
  const velocityColor = (days: number) => {
    if (days > 5) return 'text-[#EF4444]'
    if (days >= 3) return 'text-[#A98B4F]'
    return 'text-[#34D399]'
  }
  const barColor = (days: number) => {
    if (days > 5) return '#EF4444'
    if (days >= 3) return '#A98B4F'
    return '#34D399'
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Active Pipeline" value={data.activePipeline} icon={Activity} trend="up" trendValue="+5" />
        <KpiCard label="Stalled Leads" value={data.stalledLeads} icon={Clock} trend="up" trendValue={`${data.stalledLeads}`} isNegative />
        <KpiCard label="Avg Days to Convert" value={`${data.avgDaysToConvert}d`} icon={Target} trend="down" trendValue="-1.2d" isNegative={false} />
      </div>

      {/* Stage Velocity Table + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-card p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Stage Velocity</h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Stage</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Avg Days</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider min-w-[120px]">Progress</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Total Leads</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Forward Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.stageVelocity.map((s, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[s.key] || '#64748b' }} />
                        <span className="text-white font-medium">{s.stage}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${velocityColor(s.avgDays)}`}>{s.avgDays}d</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(s.avgDays * 10, 100)}%`, backgroundColor: barColor(s.avgDays) }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{s.totalLeads}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{s.forwardRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline Health + Pie */}
        <div className="space-y-4">
          {/* Pipeline Health Card */}
          <div className="admin-card p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Pipeline Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Bottleneck Stage</span>
                <span className="text-sm font-semibold text-[#EF4444]">{data.bottleneck.stage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Stalled Leads</span>
                <span className="text-sm font-semibold text-[#EF4444]">{data.stalledLeads}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${data.stalledLeads > 10 ? 'bg-[#EF4444] animate-pulse' : data.stalledLeads > 5 ? 'bg-[#A98B4F]' : 'bg-[#34D399]'}`} />
                  <span className="text-xs text-slate-400">
                    {data.stalledLeads > 10 ? 'Critical — Immediate action needed' : data.stalledLeads > 5 ? 'Warning — Review recommended' : 'Healthy pipeline'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution Pie */}
          <ChartCard title="Pipeline Distribution">
            {data.pipelineDistribution.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.pipelineDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    paddingAngle={3} dataKey="value" label={PieLabel} labelLine={false}>
                    {data.pipelineDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <NoData message="No pipeline data" />}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

function TabActivity({ data }: { data: ReportsV2Data['activity'] }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Follow-ups" value={data.totalFollowUps} icon={Mail} trend="up" trendValue="+18%" />
        <KpiCard label="Completion Rate" value={`${data.completionRate}%`} icon={Target} trend="up" trendValue="+5.2%" />
        <KpiCard label="Overdue" value={data.overdue} icon={Clock} trend={data.overdue > 0 ? 'up' : undefined} trendValue={data.overdue > 0 ? `${data.overdue}` : undefined} isNegative />
        <KpiCard label="Avg Completion Time" value={formatHours(data.avgCompletionTime)} icon={Clock} trend="down" trendValue="-12%" isNegative={false} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Follow-up Type Breakdown */}
        <ChartCard title="Follow-up Type Breakdown">
          {data.followUpTypeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.followUpTypeBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  paddingAngle={3} dataKey="value" label={PieLabel} labelLine={false}>
                  {data.followUpTypeBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Follow-up Trend */}
        <ChartCard title="Follow-up Trend (30 Days)">
          {data.followUpTrend.some((d) => d.created > 0 || d.completed > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.followUpTrend} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                <Area type="monotone" dataKey="created" stroke="#3B82F6" fill="url(#gradCreated)" strokeWidth={2} name="Created" />
                <Area type="monotone" dataKey="completed" stroke="#34D399" fill="url(#gradCompleted)" strokeWidth={2} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      {/* Response Time Distribution */}
      <ChartCard title="Response Time Distribution">
        {data.responseTimeDistribution.some((d) => d.count > 0) ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.responseTimeDistribution} margin={{ left: -20, right: 10 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="range" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={48} name="Leads">
                {data.responseTimeDistribution.map((entry, i) => (
                  <Cell key={i} fill={RESPONSE_COLORS[entry.range] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </ChartCard>
    </div>
  )
}

function TabSources({ data }: { data: ReportsV2Data['sources'] }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Sources" value={data.totalSources} icon={Globe} />
        <KpiCard label="Best Source" value={data.bestSource} icon={Star} />
        <KpiCard label="Avg Conversion Rate" value={`${data.avgConversionRate}%`} icon={Target} trend="up" trendValue="+1.8%" />
      </div>

      {/* Source Effectiveness Table */}
      <div className="admin-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Source Effectiveness</h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Source</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Leads</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Won</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Conversion</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Avg Score</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Avg Resp. Time</th>
              </tr>
            </thead>
            <tbody>
              {data.sourceEffectiveness.map((s, i) => (
                <tr key={i}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i === 0 ? 'ring-1 ring-[#A98B4F]/30 rounded' : ''}`}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                      <span className="text-white font-medium">{s.source}</span>
                      {i === 0 && <span className="text-[10px] bg-[#A98B4F]/15 text-[#A98B4F] px-1.5 py-0.5 rounded-full font-medium">TOP</span>}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">{s.leads}</td>
                  <td className="py-3 px-3 text-right text-slate-300">{s.won}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-white font-medium">{s.conversionRate}%</span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">{s.avgScore}</td>
                  <td className="py-3 px-3 text-right text-slate-300">{formatHours(s.avgResponseTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Trend Stacked Area */}
        <ChartCard title="Source Trend (30 Days)">
          {data.sourceTrend.some((d) => data.sourceTrendKeys.some((k) => (d[k] as number) > 0)) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.sourceTrend} margin={{ left: -20, right: 10 }}>
                <defs>
                  {data.sourceTrendKeys.map((key, i) => (
                    <linearGradient key={key} id={`gradSrc${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SOURCE_COLORS[i % SOURCE_COLORS.length]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={SOURCE_COLORS[i % SOURCE_COLORS.length]} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                {data.sourceTrendKeys.map((key, i) => (
                  <Area key={key} type="monotone" dataKey={key} stackId="1"
                    stroke={SOURCE_COLORS[i % SOURCE_COLORS.length]} fill={`url(#gradSrc${i})`} strokeWidth={1.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Source Pie */}
        <ChartCard title="Lead Distribution by Source">
          {data.sourcePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.sourcePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  paddingAngle={3} dataKey="value" label={PieLabel} labelLine={false}>
                  {data.sourcePieData.map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
    </div>
  )
}

function TabSiteVisits({ data }: { data: ReportsV2Data['siteVisits'] }) {
  const totalBookings = data.totalBookings || 1
  const funnelWithPct = useMemo(() =>
    data.visitFunnel.map((f) => ({ ...f, pct: Number(((f.count / totalBookings) * 100).toFixed(1)) })),
    [data.visitFunnel, totalBookings]
  )

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Bookings" value={data.totalBookings} icon={CalendarCheck} trend="up" trendValue="+8%" />
        <KpiCard label="Completion Rate" value={`${data.completionRate}%`} icon={Target} trend="up" trendValue="+3.1%" />
        <KpiCard label="Transport Requests" value={data.transportRequests} icon={Truck} />
        <KpiCard label="Avg Group Size" value={data.avgGroupSize} icon={UsersRound} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visit Funnel */}
        <ChartCard title="Visit Funnel">
          {funnelWithPct.some((f) => f.count > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelWithPct} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="stage" width={85} tick={{ ...axisProps.tick }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === 'count') return [value, 'Count']
                    return [value, name]
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28} name="Count">
                  {funnelWithPct.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* Visit Trend */}
        <ChartCard title="Visit Trend (30 Days)">
          {data.visitTrend.some((d) => d.bookings > 0 || d.completed > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.visitTrend} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradVisCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                <Area type="monotone" dataKey="bookings" stroke="#3B82F6" fill="url(#gradBookings)" strokeWidth={2} name="Bookings" />
                <Area type="monotone" dataKey="completed" stroke="#34D399" fill="url(#gradVisCompleted)" strokeWidth={2} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      {/* Preferences Grid */}
      <ChartCard title="Visit Preferences">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Preferred Times */}
          <div className="bg-slate-800/30 rounded-lg p-4">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Preferred Times</span>
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={data.preferredTimes} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="time" width={70} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                    <Cell fill="#34D399" />
                    <Cell fill="#A98B4F" />
                    <Cell fill="#3B82F6" />
                  </Bar>
                  <Tooltip contentStyle={tooltipStyle} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transport Rate */}
          <div className="bg-slate-800/30 rounded-lg p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Transport Rate</span>
            <div className="relative mt-3 w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#A98B4F" strokeWidth="8"
                  strokeDasharray={`${data.transportRate * 2.51} ${251 - data.transportRate * 2.51}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{data.transportRate}%</span>
              </div>
            </div>
          </div>

          {/* Avg Group Size */}
          <div className="bg-slate-800/30 rounded-lg p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Avg Group Size</span>
            <div className="flex items-center gap-3 mt-3">
              <UsersRound className="w-10 h-10 text-[#8B5CF6]" />
              <span className="text-3xl font-bold text-white">{data.avgGroupSize}</span>
            </div>
            <span className="text-xs text-slate-500 mt-2">people per visit</span>
          </div>
        </div>
      </ChartCard>
    </div>
  )
}

function TabGrowth({ data }: { data: ReportsV2Data['growth'] }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Subscribers" value={data.totalSubscribers} icon={Mail} trend="up" trendValue="+24%" />
        <KpiCard label="Published Posts" value={data.publishedPosts} icon={FileText} />
        <KpiCard label="Active FAQs" value={data.activeFaqs} icon={HelpCircle} />
        <KpiCard label="Gallery Items" value={data.galleryItems} icon={ImageIcon} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Newsletter Growth */}
        <ChartCard title="Newsletter Growth (30 Days)">
          {data.newsletterGrowth.some((d) => d.subscribers > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.newsletterGrowth} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="gradNewsletter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="subscribers" stroke="#8B5CF6" fill="url(#gradNewsletter)" strokeWidth={2} name="Subscribers" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        {/* KPI Trend Multi-line */}
        <ChartCard title="KPI Trend (30 Days)">
          {data.kpiTrend.some((d) => d.leads > 0 || d.visits > 0 || d.subscribers > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.kpiTrend} margin={{ left: -20, right: 10 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                <YAxis yAxisId="left" {...axisProps} />
                <YAxis yAxisId="right" orientation="right" {...axisProps} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#34D399" strokeWidth={2} dot={false} name="Leads" />
                <Line yAxisId="left" type="monotone" dataKey="won" stroke="#A98B4F" strokeWidth={2} dot={false} name="Won" />
                <Line yAxisId="left" type="monotone" dataKey="visits" stroke="#3B82F6" strokeWidth={2} dot={false} name="Visits" />
                <Line yAxisId="right" type="monotone" dataKey="subscribers" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Subscribers" />
              </LineChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      {/* Content Overview */}
      <ChartCard title="Content Overview">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <FileText className="w-8 h-8 text-[#34D399] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{data.publishedPosts}</div>
            <div className="text-xs text-slate-400 mt-1">Published Posts</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <Star className="w-8 h-8 text-[#A98B4F] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {/* Testimonials count from separate query */}
              —
            </div>
            <div className="text-xs text-slate-400 mt-1">Testimonials</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <HelpCircle className="w-8 h-8 text-[#3B82F6] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{data.activeFaqs}</div>
            <div className="text-xs text-slate-400 mt-1">Active FAQs</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <ImageIcon className="w-8 h-8 text-[#EC4899] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{data.galleryItems}</div>
            <div className="text-xs text-slate-400 mt-1">Gallery Items</div>
          </div>
        </div>
      </ChartCard>
    </div>
  )
}

function TabTeam({ data }: { data: ReportsV2Data['team'] }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Agents" value={data.totalAgents} icon={UsersRound} />
        <KpiCard label="Assigned Leads" value={data.assignedLeads} icon={Users} />
        <KpiCard label="Unassigned Leads" value={data.unassignedLeads} icon={Clock} isNegative trend={data.unassignedLeads > 0 ? 'up' : undefined} trendValue={data.unassignedLeads > 0 ? `${data.unassignedLeads}` : undefined} />
        <KpiCard label="Top Agent" value={data.topAgent} icon={Star} />
      </div>

      {/* Agent Performance Table */}
      <div className="admin-card p-5">
        <h3 className="text-sm font-medium text-slate-300 mb-4">Agent Performance</h3>
        {data.agentPerformance.length === 0 ? (
          <NoData message="No assigned leads in this period" />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Agent</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Leads</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Won</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Conversion</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Avg Score</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Avg Resp. Time</th>
                </tr>
              </thead>
              <tbody>
                {data.agentPerformance.map((a, i) => (
                  <tr key={i}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i === 0 ? 'ring-1 ring-[#A98B4F]/30 rounded' : ''}`}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1E6B3A]/15 flex items-center justify-center text-[10px] font-semibold text-[#34D399]">
                          {a.agent.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{a.agent}</span>
                        {i === 0 && <span className="text-[10px] bg-[#A98B4F]/15 text-[#A98B4F] px-1.5 py-0.5 rounded-full font-medium">TOP</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{a.leads}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{a.won}</td>
                    <td className="py-3 px-3 text-right"><span className="text-white font-medium">{a.conversionRate}%</span></td>
                    <td className="py-3 px-3 text-right text-slate-300">{a.avgScore}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{a.avgResponseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leads per Agent bar chart */}
      <ChartCard title="Leads per Agent">
        {data.agentPerformance.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, data.agentPerformance.length * 44)}>
            <BarChart data={data.agentPerformance} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid {...gridProps} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="agent" width={90} tick={{ ...axisProps.tick }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              <Bar dataKey="leads" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} name="Leads" />
              <Bar dataKey="won" fill="#34D399" radius={[0, 4, 4, 0]} barSize={20} name="Won" />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData message="No agent data" />}
      </ChartCard>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('leads')
  const [data, setData] = useState<ReportsV2Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return formatDateParam(d)
  })
  const [to, setTo] = useState(() => formatDateParam(new Date()))

  const fetchData = useMemo(() => async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/v2?from=${from}&to=${to}`)
      const json = await res.json()
      if (json.error) {
        setData(null)
      } else {
        setData(json)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApply = () => {
    fetchData()
  }

  const handleExport = () => {
    window.open(`/api/admin/reports/export?from=${from}&to=${to}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1E6B3A]/15 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#34D399]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-400">Comprehensive insights across all metrics</p>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="admin-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="w-4 h-4" />
            <span>Date Range:</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="admin-input w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="admin-input w-40"
              />
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <button onClick={handleApply} className="btn-admin btn-admin-primary">
                <Filter className="w-4 h-4" />
                Apply
              </button>
              <button onClick={handleExport} className="btn-admin btn-admin-secondary">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#1E6B3A]/15 text-[#34D399] border border-[#1E6B3A]/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : !data ? (
        <div className="admin-card p-12 text-center">
          <p className="text-slate-400">Failed to load report data. Please try again.</p>
        </div>
      ) : (
        <>
          {activeTab === 'leads' && <TabLeadAnalytics data={data.leadAnalytics} />}
          {activeTab === 'pipeline' && <TabPipeline data={data.pipeline} />}
          {activeTab === 'activity' && <TabActivity data={data.activity} />}
          {activeTab === 'sources' && <TabSources data={data.sources} />}
          {activeTab === 'visits' && <TabSiteVisits data={data.siteVisits} />}
          {activeTab === 'team' && <TabTeam data={data.team} />}
          {activeTab === 'growth' && <TabGrowth data={data.growth} />}
        </>
      )}
    </div>
  )
}