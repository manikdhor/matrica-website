'use client'
import AdminAdvancedTable from '@/components/AdminAdvancedTable'
import { Mail } from 'lucide-react'
import { useFieldOptions } from '@/hooks/useFieldOptions'

export default function NewsletterPage() {
  const { getOptions } = useFieldOptions()
  return (
    <AdminAdvancedTable
      title="Newsletter Subscribers"
      icon={<Mail className="w-6 h-6 text-slate-400" />}
      apiPath="/api/admin/newsletter"
      toggleField={{ key: 'active' }}
      defaultValues={{ email: '', source: 'manual', active: true }}
      columns={[
        { key: 'email', label: 'Email', render: (item) => <span className="text-white font-medium">{String(item.email)}</span> },
        { key: 'source', label: 'Source', hidden: 'hidden sm:table-cell', type: 'status', filterable: true, render: (item) => <span className="text-slate-400 text-xs capitalize">{String(item.source)}</span> },
        { key: 'active', label: 'Status', type: 'boolean', filterable: true, render: (item) => <span className={`badge-status ${item.active ? 'badge-active' : 'badge-inactive'}`}>{item.active ? 'Active' : 'Inactive'}</span> },
        { key: 'createdAt', label: 'Subscribed', type: 'date', hidden: 'hidden md:table-cell', render: (item) => <span className="text-slate-500 text-xs">{new Date(item.createdAt as string).toLocaleDateString()}</span> },
      ]}
      formFields={[
        { key: 'email', label: 'Email *', type: 'text', required: true, placeholder: 'email@example.com', colSpan: 2 },
        { key: 'source', label: 'Source', type: 'select', options: getOptions('newsletter_sources') },
        { key: 'active', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}