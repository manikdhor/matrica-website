'use client'
import { useState, useEffect } from 'react'
import { FolderOpen, Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useFieldOptions } from '@/hooks/useFieldOptions'
import MediaUploadInput from '@/components/MediaUploadInput'

interface Category { id: string; name: string; slug: string; cover: string | null; sortOrder: number; enabled: boolean; items: GalleryItem[] }
interface GalleryItem { id: string; title: string | null; caption: string | null; mediaType: string; fileUrl: string | null; videoUrl: string | null; sortOrder: number; enabled: boolean }

export default function GalleryPage() {
  const { getOptions } = useFieldOptions()
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [editItem, setEditItem] = useState<GalleryItem | null>(null)
  const [catForm, setCatForm] = useState({ name: '', slug: '', cover: '', sortOrder: 0, enabled: true })
  const [itemForm, setItemForm] = useState({ title: '', caption: '', mediaType: 'image', fileUrl: '', videoUrl: '', sortOrder: 0, enabled: true })

  const fetchAll = async () => {
    try {
      const res = await fetch('/api/admin/gallery')
      const data = await res.json()
      setCategories(data)
      if (!selected && data.length > 0) setSelected(data[0].id)
    } catch { toast.error('Failed') }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const saveCat = async () => {
    try {
      const method = editCat ? 'PUT' : 'POST'
      const body = editCat ? { id: editCat.id, ...catForm } : catForm
      await fetch('/api/admin/gallery', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      toast.success('Saved'); setShowCatForm(false); setEditCat(null); fetchAll()
    } catch { toast.error('Failed') }
  }

  const deleteCat = async (id: string) => {
    await fetch('/api/admin/gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    toast.success('Deleted'); if (selected === id) setSelected(null); fetchAll()
  }

  const saveItem = async () => {
    try {
      let res: Response
      if (editItem) {
        const body = {
          title: itemForm.title || null,
          caption: itemForm.caption || null,
          mediaType: itemForm.mediaType,
          fileUrl: itemForm.fileUrl || null,
          videoUrl: itemForm.videoUrl || null,
          sortOrder: itemForm.sortOrder,
          enabled: itemForm.enabled,
        }
        res = await fetch(`/api/admin/gallery/items/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        if (!selected) return
        const body = { ...itemForm, categoryId: selected }
        res = await fetch('/api/admin/gallery/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      if (!res.ok) throw new Error()
      toast.success(editItem ? 'Saved' : 'Added'); setShowItemForm(false); setEditItem(null); fetchAll()
    } catch { toast.error('Failed') }
  }

  const deleteItem = async (id: string) => {
    if (!window.confirm('Delete this gallery item? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/gallery/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Deleted'); fetchAll()
    } catch { toast.error('Failed to delete item') }
  }

  const toggleCat = async (cat: Category) => {
    try {
      const res = await fetch(`/api/admin/gallery/${cat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !cat.enabled }) })
      if (!res.ok) throw new Error()
      toast.success(cat.enabled ? 'Disabled' : 'Enabled'); fetchAll()
    } catch { toast.error('Failed') }
  }

  const toggleItem = async (item: GalleryItem) => {
    try {
      const res = await fetch(`/api/admin/gallery/items/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !item.enabled }) })
      if (!res.ok) throw new Error()
      toast.success(item.enabled ? 'Disabled' : 'Enabled'); fetchAll()
    } catch { toast.error('Failed') }
  }

  const openEditItem = (item: GalleryItem) => {
    setItemForm({
      title: item.title || '',
      caption: item.caption || '',
      mediaType: item.mediaType,
      fileUrl: item.fileUrl || '',
      videoUrl: item.videoUrl || '',
      sortOrder: item.sortOrder,
      enabled: item.enabled,
    })
    setEditItem(item)
    setShowItemForm(true)
  }

  const currentCat = categories.find((c) => c.id === selected)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-white">Gallery</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCatForm({ name: '', slug: '', cover: '', sortOrder: 0, enabled: true }); setEditCat(null); setShowCatForm(true) }} className="btn-admin btn-admin-secondary text-sm">
            <Plus className="w-4 h-4" /> Category
          </button>
          <button onClick={() => { setItemForm({ title: '', caption: '', mediaType: 'image', fileUrl: '', videoUrl: '', sortOrder: 0, enabled: true }); setEditItem(null); setShowItemForm(true) }} className="btn-admin btn-admin-primary text-sm">
            <Plus className="w-4 h-4" /> Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        {/* Categories List */}
        <div className="admin-card p-3 space-y-1 max-h-[70vh] overflow-y-auto">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors group ${
                selected === cat.id ? 'bg-[#1E6B3A]/15 text-white border border-[#1E6B3A]/20' : 'text-slate-400 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <span className="text-sm truncate">{cat.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); toggleCat(cat) }} className={`p-1 transition-colors ${cat.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`} title={cat.enabled ? 'Disable' : 'Enable'}>{cat.enabled ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}</button>
                <button onClick={(e) => { e.stopPropagation(); setCatForm({ name: cat.name, slug: cat.slug, cover: cat.cover || '', sortOrder: cat.sortOrder, enabled: cat.enabled }); setEditCat(cat); setShowCatForm(true) }} className="p-1 text-slate-500 hover:text-white"><Pencil className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteCat(cat.id) }} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="text-slate-500 text-xs text-center py-4">No categories</p>}
        </div>

        {/* Items Grid */}
        <div className="admin-card p-4">
          {currentCat ? (
            <>
              <h3 className="text-sm font-semibold text-white mb-4">{currentCat.name} ({currentCat.items.length} items)</h3>
              {currentCat.items.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-12">No items in this category</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {currentCat.items.map((item) => (
                    <div key={item.id} className="group relative bg-slate-800/50 rounded-lg overflow-hidden aspect-square">
                      {item.mediaType === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 text-xs text-center p-2">Video<br />{item.title}</div>
                      ) : item.fileUrl ? (
                        <img src={item.fileUrl} alt={item.title || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No image</div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => toggleItem(item)} className={`p-2 rounded-lg transition-colors ${item.enabled ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`} title={item.enabled ? 'Disable' : 'Enable'}>{item.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}</button>
                        <button onClick={() => openEditItem(item)} className="p-2 rounded-lg bg-slate-700/50 text-slate-200 hover:bg-slate-700" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs truncate">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">Select a category to view items</p>
          )}
        </div>
      </div>

      {/* Category Form Dialog */}
      <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editCat ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="block text-xs text-slate-400 mb-1.5">Name *</label><input className="admin-input" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Cover Image URL</label><MediaUploadInput value={catForm.cover} onChange={(url) => setCatForm((prev) => ({ ...prev, cover: url }))} hint="Recommended 1200×900 px (4:3). JPG or WebP, under 500 KB." /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Sort Order</label><input className="admin-input" type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={catForm.enabled} onChange={(e) => setCatForm({ ...catForm, enabled: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-slate-300">Enabled</span></label>
          </div>
          <DialogFooter>
            <button onClick={() => setShowCatForm(false)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button onClick={saveCat} className="btn-admin btn-admin-primary text-sm">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Form Dialog */}
      <Dialog open={showItemForm} onOpenChange={(open) => { setShowItemForm(open); if (!open) setEditItem(null) }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editItem ? 'Edit' : 'Add'} Gallery Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="block text-xs text-slate-400 mb-1.5">Title</label><input className="admin-input" value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Caption</label><input className="admin-input" value={itemForm.caption} onChange={(e) => setItemForm({ ...itemForm, caption: e.target.value })} /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Media Type</label>
              <select className="admin-select" value={itemForm.mediaType} onChange={(e) => setItemForm({ ...itemForm, mediaType: e.target.value })}>
                {getOptions('gallery_media_types').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Image URL</label><MediaUploadInput value={itemForm.fileUrl} onChange={(url) => setItemForm((prev) => ({ ...prev, fileUrl: url }))} hint="Masonry grid — any aspect ratio. Recommended long edge 1600 px. JPG or WebP, under 500 KB." /></div>
            {itemForm.mediaType === 'video' && (
              <div><label className="block text-xs text-slate-400 mb-1.5">YouTube URL</label><input className="admin-input" value={itemForm.videoUrl} onChange={(e) => setItemForm({ ...itemForm, videoUrl: e.target.value })} /></div>
            )}
            <div><label className="block text-xs text-slate-400 mb-1.5">Sort Order</label><input className="admin-input" type="number" value={itemForm.sortOrder} onChange={(e) => setItemForm({ ...itemForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter>
            <button onClick={() => { setShowItemForm(false); setEditItem(null) }} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button onClick={saveItem} className="btn-admin btn-admin-primary text-sm">{editItem ? 'Save' : 'Add'}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}