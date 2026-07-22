'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'
import { useSiteSettings } from '@/lib/use-site-settings'
import { useT } from '@/lib/use-ui-strings'

interface ChatMessage {
  id: number
  text: string
  isBot: boolean
  time: string
}

const DEFAULT_QUICK_REPLIES = [
  'Book a Plot',
  'Site Visit',
  'Project Details',
  'Contact Sales',
]

/** Parse the admin `chatQuickReplies` JSON string → string[]; fall back on any malformed input. */
function parseQuickReplies(raw: string | undefined): string[] {
  if (!raw) return DEFAULT_QUICK_REPLIES
  try {
    const v: unknown = JSON.parse(raw)
    if (Array.isArray(v)) {
      const items = v.map(String).filter((s) => s.trim().length > 0)
      if (items.length > 0) return items
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_QUICK_REPLIES
}

const DEFAULT_GREETING = 'Hi! 👋 Welcome to MATRICA. How can we help you today?'

function getTimeString(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Human-like typing delay: 600-1500ms random base plus a length-proportional
 * component (people take longer to "type" longer replies), capped at 2.5s.
 */
function typingDelayFor(reply: string): number {
  const base = 600 + Math.random() * 900
  const proportional = reply.length * 12
  return Math.min(base + proportional, 2500)
}

export default function QuickChatWidget() {
  const settings = useSiteSettings()
  const t = useT()
  const quickReplies = parseQuickReplies(settings.chatQuickReplies)
  const [isOpen, setIsOpen] = useState(false)
  const [personaName, setPersonaName] = useState('MATRICA Support')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      text: DEFAULT_GREETING,
      isBot: true,
      time: getTimeString(),
    },
  ])
  const [input, setInput] = useState('')
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)
  const messagesRef = useRef<ChatMessage[]>([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Fetch admin-configured greeting + persona name (public-safe GET).
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/chat')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.personaName && typeof data.personaName === 'string') {
          setPersonaName(data.personaName)
        }
        if (data.greeting && typeof data.greeting === 'string') {
          setMessages((prev) => {
            // Only swap the greeting if the visitor hasn't chatted yet.
            if (prev.length === 1 && prev[0].id === 0) {
              return [{ ...prev[0], text: data.greeting }]
            }
            return prev
          })
        }
      } catch {
        // Keep defaults — greeting endpoint is best-effort.
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const addBotMessage = (text: string) => {
    const id = nextId.current++
    setMessages((prev) => [...prev, { id, text, isBot: true, time: getTimeString() }])
  }

  const addUserMessage = (text: string) => {
    const id = nextId.current++
    setMessages((prev) => [...prev, { id, text, isBot: false, time: getTimeString() }])
  }

  const fetchBotResponse = async (userMessage: string) => {
    setIsTyping(true)
    // Last 10 messages (before the one being sent) as multi-turn context.
    const history = messagesRef.current.slice(-10).map((m) => ({
      role: m.isBot ? 'assistant' : 'user',
      content: m.text,
    }))
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history }),
      })
      const data = await res.json()
      const reply = data.reply || t('chrome.quickchat.error.generic')
      // Human-like pause with the typing indicator showing before the reply lands.
      await new Promise((resolve) => setTimeout(resolve, typingDelayFor(reply)))
      addBotMessage(reply)
    } catch {
      addBotMessage(t('chrome.quickchat.error.network'))
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    setShowQuickReplies(false)
    addUserMessage(reply)
    fetchBotResponse(reply)
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setShowQuickReplies(false)
    addUserMessage(text)
    fetchBotResponse(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed fab-chat z-50 flex flex-col items-end">
      {isOpen && (
        <div
          className="mb-3 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden border border-[#1E6B3A]/30 bg-[#FFFFFF] flex flex-col"
          style={{ maxHeight: 'min(480px, calc(100dvh - 15rem))' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFB] border-b border-[#1E6B3A]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1E6B3A]/20 border border-[#1E6B3A]/30 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#1E6B3A]" />
                </div>
                <div>
                  <p className="text-[#1A202C] text-sm font-semibold leading-tight">
                    {personaName}
                  </p>
                  <p className="text-[#1E6B3A] text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {t('chrome.quickchat.status.online')}
                    <span className="text-[#475569]/50 ml-1">{t('chrome.quickchat.status.aipowered')}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#475569] hover:text-[#1A202C] transition-colors"
                aria-label={t('chrome.quickchat.aria.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] ${msg.isBot ? '' : 'flex flex-col items-end'}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.isBot
                          ? 'bg-gradient-to-br from-[#F1F5F9] to-[#F8FAFB] text-[#1A202C] rounded-bl-md border border-[#1E6B3A]/5'
                          : 'bg-[#1E6B3A] text-[#FFFFFF] font-medium rounded-br-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className={`text-[10px] text-[#475569]/50 mt-1 ${msg.isBot ? 'text-left ml-1' : 'text-right mr-1'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#F1F5F9] rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 border border-[#1E6B3A]/5">
                    <span className="w-2 h-2 rounded-full bg-[#1E6B3A]/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#1E6B3A]/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#1E6B3A]/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />

              {/* Quick Replies */}
              {showQuickReplies && messages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#1E6B3A]/30 text-[#1E6B3A] bg-[#1E6B3A]/5 hover:bg-[#1E6B3A]/15 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[#1E6B3A]/20 p-3 bg-[#F8FAFB]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chrome.quickchat.input.placeholder')}
                  className="flex-1 bg-[#FFFFFF] border border-border rounded-lg px-3 py-2 text-sm text-[#1A202C] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#1E6B3A]/40 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-9 h-9 rounded-lg bg-[#1E6B3A] text-[#FFFFFF] flex items-center justify-center hover:bg-[#1E6B3A]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  aria-label={t('chrome.quickchat.aria.send')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-[#1E6B3A] text-[#FFFFFF] hover:bg-[#1E6B3A]/90 transition-all flex items-center justify-center group"
          aria-label={t('chrome.quickchat.aria.open')}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
