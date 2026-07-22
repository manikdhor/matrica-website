'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, Search, Download, Eye, ChevronLeft, ChevronRight,
  Columns3, ArrowUp, ArrowDown, ChevronsUpDown, X, ChevronUp, ChevronDown,
  MoreHorizontal, Check, Filter, FileSpreadsheet, Inbox, Loader2, Power, PowerOff,
  GripVertical,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { useDragReorder, arrayMove } from '@/hooks/useDragReorder'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })
const MediaUploadInput = dynamic(() => import('@/components/MediaUploadInput'), { ssr: false })

/* ─── Interfaces ─── */

export interface FormField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'richtext' | 'select' | 'number' | 'checkbox' | 'url'
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
  colSpan?: number
  /**
   * Field-options key (without the `options_` prefix, e.g. 'blog_categories').
   * When set on a select, the form shows a "+ New" button that adds an option
   * and persists the extended list via PUT /api/admin/options.
   */
  optionsKey?: string
  /** Small helper line below the field, e.g. the recommended image size. */
  hint?: string
}

export interface AdminTableColumn {
  key: string
  label: string
  hidden?: string // responsive class like 'hidden sm:table-cell'
  sortable?: boolean // default true
  filterable?: boolean // default false
  type?: 'text' | 'number' | 'status' | 'date' | 'boolean'
  render?: (item: Record<string, unknown>) => React.ReactNode
}

export interface AdminTableFilter {
  key: string
  value: string
  label: string
}

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'danger'
  onClick: (selectedIds: string[]) => Promise<void> | void
}

export interface ToggleFieldConfig {
  key: string
  /** Value considered "on". Defaults to true (boolean fields). */
  activeValue?: unknown
  /** Value written when toggling off. Defaults to false (boolean fields). */
  inactiveValue?: unknown
}

export interface AdminAdvancedTableProps {
  title: string
  icon: React.ReactNode
  apiPath: string
  columns: AdminTableColumn[]
  formFields: FormField[]
  defaultValues?: Record<string, unknown>
  detailHref?: string
  transformItem?: (item: Record<string, unknown>) => Record<string, unknown>
  bulkActions?: BulkAction[]
  addLabel?: string
  onFormSubmit?: (form: Record<string, unknown>, isEdit: boolean) => Record<string, unknown>
  /** Inline enable/disable toggle column. Persists via PUT { id, [key]: newValue }. */
  toggleField?: ToggleFieldConfig
  /** Inline up/down row reordering (requires entity to have sortOrder). */
  reorderable?: boolean
}

type SortDir = 'asc' | 'desc' | null

/* ─── Session cache (stale-while-revalidate) ───
   Admin lists are re-fetched from a remote Postgres on every page visit,
   which makes navigation feel slow. Paint the last known rows instantly
   from sessionStorage, then refresh in the background. */
const tableCacheKey = (apiPath: string) => `admin-table:${apiPath}`

function readTableCache(apiPath: string): Record<string, unknown>[] | null {
  try {
    const raw = sessionStorage.getItem(tableCacheKey(apiPath))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeTableCache(apiPath: string, items: Record<string, unknown>[]) {
  try {
    sessionStorage.setItem(tableCacheKey(apiPath), JSON.stringify(items))
  } catch {
    // quota exceeded / private mode — cache is best-effort only
  }
}

/* ─── Component ─── */

export default function AdminAdvancedTable({
  title,
  icon,
  apiPath,
  columns: rawColumns,
  formFields,
  defaultValues,
  detailHref,
  transformItem,
  bulkActions = [],
  addLabel,
  onFormSubmit,
  toggleField,
  reorderable = false,
}: AdminAdvancedTableProps) {
  const router = useRouter()

  // ─── Core data ───
  // Hydrate from the session cache so revisits render instantly; the mount
  // effect still fetches fresh data in the background.
  const [allItems, setAllItems] = useState<Record<string, unknown>[]>(() =>
    typeof window === 'undefined' ? [] : readTableCache(apiPath) || []
  )
  const [loading, setLoading] = useState(() =>
    typeof window === 'undefined' ? true : !readTableCache(apiPath)
  )
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ─── Search ───
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Column visibility & order ───
  const [columnOrder, setColumnOrder] = useState<string[]>(rawColumns.map((c) => c.key))
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(rawColumns.map((c) => [c.key, true]))
  )
  const [showColDropdown, setShowColDropdown] = useState(false)

  // ─── Sorting ───
  // When reorderable, default to sortOrder ascending so inline reordering matches display order
  const [sortKey, setSortKey] = useState<string | null>(reorderable ? 'sortOrder' : null)
  const [sortDir, setSortDir] = useState<SortDir>(reorderable ? 'asc' : null)

  // ─── Filtering ───
  const [filters, setFilters] = useState<AdminTableFilter[]>([])
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({})

  // ─── Pagination ───
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // ─── Selection ───
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ─── Row actions menu ───
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null)

  // ─── Form dialog ───
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>(defaultValues || {})
  const [submitting, setSubmitting] = useState(false)

  // Options created inline via "+ New" on selects with an optionsKey,
  // keyed by field key so they show up immediately in this session.
  const [customOptions, setCustomOptions] = useState<Record<string, { label: string; value: string }[]>>({})

  // ─── Delete dialog ───
  const [showDelete, setShowDelete] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteBulk, setDeleteBulk] = useState(false)

  // ─── Click outside for column dropdown and row menu ───
  const colDropdownRef = useRef<HTMLDivElement>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)

  // ─── Ordered & visible columns ───
  const columns = useMemo(() => {
    return columnOrder
      .map((key) => rawColumns.find((c) => c.key === key)!)
      .filter(Boolean)
  }, [columnOrder, rawColumns])

  const visibleColumns = useMemo(() => {
    return columns.filter((c) => columnVisibility[c.key])
  }, [columns, columnVisibility])

  // ─── Unique values for status filter chips ───
  const getUniqueValues = useCallback(
    (colKey: string) => {
      const vals = new Set<string>()
      allItems.forEach((item) => {
        const v = item[colKey]
        if (v != null && v !== '') vals.add(String(v))
      })
      return Array.from(vals).sort()
    },
    [allItems]
  )

  const getCountForValue = useCallback(
    (colKey: string, value: string) => {
      return allItems.filter((item) => String(item[colKey] ?? '') === value).length
    },
    [allItems]
  )

  // ─── Processed data (filter → sort → paginate) ───
  const processedItems = useMemo(() => {
    let items = [...allItems]

    // Transform
    if (transformItem) {
      items = items.map(transformItem)
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter((item) =>
        visibleColumns.some((col) => {
          const val = item[col.key]
          if (val == null) return false
          if (col.render) {
            // For rendered columns, we can't easily search the rendered output,
            // so fall back to the raw value
          }
          return String(val).toLowerCase().includes(term)
        })
      )
    }

    // Column filters
    for (const f of filters) {
      items = items.filter((item) => String(item[f.key] ?? '').toLowerCase().includes(f.value.toLowerCase()))
    }

    // Sort
    if (sortKey && sortDir) {
      const col = rawColumns.find((c) => c.key === sortKey)
      const isNumber = col?.type === 'number' || sortKey === 'sortOrder'
      items.sort((a, b) => {
        const va = a[sortKey]
        const vb = b[sortKey]
        if (va == null && vb == null) return 0
        if (va == null) return sortDir === 'asc' ? 1 : -1
        if (vb == null) return sortDir === 'asc' ? -1 : 1
        let cmp: number
        if (isNumber) {
          cmp = Number(va) - Number(vb)
        } else {
          cmp = String(va).localeCompare(String(vb))
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return items
  }, [allItems, searchTerm, filters, sortKey, sortDir, visibleColumns, transformItem, rawColumns])

  // ─── Pagination ───
  const totalFiltered = processedItems.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedItems.slice(start, start + pageSize)
  }, [processedItems, currentPage, pageSize])

  const showPagination = totalFiltered > pageSize

  // ─── Selection helpers ───
  const pageItemIds = useMemo(() => paginatedItems.map((i) => i.id as string), [paginatedItems])
  const allPageSelected = pageItemIds.length > 0 && pageItemIds.every((id) => selectedIds.has(id))
  const somePageSelected = pageItemIds.some((id) => selectedIds.has(id)) && !allPageSelected

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageItemIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageItemIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Fetch ───
  const fetchItems = useCallback(async () => {
    // Only show the skeleton when we have nothing to paint — background
    // revalidation of cached rows must not flash a loading state.
    setLoading((prev) => (readTableCache(apiPath) ? false : prev))
    try {
      const res = await fetch(apiPath)
      if (!res.ok) {
        setFetchError(
          res.status === 403
            ? "You don't have access to this section"
            : 'Failed to load data'
        )
        setLoading(false)
        return
      }
      const data = await res.json()
      let arr: Record<string, unknown>[] = []
      if (Array.isArray(data)) {
        arr = data
      } else if (data.items || data.leads || data.posts || data.subscribers || data.testimonials || data.bookings) {
        arr = data.items || data.leads || data.posts || data.subscribers || data.testimonials || data.bookings || []
      }
      setAllItems(arr)
      writeTableCache(apiPath, arr)
      setFetchError(null)
    } catch {
      setFetchError('Failed to load data')
      toast.error('Failed to load data')
    }
    setLoading(false)
  }, [apiPath])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Reset page when search/filters/pageSize change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, filters, pageSize])

  // ─── Search debounce ───
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchTerm(value)
    }, 300)
  }

  // ─── Sorting ───
  const handleSort = (key: string) => {
    const col = rawColumns.find((c) => c.key === key)
    if (col?.sortable === false) return
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') {
        if (reorderable) {
          // Restore the reorderable default view instead of clearing the sort,
          // otherwise inline reordering would be permanently disabled.
          setSortKey('sortOrder')
          setSortDir('asc')
        } else {
          setSortKey(null)
          setSortDir(null)
        }
      }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // ─── Filtering ───
  const setFilterInput = (key: string, value: string) => {
    setFilterInputs((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilter = (key: string, value: string, label: string) => {
    if (!value.trim()) return
    setFilters((prev) => {
      const existing = prev.findIndex((f) => f.key === key)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { key, value, label }
        return next
      }
      return [...prev, { key, value, label }]
    })
    setFilterInputs((prev) => ({ ...prev, [key]: '' }))
  }

  const removeFilter = (key: string) => {
    setFilters((prev) => prev.filter((f) => f.key !== key))
  }

  const clearAllFilters = () => {
    setFilters([])
    setFilterInputs({})
  }

  // ─── Column reorder ───
  const moveColumn = (key: string, direction: 'up' | 'down') => {
    setColumnOrder((prev) => {
      const idx = prev.indexOf(key)
      if (idx < 0) return prev
      const next = [...prev]
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }

  const toggleColumnVisibility = (key: string) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectAllColumns = () => {
    setColumnVisibility(Object.fromEntries(rawColumns.map((c) => [c.key, true])))
  }

  const deselectAllColumns = () => {
    setColumnVisibility(Object.fromEntries(rawColumns.map((c) => [c.key, false])))
  }

  // ─── Export CSV ───
  const exportCSV = (itemsToExport?: Record<string, unknown>[]) => {
    const data = itemsToExport || processedItems
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }
    const cols = visibleColumns
    const header = cols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',')
    const rows = data.map((item) =>
      cols
        .map((c) => {
          let val = item[c.key]
          if (val == null) val = ''
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} rows`)
  }

  const exportSelected = () => {
    const selected = allItems.filter((item) => selectedIds.has(item.id as string))
    const transformed = transformItem ? selected.map(transformItem) : selected
    exportCSV(transformed)
  }

  // ─── CRUD operations ───
  const openAdd = () => {
    setEditItem(null)
    setForm(defaultValues || {})
    setShowForm(true)
  }

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item)
    setForm(item)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const isEdit = !!editItem
      const payload = onFormSubmit ? onFormSubmit(form, isEdit) : form
      const res = await fetch(apiPath, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editItem.id, ...payload } : payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(isEdit ? 'Updated successfully' : 'Created successfully')
        setShowForm(false)
        fetchItems()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch {
      toast.error('Request failed')
    }
    setSubmitting(false)
  }

  // ─── Inline option creation (selects with an optionsKey) ───
  const handleCreateOption = async (
    field: FormField,
    currentOptions: { label: string; value: string }[]
  ) => {
    const label = window.prompt(`New ${field.label.toLowerCase()} name:`)?.trim()
    if (!label) return
    const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    if (!value) return
    if (currentOptions.some((o) => o.value === value)) {
      setForm((prev) => ({ ...prev, [field.key]: value }))
      return
    }
    try {
      const res = await fetch('/api/admin/options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `options_${field.optionsKey}`,
          options: [...currentOptions, { label, value }],
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setCustomOptions((prev) => ({
        ...prev,
        [field.key]: [...(prev[field.key] || []), { label, value }],
      }))
      setForm((prev) => ({ ...prev, [field.key]: value }))
      toast.success(`Added "${label}"`)
    } catch {
      toast.error('Failed to add option')
    }
  }

  // ─── Inline toggle (enable/disable) ───
  const isToggleActive = useCallback(
    (item: Record<string, unknown>) => {
      if (!toggleField) return false
      if (toggleField.activeValue !== undefined) return item[toggleField.key] === toggleField.activeValue
      return !!item[toggleField.key]
    },
    [toggleField]
  )

  const handleToggle = async (item: Record<string, unknown>) => {
    if (!toggleField) return
    const id = item.id as string
    const active = isToggleActive(item)
    const newValue = active ? (toggleField.inactiveValue ?? false) : (toggleField.activeValue ?? true)
    const snapshot = allItems
    // Optimistic update
    setAllItems((prev) => prev.map((it) => (it.id === id ? { ...it, [toggleField.key]: newValue } : it)))
    try {
      const res = await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [toggleField.key]: newValue }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Update failed')
      toast.success(active ? 'Disabled' : 'Enabled')
    } catch {
      setAllItems(snapshot)
      toast.error('Failed to update status')
    }
  }

  // ─── Inline row reordering ───
  // Reordering only makes sense in the default sortOrder-ascending view with no search/filter
  const canReorder =
    reorderable && sortKey === 'sortOrder' && sortDir === 'asc' && !searchTerm && filters.length === 0

  const handleReorder = async (item: Record<string, unknown>, direction: 'up' | 'down') => {
    if (!canReorder) return
    const idx = processedItems.findIndex((i) => i.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= processedItems.length) return

    const aId = processedItems[idx].id as string
    const bId = processedItems[swapIdx].id as string
    const aOrder = Number(processedItems[idx].sortOrder ?? 0)
    const bOrder = Number(processedItems[swapIdx].sortOrder ?? 0)
    // Swap sortOrder values; if they collide (e.g. both default 0), fall back
    // to positional indices so the swap actually moves the rows.
    const newAOrder = aOrder === bOrder ? swapIdx : bOrder
    const newBOrder = aOrder === bOrder ? idx : aOrder
    const snapshot = allItems

    // Optimistic swap
    setAllItems((prev) =>
      prev.map((it) => {
        if (it.id === aId) return { ...it, sortOrder: newAOrder }
        if (it.id === bId) return { ...it, sortOrder: newBOrder }
        return it
      })
    )

    try {
      const responses = await Promise.all([
        fetch(apiPath, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: aId, sortOrder: newAOrder }),
        }),
        fetch(apiPath, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bId, sortOrder: newBOrder }),
        }),
      ])
      const results = await Promise.all(responses.map((r) => r.json()))
      if (!results.every((d) => d.success)) throw new Error('Reorder failed')
    } catch {
      setAllItems(snapshot)
      toast.error('Failed to reorder')
    }
  }

  // ─── Drag-and-drop row reordering ───
  // Reorders the full (unfiltered, sortOrder-sorted) list, reassigns sequential
  // sortOrder 0..n and persists every row whose sortOrder changed (batch of PUTs).
  const handleDragReorder = async (fromIdx: number, toIdx: number) => {
    if (!canReorder || fromIdx === toIdx) return
    const reordered = arrayMove(processedItems, fromIdx, toIdx)
    const changed: { id: string; sortOrder: number }[] = []
    reordered.forEach((it, i) => {
      if (Number(it.sortOrder ?? -1) !== i) changed.push({ id: it.id as string, sortOrder: i })
    })
    if (changed.length === 0) return

    const orderMap = new Map(reordered.map((it, i) => [it.id as string, i]))
    // Optimistic update
    setAllItems((prev) =>
      prev.map((it) =>
        orderMap.has(it.id as string) ? { ...it, sortOrder: orderMap.get(it.id as string) } : it
      )
    )
    try {
      const responses = await Promise.all(
        changed.map((c) =>
          fetch(apiPath, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: c.id, sortOrder: c.sortOrder }),
          })
        )
      )
      const results = await Promise.all(responses.map((r) => r.json()))
      if (!results.every((d) => d.success)) throw new Error('Reorder failed')
    } catch {
      // Some PUTs may have succeeded — refetch so the UI matches the server
      // instead of restoring a snapshot that may now be stale.
      await fetchItems()
      toast.error('Failed to reorder')
    }
  }

  const dnd = useDragReorder(handleDragReorder, canReorder)

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setDeleteBulk(false)
    setShowDelete(true)
  }

  const handleDelete = async () => {
    if (deleteBulk) {
      setSubmitting(true)
      try {
        let successCount = 0
        for (const id of selectedIds) {
          const res = await fetch(apiPath, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
          const data = await res.json()
          if (data.success) successCount++
        }
        toast.success(`Deleted ${successCount} items`)
        setSelectedIds(new Set())
        fetchItems()
      } catch {
        toast.error('Bulk delete failed')
      }
      setSubmitting(false)
    } else if (deleteId) {
      setSubmitting(true)
      try {
        const res = await fetch(apiPath, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deleteId }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success('Deleted successfully')
          fetchItems()
        } else {
          toast.error(data.error || 'Delete failed')
        }
      } catch {
        toast.error('Delete failed')
      }
      setSubmitting(false)
    }
    setShowDelete(false)
    setDeleteId(null)
  }

  // ─── Click outside handlers ───
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colDropdownRef.current && !colDropdownRef.current.contains(e.target as Node)) {
        setShowColDropdown(false)
      }
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) {
        setOpenRowMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── Render helpers ───
  const sortIndicator = (key: string) => {
    if (sortKey !== key) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-30" />
    if (sortDir === 'asc') return <ArrowUp className="w-3 h-3 ml-1 text-[#34D399]" />
    return <ArrowDown className="w-3 h-3 ml-1 text-[#34D399]" />
  }

  const renderCell = (item: Record<string, unknown>, col: AdminTableColumn) => {
    if (col.render) return col.render(item)
    const val = item[col.key]
    if (val == null) return <span className="text-slate-500">—</span>
    if (col.type === 'boolean') {
      return val ? (
        <span className="inline-flex items-center gap-1 text-[#34D399] text-xs">
          <Check className="w-3.5 h-3.5" /> Yes
        </span>
      ) : (
        <span className="text-slate-500 text-xs">No</span>
      )
    }
    if (col.type === 'date') {
      try {
        return (
          <span className="text-slate-300 text-sm">
            {new Date(String(val)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        )
      } catch {
        return <span className="text-slate-300">{String(val)}</span>
      }
    }
    return <span className="text-slate-300">{String(val)}</span>
  }

  // ─── Form field renderer ───
  const renderFormField = (field: FormField) => {
    if (field.type === 'textarea') {
      return (
        <textarea
          className="admin-input min-h-[100px] resize-y"
          placeholder={field.placeholder}
          value={String(form[field.key] || '')}
          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
        />
      )
    }
    if (field.type === 'richtext') {
      return (
        <RichTextEditor
          value={String(form[field.key] || '')}
          onChange={(html) => setForm({ ...form, [field.key]: html })}
          placeholder={field.placeholder || 'Enter content...'}
          minHeight="200px"
        />
      )
    }
    if (field.type === 'select') {
      const opts = [...(field.options || []), ...(customOptions[field.key] || [])]
      const select = (
        <select
          className="admin-select"
          value={String(form[field.key] || '')}
          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
        >
          {opts.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
      if (!field.optionsKey) return select
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1">{select}</div>
          <button
            type="button"
            onClick={() => handleCreateOption(field, opts)}
            className="btn-admin btn-admin-secondary text-xs px-2.5 py-2 whitespace-nowrap"
            title={`Add a new ${field.label.toLowerCase()}`}
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
      )
    }
    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={!!form[field.key]}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
            className="w-4 h-4 rounded border-slate-600"
          />
          <span className="text-sm text-slate-300">Enabled</span>
        </label>
      )
    }
    if (field.type === 'url') {
      // Paste a URL or upload to the server's local media store
      return (
        <MediaUploadInput
          value={String(form[field.key] || '')}
          onChange={(url) => setForm((prev) => ({ ...prev, [field.key]: url }))}
          placeholder={field.placeholder}
          hint={field.hint}
        />
      )
    }
    return (
      <input
        className="admin-input"
        type={field.type}
        placeholder={field.placeholder}
        value={String(form[field.key] ?? (field.type === 'number' ? 0 : ''))}
        onChange={(e) =>
          setForm({
            ...form,
            [field.key]: field.type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value,
          })
        }
      />
    )
  }

  // ─── Render ───
  const addButtonText = addLabel || `Add ${title.replace(/s$/, '')}`

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <span className="bg-slate-800 text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">{totalFiltered}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCSV()}
            className="btn-admin btn-admin-secondary text-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openAdd} className="btn-admin btn-admin-primary text-sm">
            <Plus className="w-4 h-4" /> {addButtonText}
          </button>
        </div>
      </div>

      {/* ─── Toolbar: Search + Column Visibility ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="admin-input pl-10 pr-8"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                setSearchTerm('')
                if (debounceRef.current) clearTimeout(debounceRef.current)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Column Visibility */}
        <div className="relative" ref={colDropdownRef}>
          <button
            onClick={() => setShowColDropdown(!showColDropdown)}
            className="btn-admin btn-admin-secondary text-sm"
          >
            <Columns3 className="w-4 h-4" /> Columns
          </button>
          {showColDropdown && (
            <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 max-h-80 overflow-y-auto custom-scrollbar">
              {/* Select all / Deselect all */}
              <div className="flex items-center gap-2 px-3 pb-2 mb-1 border-b border-slate-700/50">
                <button
                  onClick={selectAllColumns}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Select All
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={deselectAllColumns}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Deselect All
                </button>
              </div>
              {columnOrder.map((key, idx) => {
                const col = rawColumns.find((c) => c.key === key)
                if (!col) return null
                const isFirst = idx === 0
                const isLast = idx === columnOrder.length - 1
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700/30 group"
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col flex-shrink-0">
                      <button
                        onClick={() => moveColumn(key, 'up')}
                        disabled={isFirst}
                        className="p-0 text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveColumn(key, 'down')}
                        disabled={isLast}
                        className="p-0 -mt-0.5 text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={columnVisibility[key]}
                      onChange={() => toggleColumnVisibility(key)}
                      className="w-4 h-4 rounded border-slate-600 flex-shrink-0 accent-[#1E6B3A]"
                    />
                    {/* Label */}
                    <span className="text-sm text-slate-300 truncate flex-1">{col.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Active Filter Chips ─── */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => removeFilter(f.key)}
              className="inline-flex items-center gap-1.5 bg-[#1E6B3A]/20 text-[#34D399] border border-[#1E6B3A]/30 text-xs px-2.5 py-1 rounded-full hover:bg-[#1E6B3A]/30 transition-colors"
            >
              <span className="max-w-[120px] truncate">{f.label}: {f.value}</span>
              <X className="w-3 h-3 flex-shrink-0" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-slate-500 hover:text-white transition-colors ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ─── Bulk Action Bar ─── */}
      {selectedIds.size > 0 && (
        <div className="bg-[#1E6B3A]/10 border border-[#1E6B3A]/20 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-sm text-[#34D399] font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportSelected()}
              className="btn-admin btn-admin-secondary text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" /> Export Selected
            </button>
            <button
              onClick={() => {
                setDeleteBulk(true)
                setShowDelete(true)
              }}
              className="btn-admin btn-admin-danger text-xs py-1.5 px-3"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
            {bulkActions.map((ba, i) => (
              <button
                key={i}
                onClick={async () => {
                  await ba.onClick(Array.from(selectedIds))
                  setSelectedIds(new Set())
                }}
                className={`btn-admin text-xs py-1.5 px-3 ${
                  ba.variant === 'danger' ? 'btn-admin-danger' : 'btn-admin-secondary'
                }`}
              >
                {ba.icon}
                {ba.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-500 hover:text-white transition-colors ml-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                {/* Checkbox column */}
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 accent-[#1E6B3A]"
                  />
                </th>
                {/* Reorder column */}
                {reorderable && <th className="p-3 w-14" aria-label="Reorder" />}
                {visibleColumns.map((col) => {
                  const canSort = col.sortable !== false
                  return (
                    <th
                      key={col.key}
                      className={`p-3 text-left ${canSort ? 'cursor-pointer select-none hover:text-white' : ''} ${col.hidden || ''} ${sortKey === col.key ? 'text-[#34D399]' : ''}`}
                      onClick={() => canSort && handleSort(col.key)}
                    >
                      <div className="flex items-center">
                        {col.label}
                        {canSort && sortIndicator(col.key)}
                      </div>
                    </th>
                  )
                })}
                {/* Toggle column */}
                {toggleField && <th className="p-3 text-center w-14">Active</th>}
                <th className="p-3 text-right w-28">Actions</th>
              </tr>

              {/* ─── Column Filters Row ───
                  Lives inside <thead> — a <tr> directly under <table> is
                  invalid HTML and hydration-mismatches (browser re-parents it
                  into <tbody>), forcing React to client-re-render every page. */}
              {columns.some((c) => c.filterable) && (
                <tr className="bg-slate-900/50">
                  {/* spacer: checkbox column */}
                  <td className="p-2" />
                  {/* spacer: reorder column */}
                  {reorderable && <td className="p-2" />}
                {visibleColumns.map((col) => (
                  <td key={col.key} className={`p-2 ${col.hidden || ''}`}>
                    {col.filterable ? (
                      col.type === 'status' ? (
                        <div className="flex flex-wrap gap-1">
                          {getUniqueValues(col.key).map((val) => {
                            const isActive = filters.some((f) => f.key === col.key && f.value === val)
                            const count = getCountForValue(col.key, val)
                            return (
                              <button
                                key={val}
                                onClick={() => {
                                  if (isActive) removeFilter(col.key)
                                  else applyFilter(col.key, val, val)
                                }}
                                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                                  isActive
                                    ? 'bg-[#1E6B3A]/20 text-[#34D399] border border-[#1E6B3A]/30'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {val} ({count})
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            className="admin-input py-1 px-2 text-xs"
                            placeholder={`Filter...`}
                            value={filterInputs[col.key] || ''}
                            onChange={(e) => setFilterInput(col.key, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                applyFilter(col.key, filterInputs[col.key] || '', col.label)
                              }
                            }}
                          />
                          {(filterInputs[col.key] || '') && (
                            <button
                              onClick={() => applyFilter(col.key, filterInputs[col.key] || '', col.label)}
                              className="text-xs text-[#34D399] hover:text-white px-1"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )
                    ) : null}
                  </td>
                ))}
                  {/* spacer: toggle column */}
                  {toggleField && <td className="p-2" />}
                  {/* spacer: actions column */}
                  <td className="p-2" />
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="p-3">
                      <div className="w-4 h-4 rounded bg-slate-700/50 animate-pulse" />
                    </td>
                    {reorderable && (
                      <td className="p-3">
                        <div className="w-4 h-6 rounded bg-slate-700/50 animate-pulse" />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.key} className={`p-3 ${col.hidden || ''}`}>
                        <div className="h-4 rounded bg-slate-700/50 animate-pulse w-3/4" />
                      </td>
                    ))}
                    {toggleField && (
                      <td className="p-3">
                        <div className="w-6 h-4 rounded bg-slate-700/50 animate-pulse mx-auto" />
                      </td>
                    )}
                    <td className="p-3">
                      <div className="h-4 rounded bg-slate-700/50 animate-pulse w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : fetchError ? (
                // Fetch error state (401/403/500) — distinct from "no items yet"
                <tr>
                  <td
                    colSpan={visibleColumns.length + 2 + (reorderable ? 1 : 0) + (toggleField ? 1 : 0)}
                    className="p-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
                        <X className="w-6 h-6 text-red-400" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">{fetchError}</p>
                      <p className="text-slate-600 text-xs mt-1.5 max-w-xs">
                        {fetchError === "You don't have access to this section"
                          ? 'Contact an administrator if you believe this is a mistake.'
                          : 'Something went wrong while loading the data.'}
                      </p>
                      {fetchError !== "You don't have access to this section" && (
                        <button onClick={fetchItems} className="btn-admin btn-admin-secondary text-xs mt-4">
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                // Empty / no results state
                <tr>
                  <td
                    colSpan={visibleColumns.length + 2 + (reorderable ? 1 : 0) + (toggleField ? 1 : 0)}
                    className="p-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
                        {searchTerm || filters.length > 0 ? (
                          <Search className="w-6 h-6 text-slate-600" />
                        ) : (
                          <Inbox className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <p className="text-slate-400 text-sm font-medium">
                        {searchTerm || filters.length > 0
                          ? 'No results found'
                          : `No ${title.toLowerCase()} yet`}
                      </p>
                      <p className="text-slate-600 text-xs mt-1.5 max-w-xs">
                        {searchTerm || filters.length > 0
                          ? 'Try adjusting your search or filters'
                          : `Get started by adding your first ${title.toLowerCase().replace(/s$/, '')}`}
                      </p>
                      {!searchTerm && filters.length === 0 && (
                        <button onClick={openAdd} className="btn-admin btn-admin-primary text-xs mt-4">
                          <Plus className="w-3.5 h-3.5" /> {addButtonText}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                paginatedItems.map((item, rowIdx) => {
                  const id = item.id as string
                  const isSelected = selectedIds.has(id)
                  const globalIdx = (currentPage - 1) * pageSize + rowIdx
                  const edge = reorderable ? dnd.dropEdge(globalIdx) : null
                  return (
                    <tr
                      key={id}
                      {...(reorderable ? dnd.itemProps(globalIdx) : {})}
                      className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-slate-800/30' : ''} ${
                        reorderable && dnd.isDragging(globalIdx) ? 'opacity-40' : ''
                      } ${
                        edge === 'above'
                          ? 'border-t-2 border-t-[#A98B4F]'
                          : edge === 'below'
                            ? 'border-b-2 border-b-[#A98B4F]'
                            : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(id)}
                          className="w-4 h-4 rounded border-slate-600 accent-[#1E6B3A]"
                        />
                      </td>
                      {/* Reorder */}
                      {reorderable && (
                        <td className="p-2">
                          <div className="flex items-center gap-0.5">
                            <span
                              {...(canReorder ? dnd.handleProps : {})}
                              className={`p-0.5 rounded text-slate-500 ${
                                canReorder
                                  ? 'cursor-grab active:cursor-grabbing hover:text-white hover:bg-slate-700'
                                  : 'opacity-20 cursor-not-allowed'
                              } transition-colors`}
                              title={canReorder ? 'Drag to reorder' : 'Clear search, filters and sorting to reorder'}
                              aria-hidden="true"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                            <div className="flex flex-col items-center">
                              <button
                              onClick={() => handleReorder(item, 'up')}
                              disabled={!canReorder || globalIdx === 0}
                              className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                              title={canReorder ? 'Move up' : 'Clear search, filters and sorting to reorder'}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleReorder(item, 'down')}
                              disabled={!canReorder || globalIdx === totalFiltered - 1}
                              className="p-0.5 -mt-0.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                              title={canReorder ? 'Move down' : 'Clear search, filters and sorting to reorder'}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            </div>
                          </div>
                        </td>
                      )}
                      {/* Cells */}
                      {visibleColumns.map((col) => (
                        <td key={col.key} className={`p-3 ${col.hidden || ''}`}>
                          {renderCell(item, col)}
                        </td>
                      ))}
                      {/* Toggle */}
                      {toggleField && (
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggle(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isToggleActive(item)
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                            }`}
                            title={isToggleActive(item) ? 'Disable' : 'Enable'}
                          >
                            {isToggleActive(item) ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                          </button>
                        </td>
                      )}
                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1" ref={rowMenuRef}>
                          {detailHref && (
                            <button
                              onClick={() => router.push(detailHref.replace('{id}', id))}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#34D399] hover:bg-slate-700 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {bulkActions.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={() => setOpenRowMenu(openRowMenu === id ? null : id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                                title="More actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {openRowMenu === id && (
                                <div className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[160px]">
                                  {bulkActions.map((ba, i) => (
                                    <button
                                      key={i}
                                      onClick={async () => {
                                        await ba.onClick([id])
                                        setOpenRowMenu(null)
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-700/50 transition-colors ${
                                        ba.variant === 'danger'
                                          ? 'text-red-400 hover:text-red-300'
                                          : 'text-slate-300 hover:text-white'
                                      }`}
                                    >
                                      {ba.icon}
                                      {ba.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        {showPagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-800/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalFiltered)} of{' '}
                {totalFiltered} items
              </span>
              <select
                className="admin-select py-1 px-2 text-xs w-20"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s} / pg
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 mx-1">
                {/* Page jump input */}
                <span className="text-xs text-slate-500">Page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v) && v >= 1 && v <= totalPages) setPage(v)
                  }}
                  className="admin-input py-1 px-2 text-xs w-14 text-center"
                />
                <span className="text-xs text-slate-500">of {totalPages}</span>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Add/Edit Form Dialog ─── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editItem ? 'Edit' : 'Add'} {title.replace(/s$/, '')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {formFields.map((field) => (
              <div key={field.key} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                <label className="block text-xs text-slate-400 mb-1.5">
                  {field.label} {field.required && '*'}
                </label>
                {renderFormField(field)}
                {field.hint && field.type !== 'url' && (
                  <p className="text-[11px] text-slate-500 mt-1">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <button onClick={() => setShowForm(false)} className="btn-admin btn-admin-secondary text-sm">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-admin btn-admin-primary text-sm">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : editItem ? (
                'Update'
              ) : (
                'Create'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">
              {deleteBulk ? `Delete ${selectedIds.size} Items` : 'Delete Item'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm">
            {deleteBulk
              ? `Are you sure you want to delete ${selectedIds.size} selected items? This cannot be undone.`
              : 'Are you sure? This cannot be undone.'}
          </p>
          <DialogFooter>
            <button onClick={() => setShowDelete(false)} className="btn-admin btn-admin-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="btn-admin btn-admin-danger text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> ...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}