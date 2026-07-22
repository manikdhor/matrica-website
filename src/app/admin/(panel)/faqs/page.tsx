'use client'
import AdminAdvancedTable from '@/components/AdminAdvancedTable'
import { HelpCircle } from 'lucide-react'
import { useFieldOptions } from '@/hooks/useFieldOptions'

export default function FAQsPage() {
  const { getOptions } = useFieldOptions()
  return (
    <AdminAdvancedTable
      title="FAQs"
      icon={<HelpCircle className="w-6 h-6 text-slate-400" />}
      apiPath="/api/admin/faqs"
      reorderable
      toggleField={{ key: 'enabled' }}
      defaultValues={{ question: '', answer: '', category: 'general', sortOrder: 0, enabled: true }}
      columns={[
        { key: 'question', label: 'Question', render: (item) => <span className="text-slate-200 font-medium max-w-[300px] truncate block">{String(item.question)}</span> },
        { key: 'answer', label: 'Answer', sortable: false, render: (item) => <span className="text-slate-400 text-xs max-w-[200px] truncate block">{String(item.answer || '').slice(0, 80)}...</span>, hidden: 'hidden md:table-cell' },
        { key: 'category', label: 'Category', hidden: 'hidden sm:table-cell', type: 'status', filterable: true, render: (item) => <span className="text-slate-400 text-xs capitalize">{String(item.category)}</span> },
        { key: 'enabled', label: 'Status', type: 'boolean', filterable: true, render: (item) => <span className={`badge-status ${item.enabled ? 'badge-active' : 'badge-inactive'}`}>{item.enabled ? 'Active' : 'Hidden'}</span> },
        { key: 'sortOrder', label: 'Order', type: 'number', hidden: 'hidden lg:table-cell' },
      ]}
      formFields={[
        { key: 'question', label: 'Question *', type: 'text', required: true, colSpan: 2 },
        { key: 'answer', label: 'Answer *', type: 'richtext', required: true, colSpan: 2, placeholder: 'Detailed answer...' },
        { key: 'category', label: 'Category', type: 'select', options: getOptions('faq_categories'), optionsKey: 'faq_categories' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
        { key: 'enabled', label: 'Enabled', type: 'checkbox' },
      ]}
    />
  )
}