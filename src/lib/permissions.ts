/**
 * Role & permission model for the admin panel.
 *
 * Permissions JSON shape (stored in AdminUser.permissions):
 *   { modules: string[] | '*', readOnly?: boolean }
 *
 * Resolution order:
 *   1. role === 'super_admin' (or legacy 'admin') → everything, always.
 *   2. Explicit permissions JSON on the user → governs.
 *   3. Null/empty/invalid permissions → fall back to the role preset.
 *      Unknown roles fall back to the 'manager' preset.
 */

export interface PermissionModuleDef {
  key: string
  label: string
}

export const PERMISSION_MODULES: PermissionModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'leads', label: 'Leads' },
  { key: 'reports', label: 'Reports' },
  { key: 'ai', label: 'AI Tools' },
  { key: 'projects', label: 'Projects' },
  { key: 'heroSlides', label: 'Hero Slides' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'blog', label: 'Blog' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'team', label: 'Team' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'menu', label: 'Menu' },
  { key: 'content', label: 'Content' },
  { key: 'siteVisits', label: 'Site Visits' },
  { key: 'activityLog', label: 'Activity Log' },
  { key: 'settings', label: 'Settings' },
  { key: 'users', label: 'Users' },
]

export const ALL_MODULE_KEYS = PERMISSION_MODULES.map((m) => m.key)

export interface PermissionSet {
  modules: string[] | '*'
  readOnly?: boolean
}

/** Content-focused modules an editor can manage. */
const EDITOR_MODULES = [
  'projects',
  'heroSlides',
  'testimonials',
  'faqs',
  'blog',
  'gallery',
  'team',
  'menu',
  'content',
]

export const ROLE_PRESETS: Record<string, PermissionSet> = {
  super_admin: { modules: '*' },
  manager: { modules: ALL_MODULE_KEYS.filter((k) => k !== 'users' && k !== 'settings') },
  editor: { modules: EDITOR_MODULES },
  viewer: { modules: '*', readOnly: true },
  // Sales: sees ONLY leads assigned to them (scope 'own'), and may only change
  // status / add remarks (notes) / manage follow-ups on those leads. No create,
  // edit, delete, assign, import, or email. See resolveLeadAccess() below.
  sales: { modules: ['leads', 'reports'], readOnly: true },
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  editor: 'Editor',
  viewer: 'Viewer',
  sales: 'Sales',
  custom: 'Custom',
}

/**
 * Normalize a stored role. The original seeded user has role 'admin' —
 * map it to super_admin so it keeps full access. Unknown roles are
 * treated as manager for backwards compatibility.
 */
export function normalizeRole(role: string | null | undefined): string {
  if (role === 'admin' || role === 'super_admin') return 'super_admin'
  if (role && (ROLE_PRESETS[role] || role === 'custom')) return role
  return 'manager'
}

export function parsePermissions(permissions: string | null | undefined): PermissionSet | null {
  if (!permissions) return null
  try {
    const parsed = JSON.parse(permissions)
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.modules === '*' || Array.isArray(parsed.modules)) {
      return { modules: parsed.modules, readOnly: !!parsed.readOnly }
    }
    return null
  } catch {
    return null
  }
}

export interface PermissionUser {
  role: string
  permissions?: string | null
}

/** Effective permission set for a user (explicit JSON or role preset). */
export function resolvePermissions(user: PermissionUser): PermissionSet {
  const role = normalizeRole(user.role)
  if (role === 'super_admin') return { modules: '*' }
  // An explicit permission set always wins — including an empty modules
  // array, which means "no access" rather than falling back to a preset.
  const explicit = parsePermissions(user.permissions)
  if (explicit) return explicit
  return ROLE_PRESETS[role] ?? ROLE_PRESETS.manager
}

/**
 * Check whether a user may access a module.
 * @param write true = mutation access required, false = read access
 */
export function hasPermission(user: PermissionUser, module: string, write = false): boolean {
  if (normalizeRole(user.role) === 'super_admin') return true
  const perms = resolvePermissions(user)
  if (write && perms.readOnly) return false
  if (perms.modules === '*') return true
  return perms.modules.includes(module)
}

/**
 * Fine-grained lead capabilities. The `sales` role is scoped to its OWN leads
 * (Lead.assignedTo === user's display name) and may only move status and add
 * remarks/notes/follow-ups on them — never create, edit fields, delete,
 * (re)assign, import, export-all, or email. Everyone else keeps the module
 * semantics: leads-write → full control, leads-read → view-only over all leads.
 */
export interface LeadAccess {
  /** 'all' = every lead; 'own' = only leads assigned to this user */
  scope: 'all' | 'own'
  /** create / edit fields / delete / import / email / tag mutations */
  canEdit: boolean
  /** change status + add notes (remarks) + manage follow-ups */
  canStatus: boolean
  /** change assignedTo */
  canAssign: boolean
}

/** Effective lead access for a user, or null when the leads module is denied. */
export function resolveLeadAccess(user: PermissionUser): LeadAccess | null {
  if (!hasPermission(user, 'leads', false)) return null
  const write = hasPermission(user, 'leads', true)
  // Sales without an explicit write grant → own-leads, status/remarks only.
  // An explicit permissions JSON granting leads-write still wins (custom setups).
  if (normalizeRole(user.role) === 'sales' && !write) {
    return { scope: 'own', canEdit: false, canStatus: true, canAssign: false }
  }
  return { scope: 'all', canEdit: write, canStatus: write, canAssign: write }
}
