'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Pencil, Eye, EyeOff, Star, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useDragReorder, arrayMove } from '@/hooks/useDragReorder'

interface Project { id: string; name: string; slug: string; status: string; publishStatus: string; locationArea: string | null; featured: boolean; sortOrder: number; cardImage: string | null }

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/projects')
      const d = await r.json()
      setProjects(Array.isArray(d) ? d : [])
    } catch {
      // keep whatever is currently shown
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const patchProject = async (id: string, data: Partial<Pick<Project, 'sortOrder' | 'publishStatus' | 'featured'>>) => {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const d = await res.json()
    if (!d.success) throw new Error(d.error || 'Failed')
  }

  const handleReorder = async (project: Project, direction: 'up' | 'down') => {
    const idx = projects.findIndex(p => p.id === project.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= projects.length) return

    const a = { ...projects[idx] }
    const b = { ...projects[swapIdx] }
    // Swap sortOrder values; if they collide (e.g. both default 0), use positions
    if (a.sortOrder === b.sortOrder) {
      a.sortOrder = swapIdx
      b.sortOrder = idx
    } else {
      const temp = a.sortOrder
      a.sortOrder = b.sortOrder
      b.sortOrder = temp
    }
    const updated = [...projects]
    updated[idx] = b
    updated[swapIdx] = a
    setProjects(updated) // optimistic

    try {
      await Promise.all([
        patchProject(a.id, { sortOrder: a.sortOrder }),
        patchProject(b.id, { sortOrder: b.sortOrder }),
      ])
    } catch {
      // One PUT may have succeeded — refetch so the UI matches the server
      await fetchProjects()
      toast.error('Failed to reorder')
    }
  }

  // Drag-and-drop reorder: reassign sequential sortOrder 0..n across the
  // reordered list and persist every changed row (batch of PUTs).
  const handleDragReorder = async (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    const prevOrder = new Map(projects.map((p) => [p.id, p.sortOrder]))
    const reordered = arrayMove(projects, fromIdx, toIdx).map((p, i) => ({ ...p, sortOrder: i }))
    const changed = reordered.filter((p) => prevOrder.get(p.id) !== p.sortOrder)
    if (changed.length === 0) return

    setProjects(reordered) // optimistic
    try {
      await Promise.all(changed.map((p) => patchProject(p.id, { sortOrder: p.sortOrder })))
    } catch {
      // Some PUTs may have succeeded — refetch so the UI matches the server
      // instead of restoring a snapshot that may now be stale.
      await fetchProjects()
      toast.error('Failed to reorder')
    }
  }

  const dnd = useDragReorder(handleDragReorder)

  const handlePublishToggle = async (project: Project) => {
    const next = project.publishStatus === 'published' ? 'draft' : 'published'
    const prev = projects
    setProjects(projects.map(p => p.id === project.id ? { ...p, publishStatus: next } : p)) // optimistic
    try {
      await patchProject(project.id, { publishStatus: next })
      toast.success(next === 'published' ? 'Project published' : 'Project unpublished')
    } catch {
      setProjects(prev)
      toast.error('Failed to update publish status')
    }
  }

  const handleFeaturedToggle = async (project: Project) => {
    const next = !project.featured
    const prev = projects
    setProjects(projects.map(p => p.id === project.id ? { ...p, featured: next } : p)) // optimistic
    try {
      await patchProject(project.id, { featured: next })
      toast.success(next ? 'Marked as featured' : 'Removed from featured')
    } catch {
      setProjects(prev)
      toast.error('Failed to update featured')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <span className="bg-slate-800 text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">{projects.length}</span>
        </div>
        <button onClick={() => router.push('/admin/projects/new')} className="btn-admin btn-admin-primary text-sm">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3 text-left w-16">Order</th>
              <th className="p-3 text-left">Project</th>
              <th className="p-3 text-left hidden md:table-cell">Slug</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left hidden sm:table-cell">Published</th>
              <th className="p-3 text-left hidden lg:table-cell">Location</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={7} className="p-4 bg-slate-900/20" /></tr>)
            ) : projects.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No projects yet</p>
                  <p className="text-slate-600 text-xs mt-1.5">Create your first project to get started</p>
                  <button onClick={() => router.push('/admin/projects/new')} className="btn-admin btn-admin-primary text-xs mt-4">
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>
              </td></tr>
            ) : (
              projects.map((p, i) => {
                const edge = dnd.dropEdge(i)
                return (
                <tr
                  key={p.id}
                  {...dnd.itemProps(i)}
                  className={`hover:bg-slate-800/40 transition-colors ${dnd.isDragging(i) ? 'opacity-40' : ''} ${
                    edge === 'above'
                      ? 'border-t-2 border-t-[#A98B4F]'
                      : edge === 'below'
                        ? 'border-b-2 border-b-[#A98B4F]'
                        : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-0.5">
                      <span
                        {...dnd.handleProps}
                        className="p-1 rounded text-slate-500 cursor-grab active:cursor-grabbing hover:text-white hover:bg-slate-700 transition-colors"
                        title="Drag to reorder"
                        aria-hidden="true"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => handleReorder(p, 'up')}
                        disabled={i === 0}
                        className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(p, 'down')}
                        disabled={i === projects.length - 1}
                        className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.cardImage && <img src={p.cardImage} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-800" />}
                      <div>
                        <p className="text-white font-medium">{p.name}</p>
                        {p.featured && <span className="text-[10px] text-[#A98B4F]">★ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-500 text-xs hidden md:table-cell">{p.slug}</td>
                  <td className="p-3"><span className={`badge-status badge-${p.status}`}>{p.status}</span></td>
                  <td className="p-3 hidden sm:table-cell"><span className={`badge-status badge-${p.publishStatus}`}>{p.publishStatus}</span></td>
                  <td className="p-3 text-slate-400 text-xs hidden lg:table-cell">{p.locationArea || '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleFeaturedToggle(p)}
                        className={`p-1.5 rounded-lg hover:bg-slate-700 transition-colors ${p.featured ? 'text-[#A98B4F]' : 'text-slate-500 hover:text-white'}`}
                        title={p.featured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        <Star className={`w-4 h-4 ${p.featured ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handlePublishToggle(p)}
                        className={`p-1.5 rounded-lg hover:bg-slate-700 transition-colors ${p.publishStatus === 'published' ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
                        title={p.publishStatus === 'published' ? 'Unpublish (set draft)' : 'Publish'}
                      >
                        {p.publishStatus === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <Link href={`/admin/projects/${p.id}`} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}