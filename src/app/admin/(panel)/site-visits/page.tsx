'use client'
import { useState, useEffect } from 'react'
import { CalendarCheck, Trash2, Phone, Clock, Users, Car, Mail } from 'lucide-react'
import { useFieldOptions } from '@/hooks/useFieldOptions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Booking {
  id: string; name: string; phone: string; email: string | null
  preferredDate: string; preferredTime: string; peopleCount: number; freeTransport: boolean
  projectName: string; status: string; notes: string | null; message: string | null; createdAt: string
}

export default function SiteVisitsPage() {
  const { getValues } = useFieldOptions()
  const STATUSES = getValues('site_visit_statuses')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewBooking, setViewBooking] = useState<Booking | null>(null)
  const [noteText, setNoteText] = useState('')

  const fetchBookings = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/admin/site-visits?${params}`)
      if (!res.ok) {
        toast.error('Failed to load bookings')
        return
      }
      setBookings(await res.json())
    } catch { toast.error('Failed') }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  const changeStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/site-visits', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
      if (!res.ok) { toast.error('Failed to update status'); return }
      toast.success('Updated'); fetchBookings()
    } catch { toast.error('Network error') }
  }

  const saveNote = async () => {
    if (!viewBooking || !noteText.trim()) return
    try {
      const res = await fetch('/api/admin/site-visits', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: viewBooking.id, notes: noteText }) })
      if (!res.ok) { toast.error('Failed to save note'); return }
      toast.success('Note saved'); setNoteText(''); fetchBookings()
    } catch { toast.error('Network error') }
  }

  const deleteBooking = async (id: string) => {
    try {
      const res = await fetch('/api/admin/site-visits', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!res.ok) { toast.error('Failed to delete booking'); return }
      toast.success('Deleted'); setViewBooking(null); fetchBookings()
    } catch { toast.error('Network error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarCheck className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Site Visit Bookings</h1>
          <span className="bg-slate-800 text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">{bookings.length}</span>
        </div>
        <select className="admin-select w-auto text-sm py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left hidden sm:table-cell">Date</th>
                <th className="p-3 text-left hidden md:table-cell">Time</th>
                <th className="p-3 text-left hidden lg:table-cell">Project</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="p-4 bg-slate-900/20" /></tr>)
              ) : bookings.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
                    <CalendarCheck className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No bookings yet</p>
                  <p className="text-slate-600 text-xs mt-1.5">Site visit bookings will appear here when customers book</p>
                </div>
              </td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <button onClick={() => { setViewBooking(b); setNoteText(b.notes || '') }} className="text-white font-medium hover:text-[#34D399] transition-colors">
                        {b.name}
                      </button>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {b.phone}</p>
                    </td>
                    <td className="p-3 text-slate-400 text-xs hidden sm:table-cell">{b.preferredDate}</td>
                    <td className="p-3 text-slate-400 text-xs hidden md:table-cell capitalize">{b.preferredTime}</td>
                    <td className="p-3 text-slate-400 text-xs hidden lg:table-cell">{b.projectName}</td>
                    <td className="p-3">
                      <select
                        value={b.status}
                        onChange={(e) => changeStatus(b.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer badge-${b.status}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => { setViewBooking(b); setNoteText(b.notes || '') }} className="text-xs text-slate-400 hover:text-white transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewBooking} onOpenChange={() => setViewBooking(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {viewBooking && (
            <>
              <DialogHeader><DialogTitle className="text-white">Booking Details</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <DetailRow icon={<Users className="w-4 h-4" />} label="Name" value={viewBooking.name} />
                <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={viewBooking.phone} />
                <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={viewBooking.email || '—'} />
                <DetailRow icon={<Clock className="w-4 h-4" />} label="Date" value={viewBooking.preferredDate} />
                <DetailRow icon={<Clock className="w-4 h-4" />} label="Time" value={viewBooking.preferredTime} />
                <DetailRow icon={<Users className="w-4 h-4" />} label="People" value={String(viewBooking.peopleCount)} />
                <DetailRow icon={<Car className="w-4 h-4" />} label="Transport" value={viewBooking.freeTransport ? 'Requested' : 'Not needed'} />
                <DetailRow icon={<CalendarCheck className="w-4 h-4" />} label="Project" value={viewBooking.projectName} />
                <DetailRow icon={<CalendarCheck className="w-4 h-4" />} label="Status" value={viewBooking.status} />
                {viewBooking.message && (
                  <div className="p-3 bg-slate-800/50 rounded-lg mt-2">
                    <p className="text-xs text-slate-500 mb-1">Message</p>
                    <p className="text-sm text-slate-300">{viewBooking.message}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Admin Notes</label>
                  <textarea className="admin-input min-h-[80px] resize-y" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add notes about this booking..." />
                  <button onClick={saveNote} className="btn-admin btn-admin-secondary text-xs mt-2">Save Note</button>
                </div>
              </div>
              <DialogFooter>
                <button onClick={() => deleteBooking(viewBooking.id)} className="btn-admin btn-admin-danger text-sm"><Trash2 className="w-4 h-4" /> Delete</button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-xs">{label}</span></div>
      <span className="text-sm text-slate-300">{value}</span>
    </div>
  )
}