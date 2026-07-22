'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck, Trash2, Loader2, Inbox, ExternalLink, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdBy: string | null
  createdAt: string
}

/** Map a notification type to an icon + accent color. */
function typeStyle(type: string): { Icon: LucideIcon; color: string } {
  const t = type.toLowerCase()
  if (t.includes('success')) return { Icon: CheckCircle, color: 'text-emerald-400' }
  if (t.includes('warn')) return { Icon: AlertTriangle, color: 'text-amber-400' }
  if (t.includes('error') || t.includes('danger') || t.includes('fail')) return { Icon: XCircle, color: 'text-red-400' }
  return { Icon: Info, color: 'text-sky-400' }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return value
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=100')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNotifications(Array.isArray(data.notifications) ? data.notifications : [])
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0)
    } catch {
      toast.error('Failed to load notifications')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markRead = async (n: Notification) => {
    if (n.read) return
    const snapshot = notifications
    setNotifications((prev) => prev.map((it) => (it.id === n.id ? { ...it, read: true } : it)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      const res = await fetch(`/api/admin/notifications/${n.id}`, { method: 'PUT' })
      const data = await res.json()
      if (!data.success) throw new Error()
    } catch {
      setNotifications(snapshot)
      setUnreadCount((c) => c + 1)
      toast.error('Failed to mark as read')
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0) return
    setMarkingAll(true)
    const snapshot = notifications
    setNotifications((prev) => prev.map((it) => ({ ...it, read: true })))
    setUnreadCount(0)
    try {
      const res = await fetch('/api/admin/notifications?all=true', { method: 'PUT' })
      const data = await res.json()
      if (!data.success) throw new Error()
      toast.success('All notifications marked as read')
    } catch {
      setNotifications(snapshot)
      toast.error('Failed to mark all as read')
      fetchNotifications()
    }
    setMarkingAll(false)
  }

  const remove = async (n: Notification) => {
    const snapshot = notifications
    const wasUnread = !n.read
    setNotifications((prev) => prev.filter((it) => it.id !== n.id))
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
    try {
      const res = await fetch(`/api/admin/notifications/${n.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error()
      toast.success('Notification deleted')
    } catch {
      setNotifications(snapshot)
      if (wasUnread) setUnreadCount((c) => c + 1)
      toast.error('Failed to delete notification')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-[#1E6B3A]/20 text-[#34D399] border border-[#1E6B3A]/30 text-xs font-medium px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <button onClick={markAllRead} disabled={markingAll || unreadCount === 0} className="btn-admin btn-admin-secondary text-sm">
          {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-800/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`skel-${i}`} className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-700/50 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded bg-slate-700/50 animate-pulse w-1/3" />
                  <div className="h-3 rounded bg-slate-700/50 animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
                <Inbox className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No notifications</p>
              <p className="text-slate-600 text-xs mt-1.5">You&apos;re all caught up.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {notifications.map((n) => {
              const { Icon, color } = typeStyle(n.type)
              return (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 transition-colors hover:bg-slate-800/40 ${n.read ? '' : 'bg-[#1E6B3A]/5'}`}
                >
                  <span className={`flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#34D399] shrink-0" aria-label="Unread" />}
                      <p className={`text-sm truncate ${n.read ? 'text-slate-300' : 'text-white font-medium'}`}>{n.title}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 break-words">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span>{formatDate(n.createdAt)}</span>
                      {n.createdBy && <span>· {n.createdBy}</span>}
                      {n.link && (
                        <Link href={n.link} className="inline-flex items-center gap-1 text-[#34D399] hover:underline">
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => markRead(n)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#34D399] hover:bg-slate-700 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => remove(n)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
