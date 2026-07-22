'use client'

import React, { useState, useCallback } from 'react'
import {
  Sparkles,
  MessageSquare,
  BarChart3,
  FileText,
  Mail,
  Phone,
  X,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Send,
  TrendingUp,
  ShieldAlert,
  Target,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface LeadData {
  id: string
  name: string
  phone: string
  email: string | null
  source: string
  status: string
  priority: string
  score: number
  project: { name: string } | null
  message: string | null
  assignedTo: string | null
  createdAt: string
  notes: { id: string; content: string; createdAt: string }[]
  activities: { id: string; type: string; description: string; createdAt: string }[]
}

type TabType = 'suggestion' | 'analysis' | 'summary' | 'email'

interface Suggestion {
  title: string
  message: string
  channel: 'whatsapp' | 'email' | 'call'
}

interface Analysis {
  score: number
  assessment: string
  risk: 'low' | 'medium' | 'high'
  hotPoints: string[]
  weaknesses: string[]
  recommendation: string
}

interface EmailDraft {
  subject: string
  body: string
}

const TABS: { id: TabType; label: string; icon: typeof Sparkles }[] = [
  { id: 'suggestion', label: 'Suggestions', icon: MessageSquare },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'email', label: 'Draft Email', icon: Mail },
]

const CHANNEL_CONFIG: Record<string, { icon: typeof Phone; label: string; color: string; bg: string }> = {
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: '#25D366', bg: 'rgba(37,211,102,0.12)' },
  email: { icon: Mail, label: 'Email', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  call: { icon: Phone, label: 'Call', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
}

const RISK_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: '#34D399', bg: 'rgba(52,211,153,0.12)', label: 'Low Risk' },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Medium Risk' },
  high: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'High Risk' },
}

function getScoreRingColor(score: number): string {
  if (score >= 75) return '#34D399'
  if (score >= 50) return '#3B82F6'
  if (score >= 25) return '#F59E0B'
  return '#EF4444'
}

function normalizePhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/[^0-9]/g, '')
  if (digits.startsWith('880')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return `880${digits}`
}

// Shimmer loading component
function ShimmerCard() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-4 w-3/4 bg-slate-700/50 rounded animate-pulse" />
      <div className="h-3 w-full bg-slate-700/30 rounded animate-pulse" />
      <div className="h-3 w-5/6 bg-slate-700/30 rounded animate-pulse" />
      <div className="h-3 w-2/3 bg-slate-700/30 rounded animate-pulse" />
      <div className="pt-2">
        <div className="h-8 w-20 bg-slate-700/40 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

function ScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const color = getScoreRingColor(score)
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(51,65,85,0.4)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] text-slate-500 font-medium">/ 100</span>
      </div>
    </div>
  )
}

export default function AILeadAssistant({
  lead,
  isOpen,
  onClose,
}: {
  lead: LeadData
  isOpen: boolean
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<TabType>('suggestion')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Results state
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null)

  const hasResult = activeTab === 'suggestion' ? !!suggestions
    : activeTab === 'analysis' ? !!analysis
    : activeTab === 'summary' ? !!summary
    : !!emailDraft

  const generate = useCallback(async (tab: TabType) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/ai/lead-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, type: tab }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }

      if (tab === 'suggestion' && data.suggestions) {
        setSuggestions(data.suggestions)
      } else if (tab === 'analysis') {
        setAnalysis(data)
      } else if (tab === 'summary' && data.summary) {
        setSummary(data.summary)
      } else if (tab === 'email' && data.subject) {
        setEmailDraft({ subject: data.subject, body: data.body })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [lead.id])

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab)
    // Auto-generate if no result for this tab yet
    const hasExisting = tab === 'suggestion' ? !!suggestions
      : tab === 'analysis' ? !!analysis
      : tab === 'summary' ? !!summary
      : !!emailDraft
    if (!hasExisting) {
      generate(tab)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const openWhatsApp = (message: string) => {
    const waUrl = `https://wa.me/${normalizePhoneForWhatsApp(lead.phone)}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  const openEmailClient = (subject: string, body: string) => {
    if (!lead.email) {
      toast.error('Lead has no email address')
      return
    }
    const mailto = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto, '_blank')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E6B3A]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#34D399]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
              <p className="text-[10px] text-slate-500">Powered by AI · {lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2.5 border-b border-slate-800 shrink-0 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1E6B3A]/20 text-[#34D399] border border-[#1E6B3A]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Error State */}
          {error && !loading && (
            <div className="mx-3 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-400 font-medium">Generation Failed</p>
                  <p className="text-[11px] text-slate-400 mt-1">{error}</p>
                  <button
                    onClick={() => generate(activeTab)}
                    className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-3 space-y-3">
              {activeTab === 'suggestion' && (
                <>
                  <ShimmerCard />
                  <ShimmerCard />
                  <ShimmerCard />
                </>
              )}
              {activeTab === 'analysis' && (
                <div className="p-4">
                  <div className="flex items-center justify-center py-8">
                    <div className="w-20 h-20 rounded-full bg-slate-700/40 animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-slate-700/30 rounded animate-pulse mt-4" />
                  <div className="h-3 w-5/6 bg-slate-700/30 rounded animate-pulse mt-2" />
                  <div className="h-3 w-3/4 bg-slate-700/30 rounded animate-pulse mt-2" />
                </div>
              )}
              {activeTab === 'summary' && (
                <div className="p-4 space-y-2">
                  <div className="h-3 w-full bg-slate-700/30 rounded animate-pulse" />
                  <div className="h-3 w-full bg-slate-700/30 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-slate-700/30 rounded animate-pulse" />
                  <div className="h-3 w-4/6 bg-slate-700/30 rounded animate-pulse" />
                </div>
              )}
              {activeTab === 'email' && (
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-slate-700/30 rounded animate-pulse" />
                  <div className="h-3 w-full bg-slate-700/30 rounded animate-pulse" />
                  <div className="h-3 w-full bg-slate-700/30 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-slate-700/30 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-slate-700/30 rounded animate-pulse" />
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {!loading && !error && (
            <div className="p-3">
              {/* SUGGESTIONS TAB */}
              {activeTab === 'suggestion' && suggestions && (
                <div className="space-y-3">
                  {suggestions.map((s, idx) => {
                    const ch = CHANNEL_CONFIG[s.channel] || CHANNEL_CONFIG.whatsapp
                    const ChIcon = ch.icon
                    return (
                      <div
                        key={idx}
                        className="bg-slate-800/50 rounded-xl border border-slate-700/40 overflow-hidden hover:border-slate-600/50 transition-colors"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-white">{s.title}</h4>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ backgroundColor: ch.bg, color: ch.color }}
                            >
                              <ChIcon className="w-3 h-3" />
                              {ch.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{s.message}</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-700/30 bg-slate-800/30">
                          <button
                            onClick={() => copyToClipboard(s.message, `sug-${idx}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
                          >
                            {copiedId === `sug-${idx}` ? (
                              <><Check className="w-3 h-3 text-[#34D399]" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy</>
                            )}
                          </button>
                          {s.channel === 'whatsapp' && (
                            <button
                              onClick={() => openWhatsApp(s.message)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors"
                              style={{ backgroundColor: '#1E6B3A' }}
                            >
                              <Send className="w-3 h-3" /> Send via WhatsApp
                            </button>
                          )}
                          {s.channel === 'email' && (
                            <button
                              onClick={() => openEmailClient(s.title, s.message)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                            >
                              <Send className="w-3 h-3" /> Open Email
                            </button>
                          )}
                          {s.channel === 'call' && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                            >
                              <Phone className="w-3 h-3" /> Call Now
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ANALYSIS TAB */}
              {activeTab === 'analysis' && analysis && (
                <div className="space-y-4">
                  {/* Score + Risk Row */}
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                    <ScoreCircle score={analysis.score} />
                    <div className="flex-1 min-w-0">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2"
                        style={{
                          backgroundColor: RISK_CONFIG[analysis.risk]?.bg,
                          color: RISK_CONFIG[analysis.risk]?.color,
                        }}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        {RISK_CONFIG[analysis.risk]?.label || analysis.risk}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">{analysis.assessment}</p>
                    </div>
                  </div>

                  {/* Hot Points */}
                  {analysis.hotPoints.length > 0 && (
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                      <h4 className="text-xs font-semibold text-[#34D399] flex items-center gap-1.5 mb-3">
                        <Zap className="w-3.5 h-3.5" /> Strengths
                      </h4>
                      <div className="space-y-2">
                        {analysis.hotPoints.map((point, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#34D399] mt-1.5 shrink-0" />
                            <span className="text-xs text-slate-300">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {analysis.weaknesses.length > 0 && (
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                      <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5" /> Areas of Concern
                      </h4>
                      <div className="space-y-2">
                        {analysis.weaknesses.map((w, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span className="text-xs text-slate-300">{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  {analysis.recommendation && (
                    <div className="p-4 bg-[#1E6B3A]/8 rounded-xl border border-[#1E6B3A]/20">
                      <h4 className="text-xs font-semibold text-[#34D399] flex items-center gap-1.5 mb-2">
                        <Target className="w-3.5 h-3.5" /> Recommended Next Step
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{analysis.recommendation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SUMMARY TAB */}
              {activeTab === 'summary' && summary && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#1E6B3A]/20 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-[#34D399]" />
                    </div>
                    <h4 className="text-sm font-medium text-white">Lead Summary</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
                  <button
                    onClick={() => copyToClipboard(summary, 'summary')}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                  >
                    {copiedId === 'summary' ? (
                      <><Check className="w-3 h-3 text-[#34D399]" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy Summary</>
                    )}
                  </button>
                </div>
              )}

              {/* EMAIL TAB */}
              {activeTab === 'email' && emailDraft && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Subject</span>
                    </div>
                    <p className="text-sm text-white font-medium">{emailDraft.subject}</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Body</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{emailDraft.body}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(`${emailDraft.subject}\n\n${emailDraft.body}`, 'email')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition-colors"
                    >
                      {copiedId === 'email' ? (
                        <><Check className="w-3.5 h-3.5 text-[#34D399]" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy Email</>
                      )}
                    </button>
                    <button
                      onClick={() => openEmailClient(emailDraft.subject, emailDraft.body)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Email
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state when no result and not loading */}
              {!hasResult && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-400 mb-1">No content yet</p>
                  <p className="text-xs text-slate-600 mb-4">Click generate to get AI-powered insights</p>
                  <button
                    onClick={() => generate(activeTab)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#1E6B3A] text-white hover:bg-[#1E6B3A]/80 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-800 shrink-0">
          <button
            onClick={() => generate(activeTab)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: loading ? undefined : '#1E6B3A',
              color: 'white',
            }}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : hasResult ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate {TABS.find((t) => t.id === activeTab)?.label}
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate {TABS.find((t) => t.id === activeTab)?.label}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}