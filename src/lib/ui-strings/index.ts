/**
 * UI-strings registry — every user-visible microcopy string in the frontend,
 * keyed and grouped so the admin panel can edit them. Group files hold the
 * default (English) copy; DB `UiString` rows override at runtime.
 * Server-safe (no 'use client'); the defaults are also bundled into the client
 * so first paint and offline both render correct text.
 */
import home from './home'
import projects from './projects'
import pages from './pages'
import chrome from './chrome'
import shared from './shared'

interface UiGroup {
  label: string
  strings: Record<string, string>
}

export const UI_REGISTRY: Record<string, UiGroup> = { home, projects, pages, chrome, shared }

/** Flat map of every key → default value. */
export const UI_DEFAULTS: Record<string, string> = Object.fromEntries(
  Object.values(UI_REGISTRY).flatMap((g) => Object.entries(g.strings)),
)

/** group name → { label, keys[] } for the admin editor. */
export const UI_GROUPS: Record<string, { label: string; keys: string[] }> = Object.fromEntries(
  Object.entries(UI_REGISTRY).map(([name, g]) => [name, { label: g.label, keys: Object.keys(g.strings) }]),
)

/** Rows for seeding: [{ key, value, groupName }]. */
export function uiSeedRows(): { key: string; value: string; groupName: string }[] {
  return Object.entries(UI_REGISTRY).flatMap(([name, g]) =>
    Object.entries(g.strings).map(([key, value]) => ({ key, value, groupName: name })),
  )
}
