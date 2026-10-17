import type { ComponentType } from 'react'

import type { TemplateSlug } from '@/content/templates'

export interface TemplateModule {
  /** The running example app. */
  Template: ComponentType
  /** Its source, shown in the Code tab. The same file that runs. */
  source: string
}

/**
 * Loaders for the example apps. Each splits the component and its source into a chunk of its own,
 * so nothing here reaches the landing page, navigation, or the other templates. The record type
 * makes adding a slug to `templateSlugs` without a loader a compile error.
 */
const loaders: Readonly<Record<TemplateSlug, () => Promise<TemplateModule>>> = {
  'admin-dashboard': async () => {
    const [component, source] = await Promise.all([
      import('./admin-dashboard/template'),
      import('./admin-dashboard/template.tsx?raw'),
    ])
    return { Template: component.AdminDashboardTemplate, source: source.default }
  },
  'operations-monitoring': async () => {
    const [component, source] = await Promise.all([
      import('./operations-monitoring/template'),
      import('./operations-monitoring/template.tsx?raw'),
    ])
    return { Template: component.OperationsMonitoringTemplate, source: source.default }
  },
  'data-management-workspace': async () => {
    const [component, source] = await Promise.all([
      import('./data-management-workspace/template'),
      import('./data-management-workspace/template.tsx?raw'),
    ])
    return { Template: component.DataManagementWorkspaceTemplate, source: source.default }
  },
}

export const templateModuleSlugs = Object.keys(loaders)

const loaded = new Map<TemplateSlug, Promise<TemplateModule>>()

/**
 * The template's component and source. The promise is cached so a template is fetched once and
 * React's `use` gets the same promise on every render; a failed load is forgotten so a retry works.
 */
export function loadTemplate(slug: TemplateSlug): Promise<TemplateModule> {
  const cached = loaded.get(slug)
  if (cached) return cached
  const promise = loaders[slug]().catch((error: unknown) => {
    loaded.delete(slug)
    throw error
  })
  loaded.set(slug, promise)
  return promise
}
