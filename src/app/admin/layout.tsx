import type { Metadata } from 'next'
import './admin-globals.css'

export const metadata: Metadata = {
  title: 'Admin Panel | MATRICA Real Estate',
  description: 'MATRICA Admin Panel',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {children}
    </div>
  )
}