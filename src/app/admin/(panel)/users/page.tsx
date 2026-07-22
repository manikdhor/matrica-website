'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Power,
  PowerOff,
  KeyRound,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PERMISSION_MODULES,
  ROLE_PRESETS,
  ROLE_LABELS,
  ALL_MODULE_KEYS,
  normalizeRole,
  resolvePermissions,
} from '@/lib/permissions'

// ─── Types ─────────────────────────────────────────────────────────
interface AdminUserRow {
  id: string
  username: string
  name: string
  role: string
  permissions: string | null
  active: boolean
  lastLogin: string | null
  createdAt: string
}

interface FormState {
  username: string
  name: string
  password: string
  role: string
  modules: string[]
  readOnly: boolean
  active: boolean
}

const PRESET_ROLES = ['super_admin', 'manager', 'editor', 'sales', 'viewer'] as const

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  manager: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  editor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  sales: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  viewer: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
  custom: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
}

function presetModules(role: string): string[] {
  const preset = ROLE_PRESETS[role]
  if (!preset) return []
  return preset.modules === '*' ? [...ALL_MODULE_KEYS] : [...preset.modules]
}

function emptyForm(): FormState {
  return {
    username: '',
    name: '',
    password: '',
    role: 'editor',
    modules: presetModules('editor'),
    readOnly: false,
    active: true,
  }
}

function roleLabel(role: string): string {
  return ROLE_LABELS[normalizeRole(role)] || ROLE_LABELS[role] || role
}

function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users || [])
      } else {
        toast.error(data.error || 'Failed to load users')
      }
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth')
      const data = await res.json()
      if (data.authenticated && data.user?.id) setCurrentUserId(data.user.id)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchCurrentUser()
  }, [fetchUsers, fetchCurrentUser])

  // ─── Dialog handlers ───────────────────────────────────────────
  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEditDialog = (user: AdminUserRow) => {
    const role = normalizeRole(user.role)
    const perms = resolvePermissions(user)
    setEditingId(user.id)
    setForm({
      username: user.username,
      name: user.name,
      password: '',
      role,
      modules: perms.modules === '*' ? [...ALL_MODULE_KEYS] : [...perms.modules],
      readOnly: !!perms.readOnly,
      active: user.active,
    })
    setDialogOpen(true)
  }

  const applyPreset = (role: string) => {
    if (role === 'custom') {
      setForm((f) => ({ ...f, role: 'custom' }))
      return
    }
    const preset = ROLE_PRESETS[role]
    setForm((f) => ({
      ...f,
      role,
      modules: presetModules(role),
      readOnly: !!preset?.readOnly,
    }))
  }

  const toggleModule = (key: string) => {
    setForm((f) => ({
      ...f,
      role: 'custom',
      modules: f.modules.includes(key)
        ? f.modules.filter((m) => m !== key)
        : [...f.modules, key],
    }))
  }

  const toggleReadOnly = () => {
    setForm((f) => ({ ...f, role: 'custom', readOnly: !f.readOnly }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!editingId) {
      if (!form.username.trim()) { toast.error('Username is required'); return }
      if (!form.password) { toast.error('Password is required'); return }
    }
    if (form.password && form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (form.role !== 'super_admin' && form.modules.length === 0) {
      toast.error('Select at least one module')
      return
    }

    const permissions =
      form.role === 'super_admin'
        ? null
        : { modules: form.modules, readOnly: form.readOnly }

    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId
        ? {
            id: editingId,
            name: form.name.trim(),
            role: form.role,
            permissions,
            ...(form.password ? { password: form.password } : {}),
          }
        : {
            username: form.username.trim(),
            name: form.name.trim(),
            password: form.password,
            role: form.role,
            permissions,
          }
      const res = await fetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(editingId ? 'User updated' : 'User created')
        setDialogOpen(false)
        fetchUsers()
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch {
      toast.error('Request failed')
    }
    setSaving(false)
  }

  const handleToggleActive = async (user: AdminUserRow) => {
    setTogglingId(user.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(user.active ? 'User deactivated' : 'User activated')
        fetchUsers()
      } else {
        toast.error(data.error || 'Failed to toggle')
      }
    } catch {
      toast.error('Failed to toggle')
    }
    setTogglingId(null)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('User deleted')
        setDeletingId(null)
        fetchUsers()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const isSuperAdminRole = form.role === 'super_admin'

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E6B3A]/15 border border-[#1E6B3A]/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#34D399]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="text-sm text-slate-400">Manage admin accounts, roles and permissions</p>
          </div>
        </div>
        <button onClick={openAddDialog} className="btn-admin btn-admin-primary text-sm">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#34D399] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No users yet</h3>
          <p className="text-sm text-slate-400 mb-4">Create the first admin account.</p>
          <button onClick={openAddDialog} className="btn-admin btn-admin-primary text-sm">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId
                  const role = normalizeRole(user.role)
                  const perms = resolvePermissions(user)
                  return (
                    <tr key={user.id} className="border-b border-slate-800/40 last:border-b-0 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1E6B3A]/20 border border-[#1E6B3A]/30 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#34D399]">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {user.name}
                              {isSelf && <span className="ml-2 text-[10px] text-slate-500">(you)</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{user.username}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${ROLE_BADGE[user.role === 'custom' ? 'custom' : role] || ROLE_BADGE.custom}`}>
                            {user.role === 'custom' ? 'Custom' : roleLabel(user.role)}
                          </span>
                          {perms.readOnly && role !== 'super_admin' && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-800/60 border border-slate-700/50" title="Read-only access">
                              <Eye className="w-3 h-3" /> Read-only
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={isSelf || togglingId === user.id}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            user.active
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                          }`}
                          title={isSelf ? 'You cannot deactivate yourself' : user.active ? 'Deactivate' : 'Activate'}
                        >
                          {togglingId === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : user.active ? (
                            <Power className="w-3.5 h-3.5" />
                          ) : (
                            <PowerOff className="w-3.5 h-3.5" />
                          )}
                          {user.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatLastLogin(user.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditDialog(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(user.id)}
                            disabled={isSelf}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? 'You cannot delete yourself' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[560px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto admin-scrollbar">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-white text-lg">
              {editingId ? 'Edit User' : 'Add User'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-4 space-y-4">
            {/* Name + Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Username {!editingId && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  className="admin-input disabled:opacity-50"
                  placeholder="e.g. jane"
                  value={form.username}
                  disabled={!!editingId}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                {editingId ? (
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3" /> Reset Password <span className="text-slate-600">(leave blank to keep current)</span>
                  </span>
                ) : (
                  <>Password <span className="text-red-400">*</span></>
                )}
              </label>
              <input
                type="password"
                className="admin-input"
                placeholder={editingId ? 'New password (optional)' : 'Minimum 8 characters'}
                value={form.password}
                autoComplete="new-password"
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>

            {/* Role preset */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Role</label>
              <select
                className="admin-input"
                value={form.role}
                onChange={(e) => applyPreset(e.target.value)}
              >
                {PRESET_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <p className="text-[11px] text-slate-600 mt-1">
                {form.role === 'super_admin'
                  ? 'Full access to everything, including users and settings.'
                  : form.role === 'custom'
                    ? 'Custom permissions — configure module access below.'
                    : 'Selecting a preset pre-checks the modules below. Changing them switches to Custom.'}
              </p>
            </div>

            {/* Module permissions */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Module Access</label>
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-1.5 ${isSuperAdminRole ? 'opacity-50 pointer-events-none' : ''}`}>
                {PERMISSION_MODULES.map((mod) => {
                  const checked = isSuperAdminRole || form.modules.includes(mod.key)
                  return (
                    <label
                      key={mod.key}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        checked
                          ? 'bg-[#1E6B3A]/15 border-[#1E6B3A]/30 text-[#34D399]'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-[#1E6B3A] w-3.5 h-3.5"
                        checked={checked}
                        disabled={isSuperAdminRole}
                        onChange={() => toggleModule(mod.key)}
                      />
                      {mod.label}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Read-only toggle */}
            {!isSuperAdminRole && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#1E6B3A] w-4 h-4"
                  checked={form.readOnly}
                  onChange={toggleReadOnly}
                />
                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  Read-only (can view selected modules but cannot make changes)
                </span>
              </label>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="btn-admin btn-admin-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-admin btn-admin-primary text-sm"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : editingId ? (
                  'Update User'
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────────────── */}
      <Dialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-white text-lg">Delete User</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <p className="text-sm text-slate-300 mb-6">
              Are you sure you want to delete this admin account? Their sessions will be
              terminated immediately. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="btn-admin btn-admin-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-admin btn-admin-danger text-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
