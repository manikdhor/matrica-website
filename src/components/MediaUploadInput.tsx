'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'

/**
 * URL text input + "Upload" button for admin forms.
 *
 * Uploads go to the server's own disk via /api/admin/upload (NOT Supabase
 * Storage — free tier is Postgres only) and the returned /api/uploads/...
 * URL is written into the field. Pasting an external URL still works.
 */
export default function MediaUploadInput({
  value,
  onChange,
  placeholder,
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,video/mp4,video/webm',
  className = 'admin-input',
  hint,
}: {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  accept?: string
  className?: string
  /** Small helper line below the field, e.g. the recommended image size. */
  hint?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      // A server-side crash returns an HTML error page, not JSON — parsing it
      // blind used to collapse every cause into a bare "Upload failed".
      let data: { success?: boolean; url?: string; error?: string } | null = null
      try {
        data = await res.json()
      } catch {
        data = null
      }
      if (data?.success && data.url) {
        onChange(data.url)
      } else {
        setError(data?.error || `Upload failed (server error ${res.status})`)
      }
    } catch {
      setError('Upload failed (network error)')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className={className}
          type="text"
          placeholder={placeholder || 'Paste a URL or upload a file'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-admin btn-admin-secondary text-xs shrink-0 whitespace-nowrap"
          title="Upload from your computer"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? ' Uploading...' : ' Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}
