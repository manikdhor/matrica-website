import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Sparkles,
  MessageSquare,
  Brain,
  GraduationCap,
  Building2,
  CreditCard,
  Image as ImageIcon,
  Star,
  HelpCircle,
  FileText,
  FolderOpen,
  CalendarCheck,
  UserCog,
  Mail,
  Send,
  ListTree,
  Globe,
  Type,
  History,
  ShieldCheck,
  Settings,
  Share2,
  Bell,
  Palette,
  Search,
} from 'lucide-react'

/**
 * Single source of truth for admin panel navigation.
 * Consumed by AdminShell (sidebar) and AdminCommandPalette (Cmd+K pages list).
 */
export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Key into the sidebar badge counts map (e.g. newLeads, pendingVisits) */
  badgeKey?: 'newLeads' | 'pendingVisits'
  /** Short description / search keywords, shown in the command palette */
  keywords?: string
  /** Permission module key (see src/lib/permissions.ts) used to filter visibility */
  module?: string
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, keywords: 'Overview & stats', module: 'dashboard' },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell, keywords: 'Alerts & activity notifications', module: 'dashboard' },
  { label: 'Leads', href: '/admin/leads', icon: Users, badgeKey: 'newLeads', keywords: 'Lead management', module: 'leads' },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3, keywords: 'Analytics & insights', module: 'reports' },
  { label: 'AI Writer', href: '/admin/ai-content', icon: Sparkles, keywords: 'AI content generation', module: 'ai' },
  { label: 'AI Chat', href: '/admin/ai-chat', icon: MessageSquare, keywords: 'AI assistant', module: 'ai' },
  { label: 'AI Insights', href: '/admin/ai-insights', icon: Brain, keywords: 'AI-powered insights', module: 'ai' },
  { label: 'AI Training', href: '/admin/ai-training', icon: GraduationCap, keywords: 'Chat persona & knowledge base', module: 'ai' },
  { label: 'Projects', href: '/admin/projects', icon: Building2, keywords: 'Manage projects', module: 'projects' },
  { label: 'Payment Plans', href: '/admin/payment-plans', icon: CreditCard, keywords: 'Pricing plans & payment options', module: 'projects' },
  { label: 'Hero Slides', href: '/admin/hero-slides', icon: ImageIcon, keywords: 'Homepage slider', module: 'heroSlides' },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star, keywords: 'Client reviews', module: 'testimonials' },
  { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle, keywords: 'Frequently asked questions', module: 'faqs' },
  { label: 'Blog', href: '/admin/blog', icon: FileText, keywords: 'Blog posts', module: 'blog' },
  { label: 'Gallery', href: '/admin/gallery', icon: FolderOpen, keywords: 'Photo & video gallery', module: 'gallery' },
  { label: 'Site Visits', href: '/admin/site-visits', icon: CalendarCheck, badgeKey: 'pendingVisits', keywords: 'Visit bookings', module: 'siteVisits' },
  { label: 'Team', href: '/admin/team', icon: UserCog, keywords: 'Team members', module: 'team' },
  { label: 'Newsletter', href: '/admin/newsletter', icon: Mail, keywords: 'Subscribers', module: 'newsletter' },
  { label: 'WhatsApp', href: '/admin/whatsapp', icon: Send, keywords: 'WhatsApp messaging & templates', module: 'whatsapp' },
  { label: 'Menu', href: '/admin/menu', icon: ListTree, keywords: 'Header & footer navigation', module: 'menu' },
  { label: 'Social Links', href: '/admin/social-links', icon: Share2, keywords: 'Header & footer social media links', module: 'settings' },
  { label: 'Content', href: '/admin/content', icon: Globe, keywords: 'Manage content', module: 'content' },
  { label: 'UI Text', href: '/admin/ui-text', icon: Type, keywords: 'Edit every button, label & microcopy string', module: 'content' },
  { label: 'Appearance', href: '/admin/appearance', icon: Palette, keywords: 'Theme colors, fonts, radius, animations & calculator', module: 'settings' },
  { label: 'Activity Log', href: '/admin/activity-log', icon: History, keywords: 'System activity', module: 'activityLog' },
  { label: 'Users', href: '/admin/users', icon: ShieldCheck, keywords: 'Admin users, roles & permissions', module: 'users' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, keywords: 'Configuration', module: 'settings' },
  { label: 'SEO', href: '/admin/seo', icon: Search, keywords: 'Page titles, meta descriptions, social share, canonical', module: 'settings' },
]
