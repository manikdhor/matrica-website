'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav'
import {
  Search,
  Users,
  CalendarCheck,
  History,
  ArrowRight,
  Command,
  Plus,
  TrendingUp,
  Phone,
  Download,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string
  label: string
  description?: string
  href: string
  icon: React.ReactNode
  category: 'navigation' | 'action' | 'recent'
  shortcut?: string
}

// ─── Navigation Pages ─────────────────────────────────────────────────────────
// Derived from the shared nav config (src/lib/admin-nav.ts) so the sidebar and
// command palette never drift apart.

const NAV_PAGES: CommandItem[] = ADMIN_NAV_ITEMS.map((item) => {
  const Icon = item.icon
  return {
    id: `nav-${item.href.replace('/admin/', '').replace(/\//g, '-')}`,
    label: item.label,
    href: item.href,
    icon: <Icon className="w-4 h-4" />,
    category: 'navigation' as const,
    description: item.keywords,
  }
})

const QUICK_ACTIONS: CommandItem[] = [
  { id: 'action-add-lead', label: 'Add New Lead', href: '/admin/leads?add=true', icon: <Plus className="w-4 h-4" />, category: 'action', description: 'Create a lead manually', shortcut: 'N' },
  { id: 'action-add-project', label: 'Add New Project', href: '/admin/projects/new', icon: <Plus className="w-4 h-4" />, category: 'action', description: 'Create a project' },
  { id: 'action-new-leads', label: 'View New Leads', href: '/admin/leads?status=new', icon: <Users className="w-4 h-4" />, category: 'action', description: 'Uncontacted leads', shortcut: 'L' },
  { id: 'action-pending-visits', label: 'Pending Visits', href: '/admin/site-visits?status=pending', icon: <CalendarCheck className="w-4 h-4" />, category: 'action', description: 'Upcoming site visits' },
  { id: 'action-overdue-followups', label: 'Overdue Follow-ups', href: '/admin/leads?overdue=true', icon: <Phone className="w-4 h-4" />, category: 'action', description: 'Missed follow-ups' },
  { id: 'action-reports', label: 'View Reports', href: '/admin/reports', icon: <TrendingUp className="w-4 h-4" />, category: 'action', description: 'Performance analytics', shortcut: 'R' },
  { id: 'action-export-leads', label: 'Export Leads', href: '/admin/leads?export=true', icon: <Download className="w-4 h-4" />, category: 'action', description: 'Download as CSV' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCommandPalette() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Track recent pages
  const [recentPages, setRecentPages] = useState<CommandItem[]>([])

  // Load recent from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_recent_pages')
      if (saved) {
        const pages = JSON.parse(saved) as Array<{ id: string; label: string; href: string }>
        setRecentPages(
          pages.slice(0, 5).map((p) => ({
            id: `recent-${p.id}`,
            label: p.label,
            href: p.href,
            icon: <History className="w-4 h-4" />,
            category: 'recent' as const,
            description: 'Recently visited',
          }))
        )
      }
    } catch { /* silent */ }
  }, [])

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Save to recent on navigate
  const navigate = useCallback(
    (item: CommandItem) => {
      setOpen(false)
      if (item.category === 'navigation') {
        const recentEntry = { id: item.id, label: item.label, href: item.href }
        try {
          const saved = localStorage.getItem('admin_recent_pages')
          const existing: Array<{ id: string; label: string; href: string }> = saved ? JSON.parse(saved) : []
          const filtered = existing.filter((e) => e.id !== item.id)
          filtered.unshift(recentEntry)
          localStorage.setItem('admin_recent_pages', JSON.stringify(filtered.slice(0, 5)))
        } catch { /* silent */ }
      }
      router.push(item.href)
    },
    [router]
  )

  // Filter items based on query
  const filteredItems = query.trim()
    ? [...NAV_PAGES, ...QUICK_ACTIONS, ...recentPages]
        .filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
        )
        .filter((item, idx, arr) => arr.findIndex((i) => i.href === item.href) === idx) // dedupe
    : [...recentPages, ...NAV_PAGES, ...QUICK_ACTIONS].filter(
        (item, idx, arr) => arr.findIndex((i) => i.href === item.href) === idx
      )

  // Group by category
  const navigationItems = filteredItems.filter((i) => i.category === 'navigation')
  const actionItems = filteredItems.filter((i) => i.category === 'action')
  const recentItems = query.trim() ? [] : filteredItems.filter((i) => i.category === 'recent')

  // Build flat list for keyboard navigation
  const sections: Array<{ title: string; items: CommandItem[] }> = []
  if (recentItems.length > 0 && !query.trim()) sections.push({ title: 'Recent', items: recentItems })
  if (navigationItems.length > 0) sections.push({ title: 'Pages', items: navigationItems })
  if (actionItems.length > 0) sections.push({ title: 'Quick Actions', items: actionItems })

  const flatItems = sections.flatMap((s) => s.items)

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= flatItems.length) setSelectedIndex(Math.max(0, flatItems.length - 1))
  }, [flatItems.length, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
          navigate(flatItems[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  // Current page label for hint
  const currentPage = NAV_PAGES.find((p) => pathname === p.href || pathname?.startsWith(p.href + '/'))

  if (!open) return null

  let globalIdx = 0

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Command Palette */}
      <div className="relative w-full max-w-xl mx-4 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, or type a command..."
            className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto py-2 admin-command-palette-scroll">
          {flatItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1 text-slate-600">Try a different search term</p>
            </div>
          ) : (
            sections.map((section) => {
              const sectionStartIdx = globalIdx
              const sectionElements = section.items.map((item) => {
                const idx = globalIdx++
                const isSelected = idx === selectedIndex
                const isCurrentPage = item.href === currentPage?.href && !query.trim()

                return (
                  <button
                    key={item.id}
                    data-selected={isSelected}
                    onClick={() => navigate(item)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-[#1E6B3A]/15 text-white' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#1E6B3A]/25 text-[#34D399]' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {isCurrentPage && (
                          <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.shortcut && (
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
                          <Command className="w-2.5 h-2.5" />
                          {item.shortcut}
                        </kbd>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 transition-opacity ${isSelected ? 'text-[#34D399] opacity-100' : 'opacity-0'}`} />
                    </div>
                  </button>
                )
              })

              return (
                <div key={section.title}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    {section.title}
                  </div>
                  {sectionElements}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono">esc</kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <Command className="w-3 h-3" />K to toggle
          </div>
        </div>
      </div>
    </div>
  )
}