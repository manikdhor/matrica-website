'use client'
import AdminAdvancedTable from '@/components/AdminAdvancedTable'
import { ImageIcon } from 'lucide-react'

export default function HeroSlidesPage() {
  return (
    <AdminAdvancedTable
      title="Hero Slides"
      icon={<ImageIcon className="w-6 h-6 text-slate-400" />}
      apiPath="/api/admin/hero-slides"
      reorderable
      toggleField={{ key: 'enabled' }}
      defaultValues={{ title: '', subtitle: '', description: '', imageUrl: '', cta1Text: '', cta1Href: '', cta2Text: '', cta2Href: '', label: '', enabled: true, sortOrder: 0 }}
      columns={[
        { key: 'imageUrl', label: 'Image', sortable: false, render: (item) => (
          <div className="w-20 h-12 rounded-lg overflow-hidden bg-slate-800">
            {item.imageUrl ? <img src={item.imageUrl as string} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No img</div>}
          </div>
        )},
        { key: 'title', label: 'Title' },
        { key: 'label', label: 'Label', hidden: 'hidden md:table-cell' },
        { key: 'enabled', label: 'Status', type: 'boolean', filterable: true, render: (item) => (
          <span className={`badge-status ${item.enabled ? 'badge-active' : 'badge-inactive'}`}>{item.enabled ? 'Active' : 'Hidden'}</span>
        )},
        { key: 'sortOrder', label: 'Order', type: 'number', hidden: 'hidden lg:table-cell' },
      ]}
      formFields={[
        { key: 'title', label: 'Title *', type: 'text', required: true, placeholder: 'Slide title' },
        { key: 'label', label: 'Label (Eyebrow)', type: 'text', placeholder: 'e.g. PREMIUM LAND DEVELOPER' },
        { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Optional subtitle' },
        { key: 'description', label: 'Description', type: 'richtext', placeholder: 'Slide description text', colSpan: 2 },
        { key: 'imageUrl', label: 'Image URL *', type: 'url', required: true, placeholder: '/images/hero-slide-1.webp', colSpan: 2, hint: 'Recommended 1920×1080 px (16:9), landscape full-screen background. WebP or JPG, under 500 KB.' },
        { key: 'cta1Text', label: 'CTA 1 Text', type: 'text', placeholder: 'Explore Projects' },
        { key: 'cta1Href', label: 'CTA 1 Link', type: 'text', placeholder: '/projects' },
        { key: 'cta2Text', label: 'CTA 2 Text', type: 'text', placeholder: 'Book a Visit' },
        { key: 'cta2Href', label: 'CTA 2 Link', type: 'text', placeholder: '/site-visit' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
        { key: 'enabled', label: 'Enabled', type: 'checkbox' },
      ]}
    />
  )
}