'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Brain,
  Zap,
  MessageSquare,
  BarChart3,
  FileText,
  Send,
  ExternalLink,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIInsightsData {
  pipelineHealth?: {
    score: number
    label: string
    summary?: string
  }
  riskAlerts?: Array<{
    severity: string
    title: string
    description: string
    action: string
    affectedCount?: number
  }>
  recommendations?: Array<{
    priority: string
    category: string
    title: string
    description: string
  }>
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

type Tab = 'insights' | 'actions' | 'chat'

// ─── Cache helper ────────────────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let insightsCache: { data: AIInsightsData; timestamp: number } | null = null

function getCachedInsights(): AIInsightsData | null {
  if (insightsCache && Date.now() - insightsCache.timestamp < CACHE_TTL) {
    return insightsCache.data
  }
  return null
}

function setCachedInsights(data: AIInsightsData) {
  insightsCache = { data, timestamp: Date.now() }
}

// ─── Severity color helper ───────────────────────────────────────────────────

function severityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'high':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'medium':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  }
}

function healthScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
  if (score >= 60) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  if (score >= 40) return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  return 'bg-red-500/15 text-red-400 border-red-500/30'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIFloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('insights')
  const [insights, setInsights] = useState<AIInsightsData | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [bulkScoring, setBulkScoring] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Click outside to close ────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // ── Escape to close ───────────────────────────────────────────────────────
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Focus input when switching to chat tab ────────────────────────────────
  useEffect(() => {
    if (activeTab === 'chat' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [activeTab, isOpen])

  // ── Fetch insights ────────────────────────────────────────────────────────
  const fetchInsights = useCallback(async () => {
    const cached = getCachedInsights()
    if (cached) {
      setInsights(cached)
      return
    }

    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const res = await fetch('/api/admin/ai/insights', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to fetch insights')
      const data = await res.json()
      setInsights(data)
      setCachedInsights(data)
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  // ── Fetch insights when panel opens to insights tab ───────────────────────
  useEffect(() => {
    if (isOpen && activeTab === 'insights' && !insights && !insightsLoading) {
      fetchInsights()
    }
  }, [isOpen, activeTab, insights, insightsLoading, fetchInsights])

  // ── Send chat message ─────────────────────────────────────────────────────
  const sendChatMessage = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || chatLoading) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setChatInput('')
    setChatLoading(true)

    try {
      const history = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      })
      if (!res.ok) throw new Error('Failed to get response')
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I could not process that. Please try again.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  // ── Bulk score action ─────────────────────────────────────────────────────
  const handleBulkScore = async () => {
    setBulkScoring(true)
    try {
      const res = await fetch('/api/admin/ai/bulk-score', { method: 'POST' })
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '✅ Bulk lead scoring completed! Check the Leads page for updated scores.',
          },
        ])
      } else {
        throw new Error('Failed')
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Bulk scoring failed. Please try again from the AI Insights page.' },
      ])
    } finally {
      setBulkScoring(false)
    }
  }

  // ── Determine if there are "unread" insights (for pulse) ──────────────────
  const hasUnread = !insights && !insightsLoading && !insightsError

  // ── Tabs config ───────────────────────────────────────────────────────────
  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'insights', label: 'Insights', icon: <Brain className="w-3.5 h-3.5" /> },
    { key: 'actions', label: 'Actions', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'chat', label: 'Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ]

  // ── Quick actions config ──────────────────────────────────────────────────
  const quickActions = [
    {
      label: 'Score All Leads',
      description: 'AI bulk lead scoring',
      icon: <Zap className="w-5 h-5" />,
      onClick: handleBulkScore,
      loading: bulkScoring,
    },
    {
      label: 'Generate Content',
      description: 'AI content writer',
      icon: <FileText className="w-5 h-5" />,
      href: '/admin/ai-content',
    },
    {
      label: 'View Dashboard',
      description: 'Analytics overview',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/admin/dashboard',
    },
    {
      label: 'Open AI Chat',
      description: 'Full chat interface',
      icon: <MessageSquare className="w-5 h-5" />,
      href: '/admin/ai-chat',
    },
  ]

  return (
    <>
      {/* ─── Floating Button ─── */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/30 transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 group"
        style={{
          background: 'linear-gradient(135deg, #1E6B3A 0%, #15803d 50%, #166534 100%)',
        }}
        aria-label="AI Assistant"
        title="AI Assistant"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}

        {/* Pulse ring for unread */}
        {!isOpen && hasUnread && (
          <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/20 pointer-events-none" />
        )}

        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700/50 shadow-lg">
          AI Assistant
          <span className="absolute top-full right-4 w-2 h-2 bg-slate-800 border-r border-b border-slate-700/50 rotate-45 -mt-1" />
        </span>
      </button>

      {/* ─── Expandable Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E6B3A 0%, #166534 100%)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">AI Quick Insights</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-slate-800 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="ai-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-400 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            <div className="flex-1 overflow-y-auto admin-scrollbar">
              {/* ───── Insights Tab ───── */}
              {activeTab === 'insights' && (
                <div className="p-4 space-y-4">
                  {insightsLoading ? (
                    <div className="space-y-3">
                      {/* Skeleton: health score */}
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
                        <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
                      </div>
                      {/* Skeleton: risk alerts */}
                      {[1, 2].map((i) => (
                        <div key={i} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/30 space-y-2 animate-pulse">
                          <div className="h-3 w-20 bg-slate-700 rounded" />
                          <div className="h-3 w-full bg-slate-700/50 rounded" />
                        </div>
                      ))}
                      {/* Skeleton: recommendation */}
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/30 space-y-2 animate-pulse">
                        <div className="h-3 w-24 bg-slate-700 rounded" />
                        <div className="h-3 w-full bg-slate-700/50 rounded" />
                      </div>
                    </div>
                  ) : insightsError ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-400/50 mb-2" />
                      <p className="text-sm text-slate-400">{insightsError}</p>
                      <button
                        onClick={fetchInsights}
                        className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ) : insights ? (
                    <>
                      {/* Pipeline Health Score */}
                      {insights.pipelineHealth && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Pipeline Health</span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${healthScoreColor(insights.pipelineHealth.score)}`}
                          >
                            {insights.pipelineHealth.score}/100
                            <span className="font-normal opacity-80">{insights.pipelineHealth.label}</span>
                          </span>
                        </div>
                      )}

                      {/* Top 2 Risk Alerts */}
                      {insights.riskAlerts && insights.riskAlerts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Risk Alerts
                          </p>
                          {insights.riskAlerts.slice(0, 2).map((alert, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-xl border ${severityColor(alert.severity)}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold">{alert.title}</span>
                                {alert.affectedCount != null && (
                                  <span className="text-[10px] opacity-70">{alert.affectedCount}</span>
                                )}
                              </div>
                              <p className="text-[11px] leading-relaxed opacity-80">
                                {alert.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Top Recommendation */}
                      {insights.recommendations && insights.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            Top Recommendation
                          </p>
                          <div className="p-3 rounded-xl bg-[#1E6B3A]/10 border border-[#1E6B3A]/20">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-[#A98B4F] mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-white">
                                  {insights.recommendations[0].title}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {insights.recommendations[0].description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* View Full Analysis link */}
                      <Link
                        href="/admin/ai-insights"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 rounded-xl transition-colors"
                      >
                        View Full Analysis
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </>
                  ) : null}
                </div>
              )}

              {/* ───── Actions Tab ───── */}
              {activeTab === 'actions' && (
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => {
                      const isLink = 'href' in action && action.href
                      const Wrapper: React.ElementType = isLink ? Link : 'button'
                      const wrapperProps: Record<string, unknown> = isLink
                        ? { href: action.href, onClick: () => setIsOpen(false) }
                        : {
                            onClick: action.onClick,
                            disabled: action.loading,
                          }

                      return (
                        <Wrapper
                          key={action.label}
                          {...wrapperProps}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1E6B3A]/5 border border-[#1E6B3A]/15 hover:bg-[#1E6B3A]/10 hover:border-[#1E6B3A]/25 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#1E6B3A]/15 flex items-center justify-center text-emerald-400 group-hover:bg-[#1E6B3A]/25 transition-colors">
                            {action.loading ? (
                              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                            ) : (
                              action.icon
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{action.label}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{action.description}</p>
                          </div>
                        </Wrapper>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ───── Chat Tab ───── */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto admin-scrollbar px-4 py-3 space-y-3" style={{ maxHeight: '360px' }}>
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-2xl bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 flex items-center justify-center mb-3">
                          <Sparkles className="w-5 h-5 text-[#A98B4F]" />
                        </div>
                        <p className="text-sm font-medium text-slate-300">Ask me anything</p>
                        <p className="text-xs text-slate-500 mt-1">
                          I have access to your business data
                        </p>
                      </div>
                    ) : (
                      messages.slice(-5).map((msg, i) => (
                        <div
                          key={`${msg.role}-${i}`}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-[#1E6B3A]/20 text-emerald-50 rounded-br-md'
                                : 'bg-slate-800 text-slate-200 rounded-bl-md border border-slate-700/30'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700/30 rounded-2xl rounded-bl-md px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Open Full Chat link */}
                  <div className="px-4 pt-1 pb-1 shrink-0">
                    <Link
                      href="/admin/ai-chat"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1 text-[10px] text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      Open Full Chat
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>

                  {/* Input */}
                  <div className="px-3 pb-3 pt-1 shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        sendChatMessage()
                      }}
                      className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 focus-within:border-[#1E6B3A]/40 transition-colors"
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask AI..."
                        disabled={chatLoading}
                        className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className="p-1.5 rounded-lg bg-[#1E6B3A] text-white hover:bg-[#166534] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Send"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}