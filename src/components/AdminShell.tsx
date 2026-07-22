'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import AdminBreadcrumb from '@/components/AdminBreadcrumb'
import AdminCommandPalette from '@/components/AdminCommandPalette'
import AIFloatingAssistant from '@/components/AIFloatingAssistant'
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav'
import { hasPermission } from '@/lib/permissions'
import {
  Users,
  Building2,
  Star,
  FileText,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Bell,
  Search,
  User,
  Activity,
  CheckCheck,
  Command,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
  href: string
  meta: string
}

interface SearchResults {
  leads: SearchResult[]
  projects: SearchResult[]
  blogPosts: SearchResult[]
  siteVisits: SearchResult[]
  testimonials: SearchResult[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString()
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}

// ─── Notification Icon ────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'lead_created':
      return <User className="w-4 h-4 text-emerald-400" />
    case 'site_visit':
      return <CalendarCheck className="w-4 h-4 text-amber-400" />
    case 'status_change':
      return <Activity className="w-4 h-4 text-blue-400" />
    case 'system':
      return <Settings className="w-4 h-4 text-slate-400" />
    default:
      return <Bell className="w-4 h-4 text-slate-400" />
  }
}

// ─── NotificationCenter ───────────────────────────────────────────────────────

function NotificationCenter() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=20')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Poll every 30 seconds — skip ticks while the tab is hidden (the
  // focus listener below refreshes immediately on return)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifications()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Refetch on window focus
  useEffect(() => {
    const onFocus = () => fetchNotifications()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchNotifications])

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const markAllRead = async () => {
    try {
      await fetch('/api/admin/notifications?all=true', { method: 'PUT' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // silent
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await fetch(`/api/admin/notifications/${notification.id}`, { method: 'PUT' })
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // silent
      }
    }
    setOpen(false)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const displayCount = unreadCount > 99 ? '99+' : unreadCount

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 transition-opacity animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto admin-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Bell className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-800/60 transition-colors border-l-2 ${
                    n.read ? 'border-l-transparent' : 'border-l-[#1E6B3A] bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <NotificationIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#1E6B3A] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {truncate(n.message, 80)}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800 px-4 py-2.5">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-center block w-full text-slate-400 hover:text-emerald-400 transition-colors"
            >
              View All
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Search Icon by type ──────────────────────────────────────────────────────

function SearchIcon({ type }: { type: string }) {
  switch (type) {
    case 'lead':
      return <Users className="w-4 h-4 text-emerald-400" />
    case 'project':
      return <Building2 className="w-4 h-4 text-amber-400" />
    case 'blogPost':
      return <FileText className="w-4 h-4 text-violet-400" />
    case 'siteVisit':
      return <CalendarCheck className="w-4 h-4 text-sky-400" />
    case 'testimonial':
      return <Star className="w-4 h-4 text-pink-400" />
    default:
      return <Search className="w-4 h-4 text-slate-400" />
  }
}

// ─── GlobalSearch ─────────────────────────────────────────────────────────────

function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build flat list for keyboard navigation
  const flatResults = results
    ? [
        ...(results.leads || []),
        ...(results.projects || []),
        ...(results.blogPosts || []),
        ...(results.siteVisits || []),
        ...(results.testimonials || []),
      ]
    : []

  const totalResults = flatResults.length

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
        setSelectedIndex(-1)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setOpen(true)
    setSelectedIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value)
    }, 300)
  }

  const handleFocus = () => {
    setOpen(true)
    if (query.length >= 2 && !results) {
      doSearch(query)
    }
  }

  const handleSelect = (href: string) => {
    setOpen(false)
    setQuery('')
    setResults(null)
    inputRef.current?.blur()
    router.push(href)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < totalResults - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalResults - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < totalResults) {
          handleSelect(flatResults[selectedIndex].href)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Compute which index each section starts at
  const sectionRanges = results
    ? [
        { key: 'leads' as const, items: results.leads, label: 'Leads' },
        { key: 'projects' as const, items: results.projects, label: 'Projects' },
        { key: 'blogPosts' as const, items: results.blogPosts, label: 'Blog Posts' },
        { key: 'siteVisits' as const, items: results.siteVisits, label: 'Site Visits' },
        { key: 'testimonials' as const, items: results.testimonials, label: 'Testimonials' },
      ]
    : []

  let runningIndex = 0

  return (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="admin-input pl-9 py-2 w-64 text-sm"
        />
      </div>

      {open && query.length >= 2 && (
        <div className="absolute left-0 top-full mt-2 w-[420px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 transition-opacity animate-in fade-in slide-in-from-top-2">
          <div className="max-h-80 overflow-y-auto admin-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
              </div>
            ) : totalResults === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Search className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No results found</p>
                <p className="text-xs text-slate-600 mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="py-1">
                {sectionRanges.map((section) => {
                  if (section.items.length === 0) return null
                  const startIdx = runningIndex
                  const sectionItems = section.items.map((item, i) => {
                    const globalIdx = startIdx + i
                    const isSelected = globalIdx === selectedIndex
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.href)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-slate-800/60 transition-colors flex items-center gap-3 ${
                          isSelected ? 'bg-slate-800/60' : ''
                        }`}
                      >
                        <SearchIcon type={item.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                        {item.meta && (
                          <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                            {item.meta}
                          </span>
                        )}
                      </button>
                    )
                  })
                  runningIndex += section.items.length
                  return (
                    <div key={section.key}>
                      <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {section.label}
                      </div>
                      {sectionItems}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Navigation Config ────────────────────────────────────────────────────────
// Single source of truth lives in src/lib/admin-nav.ts (shared with the command palette).

const navItems = ADMIN_NAV_ITEMS

// ─── AdminShell ───────────────────────────────────────────────────────────────

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  // Optimistic auth: the middleware already gates /admin behind the session
  // cookie, so if we saw a valid user earlier this session render the shell
  // immediately and let checkAuth() revalidate in the background instead of
  // blanking the whole panel behind a DB round trip on every hard load.
  //
  // NOTE: the sessionStorage read MUST happen in a post-mount effect, not a
  // useState initializer — the server has no sessionStorage and always renders
  // the loading state, so reading it during the initial client render would
  // diverge from the SSR HTML and trigger a hydration mismatch.
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [user, setUser] = useState<{ name: string; role: string; permissions?: string | null } | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('admin-auth-user')
      if (raw) {
        setUser(JSON.parse(raw))
        setAuthed(true)
      }
    } catch { /* ignore */ }
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({})

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard?badgeCounts=true')
      if (res.ok) {
        const data = await res.json()
        setBadgeCounts({
          newLeads: data.badgeCounts?.newLeads || 0,
          pendingVisits: data.badgeCounts?.pendingVisits || 0,
        })
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchBadgeCounts()
  }, [fetchBadgeCounts])
  useEffect(() => {
    const i = setInterval(() => { if (!document.hidden) fetchBadgeCounts() }, 120000)
    return () => clearInterval(i)
  }, [fetchBadgeCounts])

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth')
      const data = await res.json()
      if (data.authenticated) {
        setAuthed(true)
        setUser(data.user)
        try { sessionStorage.setItem('admin-auth-user', JSON.stringify(data.user)) } catch {}
      } else {
        try { sessionStorage.removeItem('admin-auth-user') } catch {}
        setAuthed(false)
        router.push('/admin/login')
      }
    } catch {
      // Network hiccup — if we rendered optimistically from cache, keep the
      // shell up rather than bouncing an already-working session to login.
      let hasCached = false
      try { hasCached = !!sessionStorage.getItem('admin-auth-user') } catch {}
      if (!hasCached) {
        setAuthed(false)
        router.push('/admin/login')
      }
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const logout = async () => {
    try { sessionStorage.removeItem('admin-auth-user') } catch {}
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1E6B3A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authed) return null

  // Only show nav items the current user can at least read.
  const visibleNavItems = user
    ? navItems.filter((item) => !item.module || hasPermission(user, item.module, false))
    : navItems

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/60 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-800/60 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#1E6B3A]/20 border border-[#1E6B3A]/30 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#1E6B3A]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">MATRICA</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto admin-sidebar py-3 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#1E6B3A]/15 text-[#34D399] border border-[#1E6B3A]/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#1E6B3A]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && item.badgeKey && (badgeCounts[item.badgeKey] || 0) > 0 && (
                  <span className="bg-red-500/90 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {badgeCounts[item.badgeKey] > 99 ? '99+' : badgeCounts[item.badgeKey]}
                  </span>
                )}
                {collapsed && item.badgeKey && (badgeCounts[item.badgeKey] || 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {badgeCounts[item.badgeKey] > 9 ? '9+' : badgeCounts[item.badgeKey]}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-slate-800/60 p-3 shrink-0">
          {!collapsed && user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-medium text-slate-300 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-90' : '-rotate-90'}`} />
        </button>
      </aside>

      {/* ─── Mobile overlay ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Main Area ─── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/60 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors text-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-700/50 text-[10px] text-slate-400 font-mono">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="w-8 h-8 rounded-full bg-[#1E6B3A]/20 border border-[#1E6B3A]/30 flex items-center justify-center">
              <span className="text-xs font-bold text-[#1E6B3A]">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto admin-content">
          <AdminBreadcrumb />
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <AdminCommandPalette />

      {/* AI Floating Assistant */}
      <AIFloatingAssistant />
    </div>
  )
}