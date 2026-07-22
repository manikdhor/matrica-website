'use client'

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Phone, Mail, MessageSquare, CalendarCheck, X } from 'lucide-react'

export interface FollowUpCalendarItem {
  id: string
  type: string
  dueDate: string
  dueTime: string | null
  note: string | null
  status: string
  createdBy: string | null
  isOverdue?: boolean
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Phone }> = {
  call: { label: 'Call', color: '#3B82F6', icon: Phone },
  email: { label: 'Email', color: '#8B5CF6', icon: Mail },
  meeting: { label: 'Meeting', color: '#F59E0B', icon: CalendarCheck },
  whatsapp: { label: 'WhatsApp', color: '#10B981', icon: MessageSquare },
  other: { label: 'Other', color: '#64748B', icon: MessageSquare },
}

const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  pending: { dot: 'bg-amber-400', bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Pending' },
  completed: { dot: 'bg-emerald-400', bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Completed' },
  cancelled: { dot: 'bg-slate-500', bg: 'bg-slate-500/15', text: 'text-slate-400', label: 'Cancelled' },
  overdue: { dot: 'bg-red-400', bg: 'bg-red-500/15', text: 'text-red-400', label: 'Overdue' },
}

function getStatusStyle(fu: FollowUpCalendarItem) {
  if (fu.isOverdue && fu.status === 'pending') return STATUS_COLORS.overdue
  return STATUS_COLORS[fu.status] || STATUS_COLORS.pending
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function toLocalDateStr(dateStr: string): string {
  // dueDate comes as "YYYY-MM-DD" — we keep it as-is for comparison
  return dateStr
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface LeadFollowUpCalendarProps {
  followUps: FollowUpCalendarItem[]
  onMarkComplete?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function LeadFollowUpCalendar({
  followUps,
  onMarkComplete,
  onDelete,
}: LeadFollowUpCalendarProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Group follow-ups by due date
  const followUpsByDate = useMemo(() => {
    const map = new Map<string, FollowUpCalendarItem[]>()
    for (const fu of followUps) {
      const key = toLocalDateStr(fu.dueDate)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(fu)
    }
    return map
  }, [followUps])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  // Build a date string from year/month/day for "today" comparison
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setSelectedDate(todayStr)
  }

  // Build calendar cells
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

  const selectedFollowUps = selectedDate ? (followUpsByDate.get(selectedDate) || []) : []

  // Count follow-ups in the current month
  const monthFollowUpCount = useMemo(() => {
    let count = 0
    followUps.forEach((fu) => {
      const d = new Date(fu.dueDate + 'T00:00:00')
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) count++
    })
    return count
  }, [followUps, currentYear, currentMonth])

  return (
    <div className="space-y-0">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white ml-1">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          {monthFollowUpCount > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#1E6B3A]/20 text-[#1E6B3A]">
              {monthFollowUpCount}
            </span>
          )}
        </div>
        <button
          onClick={goToToday}
          className="text-[11px] font-medium px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-slate-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-800/40 rounded-lg overflow-hidden border border-slate-800/60">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-slate-900/30 min-h-[52px] sm:min-h-[64px]" />
          }

          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayFollowUps = followUpsByDate.get(dateStr) || []
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const hasFollowUps = dayFollowUps.length > 0

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`
                relative min-h-[52px] sm:min-h-[64px] p-1 sm:p-1.5 text-left transition-all duration-150
                ${isToday ? 'bg-slate-800/80' : 'bg-slate-900/40'}
                ${isSelected ? 'ring-1 ring-[#1E6B3A] bg-slate-800/70' : ''}
                ${hasFollowUps ? 'hover:bg-slate-800/60 cursor-pointer' : 'cursor-default'}
              `}
              aria-label={`${MONTH_NAMES[currentMonth]} ${day}`}
            >
              <span
                className={`
                  text-[11px] sm:text-xs font-medium inline-flex items-center justify-center
                  w-5 h-5 sm:w-6 sm:h-6 rounded-full
                  ${isToday ? 'bg-[#1E6B3A] text-white' : 'text-slate-400'}
                  ${isSelected && !isToday ? 'bg-slate-700 text-white' : ''}
                `}
              >
                {day}
              </span>

              {/* Dots for follow-ups */}
              {hasFollowUps && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayFollowUps.slice(0, 3).map((fu) => {
                    const s = getStatusStyle(fu)
                    return (
                      <span
                        key={fu.id}
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${s.dot} shrink-0`}
                      />
                    )
                  })}
                  {dayFollowUps.length > 3 && (
                    <span className="text-[8px] sm:text-[9px] text-slate-500 leading-none self-center">
                      +{dayFollowUps.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[10px] text-slate-500">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-slate-500">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-[10px] text-slate-500">Overdue</span>
        </div>
      </div>

      {/* Selected day detail panel */}
      <div
        className={`mt-3 overflow-hidden transition-all duration-200 ease-in-out ${
          selectedDate && selectedFollowUps.length > 0 ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {selectedFollowUps.length > 0 && (
          <div className="border border-slate-800/60 rounded-lg bg-slate-900/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700/60 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {selectedFollowUps.map((fu) => {
              const typeInfo = TYPE_CONFIG[fu.type] || TYPE_CONFIG.other
              const TypeIcon = typeInfo.icon
              const statusInfo = getStatusStyle(fu)
              const isCompleted = fu.status === 'completed'
              const isCancelled = fu.status === 'cancelled'

              return (
                <div
                  key={fu.id}
                  className={`p-2.5 rounded-lg border border-slate-800/60 transition-colors ${
                    isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${typeInfo.color}15` }}
                    >
                      <TypeIcon className="w-3.5 h-3.5" style={{ color: typeInfo.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-medium"
                          style={{ color: typeInfo.color }}
                        >
                          {typeInfo.label}
                        </span>
                        {fu.dueTime && (
                          <span className="text-[11px] text-slate-400">{fu.dueTime}</span>
                        )}
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      {fu.note && (
                        <p className="text-[11px] text-slate-500 mt-1 truncate">{fu.note}</p>
                      )}
                      {!isCompleted && !isCancelled && (onMarkComplete || onDelete) && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {onMarkComplete && (
                            <button
                              onClick={() => onMarkComplete(fu.id)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              ✓ Complete
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(fu.id)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              ✕ Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Empty state for selected day */}
      <div
        className={`mt-3 overflow-hidden transition-all duration-200 ease-in-out ${
          selectedDate && selectedFollowUps.length === 0 ? 'max-h-[60px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border border-slate-800/60 rounded-lg bg-slate-900/50 p-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="text-[11px] text-slate-600">No follow-ups</span>
        </div>
      </div>
    </div>
  )
}