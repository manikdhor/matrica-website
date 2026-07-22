'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Building2,
  Image as ImageIcon,
  Star,
  HelpCircle,
  FileText,
  FolderOpen,
  CalendarCheck,
  Settings,
  Mail,
  UserCog,
  History,
  BarChart3,
  MessageSquare,
  Sparkles,
  Brain,
  Send,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Crumb {
  label: string
  href: string
  icon?: LucideIcon
}

const routeMap: Record<string, { label: string; icon?: LucideIcon }> = {
  '/admin/dashboard': { label: 'Dashboard', icon: LayoutDashboard },
  '/admin/leads': { label: 'Leads', icon: Users },
  '/admin/projects': { label: 'Projects', icon: Building2 },
  '/admin/hero-slides': { label: 'Hero Slides', icon: ImageIcon },
  '/admin/testimonials': { label: 'Testimonials', icon: Star },
  '/admin/faqs': { label: 'FAQs', icon: HelpCircle },
  '/admin/blog': { label: 'Blog', icon: FileText },
  '/admin/gallery': { label: 'Gallery', icon: FolderOpen },
  '/admin/site-visits': { label: 'Site Visits', icon: CalendarCheck },
  '/admin/team': { label: 'Team', icon: UserCog },
  '/admin/newsletter': { label: 'Newsletter', icon: Mail },
  '/admin/settings': { label: 'Settings', icon: Settings },
  '/admin/reports': { label: 'Reports', icon: BarChart3 },
  '/admin/activity-log': { label: 'Activity Log', icon: History },
  '/admin/content': { label: 'Content', icon: FileText },
  '/admin/ai-chat': { label: 'AI Chat', icon: MessageSquare },
  '/admin/ai-content': { label: 'AI Content Studio', icon: Sparkles },
  '/admin/ai-insights': { label: 'AI Insights', icon: Brain },
  '/admin/whatsapp': { label: 'WhatsApp', icon: Send },
}

export default function AdminBreadcrumb() {
  const pathname = usePathname()

  const crumbs: Crumb[] = []

  // Match exact routes first
  if (routeMap[pathname]) {
    const entry = routeMap[pathname]
    crumbs.push({ label: entry.label, href: pathname, icon: entry.icon })
  } else {
    // Check for sub-routes like /admin/leads/[id] or /admin/blog/new
    const segments = pathname.split('/').filter(Boolean) // ['admin', 'leads', 'xxx']

    if (segments.length >= 2) {
      const basePath = '/' + segments.slice(0, 2).join('/') // e.g. /admin/leads
      const baseEntry = routeMap[basePath]

      if (baseEntry) {
        crumbs.push({
          label: baseEntry.label,
          href: basePath,
          icon: baseEntry.icon,
        })

        if (segments.length === 3) {
          const third = segments[2]

          // Specific known sub-routes
          if (basePath === '/admin/blog' && third === 'new') {
            crumbs.push({ label: 'New Post', href: pathname })
          } else {
            // Dynamic ID routes — show generic label
            if (basePath === '/admin/leads') {
              crumbs.push({ label: 'Lead Detail', href: pathname })
            } else if (basePath === '/admin/projects') {
              crumbs.push({ label: 'Edit Project', href: pathname })
            } else if (basePath === '/admin/blog') {
              crumbs.push({ label: 'Edit Post', href: pathname })
            } else {
              crumbs.push({ label: 'Detail', href: pathname })
            }
          }
        }
      }
    }
  }

  // Don't render if no crumbs or only a single crumb (top-level page)
  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex items-center gap-1.5 text-xs">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          const Icon = crumb.icon

          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              )}
              {isLast ? (
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  {Icon && <Icon className="w-3 h-3" />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}