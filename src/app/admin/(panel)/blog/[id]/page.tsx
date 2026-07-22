'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Eye, EyeOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import RichTextEditor from '@/components/RichTextEditor'
import MediaUploadInput from '@/components/MediaUploadInput'

export default function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)
  const isNew = id === 'new'
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', category: '', authorName: '', featuredImage: '', status: 'draft' })
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/blog/${id}`).then(r => r.json()).then(d => {
        if (d.error) { router.push('/admin/blog'); return }
        setForm({ title: d.title || '', slug: d.slug || '', excerpt: d.excerpt || '', content: d.content || '', category: d.category || '', authorName: d.authorName || '', featuredImage: d.featuredImage || '', status: d.status || 'draft' })
      }).catch(() => {})
    }
  }, [id, isNew, router])

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const save = async (status?: string) => {
    if (!form.title) { toast.error('Title required'); return }
    setLoading(true)
    const data = { ...form, slug: form.slug || generateSlug(form.title) }
    if (status) data.status = status
    try {
      const res = await fetch(isNew ? '/api/admin/blog' : `/api/admin/blog/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? data : { id, ...data }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(status === 'published' ? 'Published!' : 'Saved')
        if (isNew && result.post) router.push(`/admin/blog/${result.post.id}`)
      } else toast.error(result.error || 'Failed')
    } catch { toast.error('Save failed') }
    setLoading(false)
  }

  const deletePost = async () => {
    try { await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' }); toast.success('Deleted'); router.push('/admin/blog') }
    catch { toast.error('Failed') }
  }

  const update = (key: string, value: unknown) => setForm({ ...form, [key]: value })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/blog')} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-white">{isNew ? 'New Post' : 'Edit Post'}</h1>
          <span className={`badge-status badge-${form.status}`}>{form.status}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={() => setShowPreview(!showPreview)} className="btn-admin btn-admin-secondary text-sm">
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          )}
          {!isNew && <button onClick={() => setShowDelete(true)} className="btn-admin btn-admin-danger text-sm"><Trash2 className="w-4 h-4" /></button>}
          <button onClick={() => save('draft')} disabled={loading} className="btn-admin btn-admin-secondary text-sm">Save Draft</button>
          <button onClick={() => save('published')} disabled={loading} className="btn-admin btn-admin-primary text-sm">{loading ? '...' : 'Publish'}</button>
        </div>
      </div>

      {showPreview ? (
        <div className="admin-card p-6">
          <h1 className="text-3xl font-bold text-white mb-2">{form.title}</h1>
          {form.category && <p className="text-[#34D399] text-sm mb-4">{form.category}</p>}
          {form.featuredImage && <img src={form.featuredImage} alt="" className="w-full h-48 object-cover rounded-lg mb-4" />}
          {form.excerpt && <p className="text-slate-400 mb-4 italic">{form.excerpt}</p>}
          <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="admin-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Post Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-xs text-slate-400 mb-1.5">Title *</label><input className="admin-input text-lg" value={form.title} onChange={(e) => { update('title', e.target.value); if (!form.slug || form.slug === generateSlug(form.title)) update('slug', generateSlug(e.target.value)) }} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Slug</label><input className="admin-input" value={form.slug} onChange={(e) => update('slug', e.target.value)} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Category</label><input className="admin-input" value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="e.g. Investment Guide" /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Author Name</label><input className="admin-input" value={form.authorName} onChange={(e) => update('authorName', e.target.value)} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Status</label>
                <select className="admin-select" value={form.status} onChange={(e) => update('status', e.target.value)}>
                  <option value="draft">Draft</option><option value="published">Published</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className="block text-xs text-slate-400 mb-1.5">Featured Image URL</label><MediaUploadInput value={form.featuredImage} onChange={(url) => update('featuredImage', url)} hint="Recommended 1200×675 px (16:9). JPG or WebP, under 400 KB." /></div>
            </div>
            {form.featuredImage && <div className="rounded-lg overflow-hidden bg-slate-800 h-40"><img src={form.featuredImage} alt="" className="w-full h-full object-cover" /></div>}
          </div>

          <div className="admin-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Excerpt</h3>
            <textarea className="admin-input min-h-[80px] resize-y" value={form.excerpt} onChange={(e) => update('excerpt', e.target.value)} placeholder="Brief summary of the blog post..." />
          </div>

          <div className="admin-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Content</h3>
            <RichTextEditor
              value={form.content}
              onChange={(html) => update('content', html)}
              placeholder="Write your blog post content here..."
              minHeight="300px"
            />
          </div>
        </div>
      )}

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Delete Post</DialogTitle></DialogHeader>
          <p className="text-slate-400 text-sm">Are you sure? This cannot be undone.</p>
          <DialogFooter>
            <button onClick={() => setShowDelete(false)} className="btn-admin btn-admin-secondary text-sm">Cancel</button>
            <button onClick={deletePost} className="btn-admin btn-admin-danger text-sm">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}