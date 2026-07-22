'use client'
import AdminAdvancedTable from '@/components/AdminAdvancedTable'
import { Star } from 'lucide-react'
import { useFieldOptions } from '@/hooks/useFieldOptions'

export default function TestimonialsPage() {
  const { getOptions } = useFieldOptions()
  return (
    <AdminAdvancedTable
      title="Testimonials"
      icon={<Star className="w-6 h-6 text-slate-400" />}
      apiPath="/api/admin/testimonials"
      reorderable
      toggleField={{ key: 'status', activeValue: 'active', inactiveValue: 'inactive' }}
      defaultValues={{ name: '', designation: '', content: '', photo: '', videoUrl: '', rating: 5, featured: false, projectId: '', status: 'active', sortOrder: 0 }}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'designation', label: 'Designation', hidden: 'hidden md:table-cell' },
        { key: 'content', label: 'Content', sortable: false, render: (item) => <span className="text-slate-400 text-xs max-w-[200px] truncate block">{String(item.content || '').slice(0, 60)}...</span> },
        { key: 'rating', label: 'Rating', type: 'number', render: (item) => <span className="text-[#A98B4F]">{'★'.repeat(item.rating as number || 0)}</span> },
        { key: 'status', label: 'Status', type: 'status', filterable: true, render: (item) => <span className={`badge-status badge-${item.status}`}>{String(item.status)}</span> },
        { key: 'featured', label: 'Featured', type: 'boolean', hidden: 'hidden lg:table-cell', render: (item) => item.featured ? <span className="text-[#A98B4F]">★</span> : <span className="text-slate-600">—</span> },
      ]}
      formFields={[
        { key: 'name', label: 'Name *', type: 'text', required: true },
        { key: 'designation', label: 'Designation', type: 'text' },
        { key: 'content', label: 'Testimonial *', type: 'richtext', required: true, colSpan: 2, placeholder: 'Customer testimonial text...' },
        { key: 'photo', label: 'Photo URL', type: 'url', hint: 'Recommended 400×400 px square. Shown as a small circular avatar. JPG or WebP.' },
        { key: 'videoUrl', label: 'Video URL (YouTube)', type: 'url' },
        { key: 'rating', label: 'Rating', type: 'select', options: ['5','4','3','2','1'].map(n => ({ label: `${n} Star${Number(n) > 1 ? 's' : ''}`, value: n })) },
        { key: 'featured', label: 'Featured', type: 'checkbox' },
        { key: 'status', label: 'Status', type: 'select', options: getOptions('testimonial_statuses') },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      ]}
    />
  )
}