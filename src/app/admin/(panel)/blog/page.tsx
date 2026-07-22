'use client'
import AdminAdvancedTable from '@/components/AdminAdvancedTable'
import { FileText } from 'lucide-react'
import { useFieldOptions } from '@/hooks/useFieldOptions'

export default function BlogPage() {
  const { getOptions } = useFieldOptions()
  return (
    <AdminAdvancedTable
      title="Blog Posts"
      icon={<FileText className="w-6 h-6 text-slate-400" />}
      apiPath="/api/admin/blog"
      detailHref="/admin/blog/{id}"
      defaultValues={{ title: '', slug: '', excerpt: '', content: '', category: '', authorName: '', featuredImage: '', status: 'draft' }}
      columns={[
        { key: 'title', label: 'Title', render: (item) => (
          <div>
            <span className="text-white font-medium">{String(item.title)}</span>
            <p className="text-slate-600 text-xs mt-0.5">/{String(item.slug)}</p>
          </div>
        )},
        { key: 'category', label: 'Category', hidden: 'hidden md:table-cell', type: 'status', filterable: true, render: (item) => <span className="text-slate-400 text-xs">{String(item.category || '—')}</span> },
        { key: 'status', label: 'Status', type: 'status', filterable: true, render: (item) => <span className={`badge-status badge-${item.status}`}>{String(item.status)}</span> },
        { key: 'createdAt', label: 'Created', type: 'date', hidden: 'hidden lg:table-cell', render: (item) => <span className="text-slate-500 text-xs">{new Date(item.createdAt as string).toLocaleDateString()}</span> },
      ]}
      formFields={[
        { key: 'title', label: 'Title *', type: 'text', required: true, colSpan: 2 },
        { key: 'slug', label: 'Slug', type: 'text' },
        { key: 'category', label: 'Category', type: 'select', options: getOptions('blog_categories'), optionsKey: 'blog_categories' },
        { key: 'authorName', label: 'Author Name', type: 'text' },
        { key: 'featuredImage', label: 'Featured Image URL', type: 'url', colSpan: 2, hint: 'Recommended 1200×675 px (16:9). JPG or WebP, under 400 KB.' },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea', colSpan: 2, placeholder: 'Brief summary...' },
        { key: 'content', label: 'Content (HTML)', type: 'richtext', colSpan: 2 },
        { key: 'status', label: 'Status', type: 'select', options: getOptions('blog_statuses') },
      ]}
      addLabel="New Post"
    />
  )
}