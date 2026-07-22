'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Users,
  Building2,
  CalendarCheck,
  FileText,
  Star,
  FolderOpen,
  Settings,
  UserCog,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  X,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Activity {
  id: string
  entityType: string
  entityId: string | null
  action: string
  description: string
  metadata: string | null
  createdBy: string | null
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<string, { icon: typeof Users; label: string; color: string; bg: string; href: string }> = {
  Lead: { icon: Users, label: 'Lead', color: '#10B981', bg: '#10B98115', href: '/admin/leads/' },
  Project: { icon: Building2, label: 'Project', color: '#F59E0B', bg: '#F59E0B15', href: '/admin/projects/' },
  SiteVisit: { icon: CalendarCheck, label: 'Site Visit', color: '#3B82F6', bg: '#3B82F615', href: '/admin/site-visits/' },
  Blog: { icon: FileText, label: 'Blog', color: '#8B5CF6', bg: '#8B5CF615', href: '/admin/blog/' },
  Testimonial: { icon: Star, label: 'Testimonial', color: '#EC4899', bg: '#EC489915', href: '/admin/testimonials/' },
  Gallery: { icon: FolderOpen, label: 'Gallery', color: '#06B6D4', bg: '#06B6D415', href: '/admin/gallery/' },
  Setting: { icon: Settings, label: 'Setting', color: '#64748B', bg: '#64748B15', href: '/admin/settings' },
  Team: { icon: UserCog, label: 'Team', color: '#F97316', bg: '#F9731615', href: '/admin/team/' },
  Newsletter: { icon: FileText, label: 'Newsletter', color: '#14B8A6', bg: '#14B8A615', href: '/admin/newsletter' },
  FAQ: { icon: FileText, label: 'FAQ', color: '#A78BFA', bg: '#A78BFA15', href: '/admin/faqs/' },
  HeroSlide: { icon: FolderOpen, label: 'Hero Slide', color: '#FB923C', bg: '#FB923C15', href: '/admin/hero-slides/' },
  Notification: { icon: Settings, label: 'Notification', color: '#94A3B8', bg: '#94A3B815', href: '' },
}

const ENTITY_TYPES = Object.keys(ENTITY_CONFIG)

const ACTION_TYPES = [
  'created',
  'updated',
  'deleted',
  'status_change',
  'published',
  'unpublished',
  'assigned',
  'unassigned',
  'exported',
  'imported',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
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

function getEntityLink(entityType: string, entityId: string | null): string | null {
  const config = ENTITY_CONFIG[entityType]
  if (!config || !entityId) return null
  if (entityType === 'Setting' || entityType === 'Newsletter' || entityType === 'Notification') {
    return config.href || null
  }
  return `${config.href}${entityId}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalPages = Math.ceil(total / 20)

  const fetchActivities = useCallback(async (p: number, et: string, act: string, s: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(p))
    params.set('limit', '20')
    if (et) params.set('entityType', et)
    if (act) params.set('action', act)
    if (s) params.set('search', s)

    try {
      const res = await fetch(`/api/admin/activity-log?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities)
        setTotal(data.total)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities(page, entityType, action, search)
  }, [page, entityType, action, search, fetchActivities])

  const handleSearch = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value)
      setPage(1)
    }, 300)
  }

  const clearFilters = () => {
    setEntityType('')
    setAction('')
    setSearch('')
    setSearchInput('')
    setPage(1)
  }

  const hasActiveFilters = entityType || action || search

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total} record{total !== 1 ? 's' : ''} of all system activity
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-admin btn-admin-primary text-sm flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="admin-card p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by description..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="admin-input pl-9 py-2 w-full text-sm"
            />
            {searchInput && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entity Type Filter */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(1) }}
                className="admin-select py-2 w-full text-sm"
              >
                <option value="">All Types</option>
                {ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>{ENTITY_CONFIG[type].label}</option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Action</label>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1) }}
                className="admin-select py-2 w-full text-sm"
              >
                <option value="">All Actions</option>
                {ACTION_TYPES.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {entityType && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300">
              {ENTITY_CONFIG[entityType]?.label || entityType}
              <button onClick={() => { setEntityType(''); setPage(1) }} className="text-slate-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {action && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300">
              {action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              <button onClick={() => { setAction(''); setPage(1) }} className="text-slate-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300">
              &quot;{search}&quot;
              <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }} className="text-slate-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Activity List */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No activity records found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#34D399] hover:underline mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {activities.map((activity) => {
              const config = ENTITY_CONFIG[activity.entityType]
              const Icon = config?.icon || FileText
              const color = config?.color || '#64748B'
              const bg = config?.bg || '#64748B15'
              const label = config?.label || activity.entityType
              const entityLink = getEntityLink(activity.entityType, activity.entityId)

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 px-4 sm:px-5 py-4 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Entity Type Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {/* Entity type badge */}
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                            style={{
                              backgroundColor: bg,
                              color: color,
                            }}
                          >
                            {label}
                          </span>

                          {/* Action badge */}
                          <span className="text-[11px] text-slate-500 capitalize">
                            {activity.action.replace(/_/g, ' ')}
                          </span>

                          {/* User */}
                          {activity.createdBy && (
                            <>
                              <span className="text-slate-700">·</span>
                              <span className="text-[11px] text-slate-400">{activity.createdBy}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right side: link + time */}
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        {entityLink && (
                          <Link
                            href={entityLink}
                            className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
                            title="View entity"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <span className="text-[11px] text-slate-600 whitespace-nowrap">
                          {relativeTime(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && activities.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800/50">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-[#1E6B3A]/20 text-[#34D399] border border-[#1E6B3A]/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}