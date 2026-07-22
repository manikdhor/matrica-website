import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Login | MATRICA',
  description: 'Admin Panel Login',
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}