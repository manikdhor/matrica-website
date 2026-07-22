'use client'
import AdminAdvancedTable from '@/components/AdminAdvancedTable'
import { UserCog } from 'lucide-react'
import { useFieldOptions } from '@/hooks/useFieldOptions'

export default function TeamPage() {
  const { getOptions } = useFieldOptions()
  return (
    <AdminAdvancedTable
      title="Team Members"
      icon={<UserCog className="w-6 h-6 text-slate-400" />}
      apiPath="/api/admin/team"
      reorderable
      toggleField={{ key: 'status', activeValue: 'active', inactiveValue: 'inactive' }}
      defaultValues={{ name: '', designation: '', category: 'management', photo: '', bio: '', message: '', phone: '', email: '', linkedin: '', isLeadership: false, status: 'active', sortOrder: 0 }}
      columns={[
        { key: 'name', label: 'Name', render: (item) => (
          <div className="flex items-center gap-2">
            {item.photo ? <img src={item.photo as string} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500">{String(item.name).charAt(0)}</div>}
            <span className="text-white font-medium">{String(item.name)}</span>
          </div>
        )},
        { key: 'designation', label: 'Designation', hidden: 'hidden sm:table-cell' },
        { key: 'category', label: 'Category', hidden: 'hidden md:table-cell', type: 'status', filterable: true, render: (item) => <span className="text-slate-400 text-xs capitalize">{String(item.category)}</span> },
        { key: 'status', label: 'Status', type: 'status', filterable: true, render: (item) => <span className={`badge-status badge-${item.status}`}>{String(item.status)}</span> },
        { key: 'sortOrder', label: 'Order', type: 'number', hidden: 'hidden lg:table-cell' },
      ]}
      formFields={[
        { key: 'name', label: 'Name *', type: 'text', required: true },
        { key: 'designation', label: 'Designation *', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'select', options: getOptions('team_categories'), optionsKey: 'team_categories' },
        { key: 'photo', label: 'Photo URL', type: 'url', hint: 'Recommended 800×1000 px (4:5 portrait). JPG or WebP, under 400 KB.' },
        { key: 'bio', label: 'Bio (shown as pull quote for leadership)', type: 'richtext', colSpan: 2 },
        { key: 'message', label: 'Message / Speech (leadership only — blank line between paragraphs)', type: 'richtext', colSpan: 2 },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
        { key: 'isLeadership', label: 'Leadership Member', type: 'checkbox' },
        { key: 'status', label: 'Status', type: 'select', options: getOptions('team_statuses') },
        { key: 'sortOrder', label: 'Sort Order', type: 'number' },
      ]}
    />
  )
}