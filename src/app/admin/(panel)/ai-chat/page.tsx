'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  BarChart3,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Target,
  Building2,
  PenLine,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SuggestedPrompt {
  icon: React.ReactNode
  title: string
  prompt: string
  accent: string
}

interface QuickAction {
  icon: React.ReactNode
  label: string
  prompt: string
}

// ── Data ───────────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Sales Pipeline',
    prompt: 'How is my sales pipeline performing this week?',
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Lead Attention',
    prompt: 'Which leads need immediate attention?',
    accent: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Conversion Tips',
    prompt: 'What can I do to improve conversion rate?',
    accent: 'from-cyan-500/20 to-cyan-500/5',
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    title: 'Project Analysis',
    prompt: 'Give me a project comparison analysis',
    accent: 'from-violet-500/20 to-violet-500/5',
  },
  {
    icon: <PenLine className="w-5 h-5" />,
    title: 'Content Ideas',
    prompt: 'Suggest 3 blog post topics for this week',
    accent: 'from-pink-500/20 to-pink-500/5',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Daily Focus',
    prompt: 'What should I focus on today?',
    accent: 'from-orange-500/20 to-orange-500/5',
  },
]

const QUICK_ACTIONS: QuickAction[] = [
  { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Pipeline Summary', prompt: 'Give me a quick pipeline summary for this week' },
  { icon: <Users className="w-3.5 h-3.5" />, label: 'Lead Analysis', prompt: 'Analyze my current leads and highlight any hot leads' },
  { icon: <FileText className="w-3.5 h-3.5" />, label: 'Content Ideas', prompt: 'Suggest blog post and social media content ideas' },
  { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Weekly Report', prompt: 'Generate a weekly business report summary' },
]

// ── Markdown-like renderer ─────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.replace(/^\*\*|\*\*$/g, '')}
        </strong>
      )
    }
    // Inline code
    const codeParts = part.split(/(`[^`]+`)/g)
    if (codeParts.length > 1) {
      return (
        <span key={i}>
          {codeParts.map((cp, j) =>
            /^`[^`]+`$/.test(cp) ? (
              <code key={j} className="bg-slate-700/60 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">
                {cp.replace(/^`|`$/g, '')}
              </code>
            ) : (
              <span key={j}>{cp}</span>
            )
          )}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function renderContent(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false

  lines.forEach((line, i) => {
    const key = `${i}-${line.slice(0, 20)}`

    // Close list if we were in one
    if (inList && !/^[-•]\s/.test(line) && !/^\d+\.\s/.test(line)) {
      inList = false
    }

    // Bullet points
    if (/^[-•]\s/.test(line)) {
      const content = line.replace(/^[-•]\s*/, '')
      elements.push(
        <div key={key} className="flex gap-2.5 ml-0.5">
          <span className="text-emerald-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0" />
          <span className="text-slate-300 leading-relaxed">{renderInline(content)}</span>
        </div>
      )
      inList = true
      return
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/)
      if (match) {
        elements.push(
          <div key={key} className="flex gap-2.5 ml-0.5">
            <span className="text-emerald-400 font-medium text-sm shrink-0 mt-px">{match[1]}.</span>
            <span className="text-slate-300 leading-relaxed">{renderInline(match[2])}</span>
          </div>
        )
        inList = true
        return
      }
    }

    // Headers
    if (/^###\s/.test(line)) {
      elements.push(
        <h4 key={key} className="font-semibold text-white mt-4 mb-1.5 text-sm">
          {renderInline(line.replace(/^###\s*/, ''))}
        </h4>
      )
      return
    }
    if (/^##\s/.test(line)) {
      elements.push(
        <h3 key={key} className="font-semibold text-white text-base mt-4 mb-2">
          {renderInline(line.replace(/^##\s*/, ''))}
        </h3>
      )
      return
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={key} className="h-2.5" />)
      return
    }

    // Normal paragraph
    elements.push(
      <p key={key} className="text-slate-300 leading-relaxed">
        {renderInline(line)}
      </p>
    )
  })

  return elements
}

// ── Typing Indicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-emerald-400"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ── Time format ────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Animation variants ─────────────────────────────────────────────────────

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const welcomeVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' },
  }),
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)

  const isEmpty = messages.length === 0

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!isInitialMount.current) {
      scrollToBottom()
    } else {
      isInitialMount.current = false
    }
  }, [messages, loading, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 112) + 'px'
    }
  }, [input])

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setShowSuggestions(false)
      setLoading(true)

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      try {
        const newHistory = [...history, { role: 'user', content: trimmed }]

        const res = await fetch('/api/admin/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history: newHistory }),
        })

        const data = await res.json()

        if (res.ok && data.reply) {
          const aiMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.reply,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, aiMsg])
          setHistory([...newHistory, { role: 'assistant', content: data.reply }])
        } else {
          const errMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.error || 'Sorry, something went wrong. Please try again.',
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, errMsg])
        }
      } catch {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Network error. Please check your connection and try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setLoading(false)
        textareaRef.current?.focus()
      }
    },
    [history, loading]
  )

  // New chat
  const handleNewChat = () => {
    setMessages([])
    setHistory([])
    setInput('')
    setShowSuggestions(true)
    isInitialMount.current = true
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E6B3A] to-[#1E6B3A]/60 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight tracking-tight">AI Assistant</h1>
            <p className="text-slate-500 text-xs mt-0.5">Your intelligent business copilot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEmpty && (
            <button
              onClick={() => setShowSuggestions((prev) => !prev)}
              className="btn-admin btn-admin-secondary text-xs gap-1.5"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showSuggestions && 'rotate-180')} />
              Prompts
            </button>
          )}
          <button
            onClick={handleNewChat}
            className="btn-admin btn-admin-secondary text-xs gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </header>

      {/* ── Main Content Area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto admin-scrollbar px-4 sm:px-6 py-6"
        >
          <div className="max-w-3xl mx-auto">
            {/* ── Welcome + Suggested Prompts ─────────────────────────── */}
            <AnimatePresence>
              {(isEmpty && showSuggestions) && (
                <motion.div
                  key="suggestions"
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
                  className="flex flex-col items-center text-center px-2"
                >
                  {/* Hero icon */}
                  <motion.div
                    custom={0}
                    variants={welcomeVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1E6B3A]/20 to-[#1E6B3A]/5 border border-[#1E6B3A]/20 flex items-center justify-center mb-6"
                  >
                    <Sparkles className="w-9 h-9 text-emerald-400" />
                  </motion.div>

                  <motion.h2
                    custom={1}
                    variants={welcomeVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-white text-2xl sm:text-3xl font-semibold mb-2 tracking-tight"
                  >
                    How can I help you today?
                  </motion.h2>
                  <motion.p
                    custom={2}
                    variants={welcomeVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-slate-500 text-sm sm:text-base mb-10 max-w-lg"
                  >
                    I have access to your live business data — leads, projects, site visits, and more. Ask me anything about your real estate operations.
                  </motion.p>

                  {/* Suggested prompt cards */}
                  <motion.div
                    custom={3}
                    variants={welcomeVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl"
                  >
                    {SUGGESTED_PROMPTS.map((item, idx) => (
                      <motion.button
                        key={item.title}
                        custom={4 + idx}
                        variants={welcomeVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => sendMessage(item.prompt)}
                        className={cn(
                          'group text-left p-4 rounded-xl border border-slate-800 bg-slate-900/80',
                          'hover:border-[#A98B4F]/40 hover:bg-slate-900',
                          'transition-colors duration-200'
                        )}
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3',
                          'text-slate-400 group-hover:text-white transition-colors',
                          item.accent
                        )}>
                          {item.icon}
                        </div>
                        <h3 className="text-sm font-medium text-slate-200 group-hover:text-white mb-1 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 group-hover:text-slate-400 leading-relaxed transition-colors line-clamp-2">
                          {item.prompt}
                        </p>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Chat Messages ────────────────────────────────────────── */}
            {(!isEmpty || !showSuggestions) && (
              <div className="space-y-5">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      layout
                      className={cn(
                        'flex gap-3',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {/* AI Avatar */}
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E6B3A] to-[#1E6B3A]/70 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-500/10">
                          <Sparkles className="w-4 h-4 text-emerald-300" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div className="flex flex-col gap-1 min-w-0 max-w-[80%] sm:max-w-[70%]">
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                            msg.role === 'assistant'
                              ? 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm'
                              : 'bg-slate-800 text-slate-100 rounded-tr-sm'
                          )}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="space-y-1.5">{renderContent(msg.content)}</div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] text-slate-600 px-1',
                            msg.role === 'user' ? 'text-right' : 'text-left'
                          )}
                        >
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* User Avatar */}
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-slate-400">A</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E6B3A] to-[#1E6B3A]/70 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-500/10">
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                        <TypingIndicator />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Input Area ───────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 pb-4 pt-3">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 bg-slate-900/80 border border-slate-800 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap shrink-0"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2.5">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about leads, projects, sales..."
                  rows={1}
                  disabled={loading}
                  className="w-full resize-none rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 pr-16 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1E6B3A]/40 focus:border-[#1E6B3A]/40 disabled:opacity-50 transition-all duration-200"
                  style={{ maxHeight: '112px' }}
                />
                {/* Character count (shown when > 100 chars) */}
                {input.length > 100 && (
                  <span className={cn(
                    'absolute right-14 bottom-2.5 text-[10px] font-mono',
                    input.length > 500 ? 'text-amber-400' : 'text-slate-600'
                  )}>
                    {input.length}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-admin btn-admin-primary shrink-0 h-11 w-11 p-0 rounded-xl"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>

              {/* Clear history */}
              {!isEmpty && (
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="btn-admin btn-admin-secondary shrink-0 h-11 w-11 p-0 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </form>

            <p className="text-center text-[10px] text-slate-700">
              AI has access to live business data. Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-500 font-mono text-[9px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-500 font-mono text-[9px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}