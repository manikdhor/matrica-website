'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { toast } from 'sonner'
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  Target,
  Zap,
  Users,
  FileText,
  UserCheck,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Download,
  Loader2,
  Brain,
  Activity,
  ShieldAlert,
  ChevronRight,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RiskAlert {
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
  affectedCount: number
}

interface Prediction {
  nextWeekLeads: number
  nextWeekConversions: number
  pipelineVelocity: 'improving' | 'stable' | 'declining'
  bestDayToContact: string
  peakHours: string
  estimatedMonthlyRevenue: string
  conversionProbability: string
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  category: 'leads' | 'followups' | 'content' | 'team' | 'process'
  title: string
  description: string
  expectedImpact: string
}

interface WeeklyBrief {
  headline: string
  highlights: string[]
  concerns: string[]
  topOpportunity: string
  focusAreas: string[]
}

interface BottleneckStage {
  stage: string
  count: number
  dropOff: number
  isBottleneck?: boolean
}

interface BottleneckAnalysis {
  stages: BottleneckStage[]
  biggestBottleneck: string
  recommendation: string
}

interface PipelineHealth {
  score: number
  label: string
  summary: string
}

interface RawData {
  totalLeads: number
  wonLeads: number
  lostLeads: number
  conversionRate: string
  thisWeekLeads: number
  overdueFollowUps: number
  unassignedLeads: number
  totalSiteVisits: number
  pendingSiteVisits: number
  completedSiteVisits: number
}

interface InsightsData {
  pipelineHealth: PipelineHealth
  riskAlerts: RiskAlert[]
  predictions: Prediction
  recommendations: Recommendation[]
  weeklyBrief: WeeklyBrief
  bottleneckAnalysis: BottleneckAnalysis
  rawData: RawData
}

interface BulkScoreResult {
  totalScored: number
  averageScore: number
  highScoreCount: number
  message: string
}

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getHealthColor(score: number): { stroke: string; bg: string; text: string; glow: string } {
  if (score >= 80) return { stroke: '#10B981', bg: 'rgba(16,185,129,0.1)', text: 'text-emerald-400', glow: 'rgba(16,185,129,0.25)' }
  if (score >= 60) return { stroke: '#1E6B3A', bg: 'rgba(30,107,58,0.1)', text: 'text-emerald-500', glow: 'rgba(30,107,58,0.25)' }
  if (score >= 40) return { stroke: '#EAB308', bg: 'rgba(234,179,8,0.1)', text: 'text-yellow-400', glow: 'rgba(234,179,8,0.2)' }
  if (score >= 20) return { stroke: '#F97316', bg: 'rgba(249,115,22,0.1)', text: 'text-orange-400', glow: 'rgba(249,115,22,0.2)' }
  return { stroke: '#EF4444', bg: 'rgba(239,68,68,0.1)', text: 'text-red-400', glow: 'rgba(239,68,68,0.2)' }
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'critical': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300', icon: ShieldAlert }
    case 'high': return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300', icon: AlertTriangle }
    case 'medium': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300', icon: AlertCircle }
    default: return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300', icon: Info }
  }
}

function getCategoryInfo(category: string) {
  switch (category) {
    case 'leads': return { icon: Users, label: 'Leads', color: 'text-blue-400' }
    case 'followups': return { icon: MessageSquare, label: 'Follow-ups', color: 'text-amber-400' }
    case 'content': return { icon: FileText, label: 'Content', color: 'text-purple-400' }
    case 'team': return { icon: UserCheck, label: 'Team', color: 'text-cyan-400' }
    case 'process': return { icon: Zap, label: 'Process', color: 'text-emerald-400' }
    default: return { icon: Lightbulb, label: category, color: 'text-slate-400' }
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'border-l-red-500'
    case 'medium': return 'border-l-amber-500'
    default: return 'border-l-slate-500'
  }
}

// ─── Health Gauge SVG Component ────────────────────────────────────────────────

function HealthGauge({ score, label, summary }: PipelineHealth) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const colors = getHealthColor(score)
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0
      const duration = 1200
      const startTime = performance.now()

      function animate(currentTime: number) {
        const elapsed = currentTime - startTime
        const fraction = Math.min(elapsed / duration, 1)
        // ease-out cubic
        const eased = 1 - Math.pow(1 - fraction, 3)
        start = Math.round(eased * score)
        setAnimatedScore(start)
        if (fraction < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, 300)
    return () => clearTimeout(timeout)
  }, [score])

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
      {/* Gauge */}
      <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          {/* Background circle */}
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(71,85,105,0.25)" strokeWidth="10" />
          {/* Progress circle */}
          <circle
            cx="70" cy="70" r={radius} fill="none"
            stroke={colors.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        {/* Glow effect behind gauge */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{ background: colors.stroke }}
        />
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold tabular-nums', colors.text)}>{animatedScore}</span>
          <span className="text-[11px] text-slate-500 font-medium">/ 100</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <Activity className={cn('w-4 h-4', colors.text)} />
          <span className={cn('text-sm font-semibold uppercase tracking-wider', colors.text)}>{label}</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-md">{summary}</p>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800" />
          <div>
            <div className="h-6 w-48 bg-slate-800 rounded" />
            <div className="h-4 w-64 bg-slate-800 rounded mt-2" />
          </div>
        </div>
        <div className="h-10 w-44 bg-slate-800 rounded-lg" />
      </div>

      {/* Health card skeleton */}
      <div className="admin-card p-6">
        <div className="flex items-center gap-8">
          <div className="w-[140px] h-[140px] rounded-full bg-slate-800" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-32 bg-slate-800 rounded" />
            <div className="h-4 w-full bg-slate-800 rounded" />
            <div className="h-4 w-3/4 bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      {/* Weekly brief skeleton */}
      <div className="admin-card p-6 space-y-4">
        <div className="h-6 w-72 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-slate-800 rounded" />)}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-slate-800 rounded" />)}
          </div>
        </div>
      </div>

      {/* Grid skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-card p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-8 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Error State ───────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 text-center px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-white text-lg font-semibold mb-2">AI Analysis Failed</h3>
      <p className="text-slate-400 text-sm max-w-md mb-6">{message}</p>
      <button onClick={onRetry} className="btn-admin btn-admin-primary gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AIInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)
  const [bulkScoring, setBulkScoring] = useState(false)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/ai/insights', { method: 'POST' })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server responded with ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setLastGenerated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AI insights')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const handleBulkScore = async () => {
    setBulkScoring(true)
    try {
      const res = await fetch('/api/admin/ai/bulk-score', { method: 'POST' })
      const json: BulkScoreResult = await res.json()
      if (res.ok) {
        toast.success(`${json.totalScored} leads scored. Avg: ${json.averageScore}. High: ${json.highScoreCount}`)
      } else {
        toast.error(json.message || 'Bulk scoring failed')
      }
    } catch {
      toast.error('Network error while scoring leads')
    } finally {
      setBulkScoring(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 md:p-6">
        <ErrorState message={error} onRetry={fetchInsights} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">AI Insights Hub</h1>
            <p className="text-slate-500 text-xs">AI-powered business intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastGenerated && (
            <span className="text-slate-600 text-xs hidden sm:inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Last generated: {lastGenerated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="btn-admin btn-admin-primary gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Generate Fresh Analysis
          </button>
        </div>
      </motion.div>

      {loading && !data ? (
        <LoadingSkeleton />
      ) : data ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* ── 1. Pipeline Health Card ──────────────────────────────────── */}
          <motion.div variants={fadeUp} custom={0}>
            <div className="admin-card overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-700/40 flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white text-sm font-semibold">Pipeline Health</h2>
              </div>
              <HealthGauge
                score={data.pipelineHealth.score}
                label={data.pipelineHealth.label}
                summary={data.pipelineHealth.summary}
              />
            </div>
          </motion.div>

          {/* ── 2. Weekly AI Brief ──────────────────────────────────────── */}
          <motion.div variants={fadeUp} custom={1}>
            <div className="admin-card overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-700/40 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#A98B4F]" />
                <h2 className="text-white text-sm font-semibold">Weekly AI Brief</h2>
              </div>
              <div className="p-6 space-y-5">
                {/* Headline */}
                <div>
                  <p className="text-lg sm:text-xl text-white font-semibold leading-snug">
                    {data.weeklyBrief.headline}
                  </p>
                </div>

                {/* Two columns: Highlights & Concerns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Highlights */}
                  <div>
                    <h3 className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Highlights
                    </h3>
                    <ul className="space-y-2.5">
                      {data.weeklyBrief.highlights.map((h, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-emerald-500 mt-0.5 shrink-0">&#x2713;</span>
                          <span className="text-slate-300">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Concerns */}
                  <div>
                    <h3 className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Concerns
                    </h3>
                    <ul className="space-y-2.5">
                      {data.weeklyBrief.concerns.map((c, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-amber-500 mt-0.5 shrink-0">&#x26A0;</span>
                          <span className="text-slate-300">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Top Opportunity */}
                <div className="border border-[#A98B4F]/30 rounded-xl bg-[#A98B4F]/5 p-4 flex items-start gap-3">
                  <Star className="w-5 h-5 text-[#A98B4F] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#A98B4F] text-xs font-semibold uppercase tracking-wider">Top Opportunity</span>
                    <p className="text-slate-200 text-sm mt-1">{data.weeklyBrief.topOpportunity}</p>
                  </div>
                </div>

                {/* Focus Areas */}
                {data.weeklyBrief.focusAreas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500 text-xs font-medium">Focus Areas:</span>
                    {data.weeklyBrief.focusAreas.map((area, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        <Target className="w-3 h-3" />
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── 3. Risk Alerts ──────────────────────────────────────────── */}
          {data.riskAlerts.length > 0 && (
            <motion.div variants={fadeUp} custom={2}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h2 className="text-white text-sm font-semibold">Risk Alerts</h2>
                <span className="badge-status bg-red-500/15 text-red-400">{data.riskAlerts.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.riskAlerts.map((alert, i) => {
                  const config = getSeverityConfig(alert.severity)
                  const IconComp = config.icon
                  return (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      custom={i}
                      className={cn(
                        'admin-card p-4 border-l-2',
                        config.border,
                        alert.severity === 'critical' && 'relative overflow-hidden'
                      )}
                    >
                      {/* Pulse overlay for critical */}
                      {alert.severity === 'critical' && (
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl animate-pulse" />
                      )}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn('badge-status text-[11px]', config.badge)}>
                            <IconComp className="w-3 h-3" />
                            {alert.severity}
                          </span>
                          <span className="text-slate-500 text-xs tabular-nums">
                            {alert.affectedCount} affected
                          </span>
                        </div>
                        <h3 className={cn('text-sm font-semibold mb-1', config.text)}>{alert.title}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed mb-2">{alert.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <ChevronRight className="w-3 h-3" />
                          <span>{alert.action}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── 4. Predictions Grid ─────────────────────────────────────── */}
          <motion.div variants={fadeUp} custom={3}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-white text-sm font-semibold">AI Predictions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Next Week Leads */}
              <motion.div variants={fadeUp} custom={0} className="admin-card p-5 stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 text-xs font-medium">Next Week Leads</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tabular-nums">{data.predictions.nextWeekLeads}</div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-xs">Predicted</span>
                </div>
              </motion.div>

              {/* Next Week Conversions */}
              <motion.div variants={fadeUp} custom={1} className="admin-card p-5 stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 text-xs font-medium">Next Week Conversions</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tabular-nums">{data.predictions.nextWeekConversions}</div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-xs">Expected closes</span>
                </div>
              </motion.div>

              {/* Pipeline Velocity */}
              <motion.div variants={fadeUp} custom={2} className="admin-card p-5 stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 text-xs font-medium">Pipeline Velocity</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <div className="text-lg font-bold text-white capitalize">{data.predictions.pipelineVelocity}</div>
                <div className="flex items-center gap-1 mt-1">
                  {data.predictions.pipelineVelocity === 'improving' && (
                    <>
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 text-xs">Trending up</span>
                    </>
                  )}
                  {data.predictions.pipelineVelocity === 'declining' && (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-red-400 text-xs">Needs attention</span>
                    </>
                  )}
                  {data.predictions.pipelineVelocity === 'stable' && (
                    <>
                      <Minus className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400 text-xs">Holding steady</span>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Conversion Probability */}
              <motion.div variants={fadeUp} custom={3} className="admin-card p-5 stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 text-xs font-medium">Conversion Probability</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tabular-nums">{data.predictions.conversionProbability}</div>
                <div className="flex items-center gap-1 mt-1">
                  <BarChart3 className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-500 text-xs">Win probability</span>
                </div>
              </motion.div>
            </div>

            {/* Info cards: Best Day & Peak Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <motion.div variants={fadeUp} custom={4} className="admin-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#A98B4F]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#A98B4F]" />
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-medium">Best Day to Contact</span>
                  <p className="text-white font-semibold text-sm">{data.predictions.bestDayToContact}</p>
                </div>
              </motion.div>
              <motion.div variants={fadeUp} custom={5} className="admin-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#A98B4F]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#A98B4F]" />
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-medium">Peak Contact Hours</span>
                  <p className="text-white font-semibold text-sm">{data.predictions.peakHours}</p>
                </div>
              </motion.div>
            </div>

            {/* Estimated Revenue */}
            <motion.div variants={fadeUp} custom={6} className="admin-card p-4 mt-4 flex items-center gap-4 border border-[#A98B4F]/20">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-slate-500 text-xs font-medium">Estimated Monthly Revenue</span>
                <p className="text-white font-semibold text-lg tabular-nums">{data.predictions.estimatedMonthlyRevenue}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── 5. Recommendations ──────────────────────────────────────── */}
          {data.recommendations.length > 0 && (
            <motion.div variants={fadeUp} custom={4}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-[#A98B4F]" />
                <h2 className="text-white text-sm font-semibold">Recommendations</h2>
                <span className="badge-status bg-[#A98B4F]/15 text-[#A98B4F]">{data.recommendations.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recommendations.map((rec, i) => {
                  const catInfo = getCategoryInfo(rec.category)
                  const CatIcon = catInfo.icon
                  return (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      custom={i}
                      className={cn('admin-card p-5 border-l-3', getPriorityColor(rec.priority))}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                            <CatIcon className={cn('w-3.5 h-3.5', catInfo.color)} />
                          </div>
                          <span className={cn('badge-status text-[10px]', rec.priority === 'high' ? 'bg-red-500/15 text-red-400' : rec.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-400')}>
                            {rec.priority}
                          </span>
                          <span className="badge-status bg-slate-800 text-slate-400 text-[10px]">{catInfo.label}</span>
                        </div>
                      </div>
                      <h3 className="text-white text-sm font-semibold mb-1.5">{rec.title}</h3>
                      <p className="text-slate-400 text-xs leading-relaxed mb-3">{rec.description}</p>
                      <div className="flex items-start gap-1.5 text-xs">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-emerald-400/80">{rec.expectedImpact}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── 6. Bottleneck Analysis ──────────────────────────────────── */}
          {data.bottleneckAnalysis && (
            <motion.div variants={fadeUp} custom={5}>
              <div className="admin-card overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-700/40 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h2 className="text-white text-sm font-semibold">Bottleneck Analysis</h2>
                </div>
                <div className="p-6 space-y-5">
                  {/* Stage bars */}
                  <div className="space-y-3">
                    {data.bottleneckAnalysis.stages.map((stage, i) => {
                      const maxCount = Math.max(...data.bottleneckAnalysis.stages.map((s) => s.count), 1)
                      const widthPct = (stage.count / maxCount) * 100
                      return (
                        <div key={i} className="group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-300 font-medium">{stage.stage}</span>
                              {stage.isBottleneck && (
                                <span className="badge-status bg-red-500/15 text-red-400 text-[10px]">
                                  <AlertTriangle className="w-3 h-3" /> Bottleneck
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="tabular-nums">{stage.count} leads</span>
                              {stage.dropOff > 0 && (
                                <span className="text-red-400/80 tabular-nums">
                                  <ArrowDownRight className="w-3 h-3 inline" /> -{stage.dropOff}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPct}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                              className={cn(
                                'h-full rounded-full',
                                stage.isBottleneck
                                  ? 'bg-gradient-to-r from-red-500 to-red-400'
                                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                              )}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Biggest bottleneck callout */}
                  <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        Biggest Bottleneck
                      </p>
                      <p className="text-slate-300 text-sm">{data.bottleneckAnalysis.biggestBottleneck}</p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <Lightbulb className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        Recommendation
                      </p>
                      <p className="text-slate-300 text-sm">{data.bottleneckAnalysis.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 7. Raw Data Summary (compact) ──────────────────────────── */}
          <motion.div variants={fadeUp} custom={6}>
            <div className="admin-card overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-700/40 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <h2 className="text-white text-sm font-semibold">Current Data Snapshot</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Total Leads', value: data.rawData.totalLeads, color: 'text-white' },
                    { label: 'This Week', value: data.rawData.thisWeekLeads, color: 'text-blue-400' },
                    { label: 'Won', value: data.rawData.wonLeads, color: 'text-emerald-400' },
                    { label: 'Lost', value: data.rawData.lostLeads, color: 'text-red-400' },
                    { label: 'Conversion', value: data.rawData.conversionRate, color: 'text-[#A98B4F]' },
                    { label: 'Overdue Follow-ups', value: data.rawData.overdueFollowUps, color: 'text-amber-400' },
                    { label: 'Unassigned', value: data.rawData.unassignedLeads, color: 'text-orange-400' },
                    { label: 'Total Site Visits', value: data.rawData.totalSiteVisits, color: 'text-cyan-400' },
                    { label: 'Pending Visits', value: data.rawData.pendingSiteVisits, color: 'text-yellow-400' },
                    { label: 'Completed Visits', value: data.rawData.completedSiteVisits, color: 'text-emerald-400' },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-2.5 rounded-lg bg-slate-800/50">
                      <div className={cn('text-lg font-bold tabular-nums', item.color)}>{item.value}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── 8. Quick Actions Bar ────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            custom={7}
            className="admin-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Quick Actions</p>
                <p className="text-slate-500 text-xs">Run AI operations on your data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkScore}
                disabled={bulkScoring}
                className="btn-admin btn-admin-primary gap-2 disabled:opacity-50"
              >
                {bulkScoring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Score All Leads
              </button>
              <button
                onClick={() => toast.info('Export report feature coming soon')}
                className="btn-admin btn-admin-secondary gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      {/* Inline error with data loaded */}
      <AnimatePresence>
        {error && data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="admin-card border-red-500/20 p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-slate-300 flex-1">{error}</p>
            <button onClick={fetchInsights} className="btn-admin btn-admin-secondary text-xs gap-1.5 shrink-0">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}