import { badgeEntry } from './badge/meta'
import { breadcrumbEntry } from './breadcrumb/meta'
import { buttonEntry } from './button/meta'
import { cardEntry } from './card/meta'
import { confirmActionEntry } from './confirm-action/meta'
import { dialogEntry } from './dialog/meta'
import { emptyStateEntry } from './empty-state/meta'
import { kbdEntry } from './kbd/meta'
import { resourceListEntry } from './resource-list/meta'
import { separatorEntry } from './separator/meta'
import { sheetEntry } from './sheet/meta'
import { skeletonEntry } from './skeleton/meta'
import { spinnerEntry } from './spinner/meta'
import { tabsEntry } from './tabs/meta'
import type { RegistryCategory, RegistryEntry } from './types'

/** Alphabetical; the sidebar, index page, and search follow this order. */
export const registry: readonly RegistryEntry[] = [
  badgeEntry,
  breadcrumbEntry,
  buttonEntry,
  cardEntry,
  confirmActionEntry,
  dialogEntry,
  emptyStateEntry,
  kbdEntry,
  resourceListEntry,
  separatorEntry,
  sheetEntry,
  skeletonEntry,
  spinnerEntry,
  tabsEntry,
]

/** Where each category's index and detail pages live. */
export const categoryBasePath: Record<RegistryCategory, string> = {
  component: '/components',
  block: '/blocks',
  experiment: '/lab',
}

export function getRegistryEntry(
  slug: string,
  category?: RegistryCategory,
): RegistryEntry | undefined {
  return registry.find(
    (entry) => entry.slug === slug && (category === undefined || entry.category === category),
  )
}

export function getRegistryEntries(category: RegistryCategory): RegistryEntry[] {
  return registry.filter((entry) => entry.category === category)
}

export function registryHref(entry: Pick<RegistryEntry, 'category' | 'slug'>): string {
  return `${categoryBasePath[entry.category]}/${entry.slug}`
}
