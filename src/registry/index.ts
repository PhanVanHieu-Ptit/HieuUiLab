import { badgeEntry } from './badge/meta'
import { breadcrumbEntry } from './breadcrumb/meta'
import { buttonEntry } from './button/meta'
import { cardEntry } from './card/meta'
import { confirmActionEntry } from './confirm-action/meta'
import { dialogEntry } from './dialog/meta'
import { emptyStateEntry } from './empty-state/meta'
import { kbdEntry } from './kbd/meta'
import { comboboxEntry, dataTableEntry, tooltipEntry } from './planned'
import { resourceListEntry } from './resource-list/meta'
import { separatorEntry } from './separator/meta'
import { sheetEntry } from './sheet/meta'
import { skeletonEntry } from './skeleton/meta'
import { spinnerEntry } from './spinner/meta'
import { tabsEntry } from './tabs/meta'
import {
  isImplemented,
  type ImplementedEntry,
  type RegistryEntry,
  type RegistryKind,
} from './types'
import { assertValidRegistry } from './validate'

/**
 * The single source of truth for every component and block. The sidebar, search,
 * index pages, detail pages, landing page, and About page all read from it.
 * Alphabetical; navigation follows this order.
 */
export const registry: readonly RegistryEntry[] = [
  badgeEntry,
  breadcrumbEntry,
  buttonEntry,
  cardEntry,
  comboboxEntry,
  confirmActionEntry,
  dataTableEntry,
  dialogEntry,
  emptyStateEntry,
  kbdEntry,
  resourceListEntry,
  separatorEntry,
  sheetEntry,
  skeletonEntry,
  spinnerEntry,
  tabsEntry,
  tooltipEntry,
]

// Fail loudly while developing; tests run the same validation in CI.
if (import.meta.env.DEV) assertValidRegistry(registry)

/** Where each kind's index and detail pages live. */
export const kindBasePath: Record<RegistryKind, string> = {
  component: '/components',
  block: '/blocks',
}

export function getRegistryEntry(slug: string, kind?: RegistryKind): RegistryEntry | undefined {
  return registry.find(
    (entry) => entry.slug === slug && (kind === undefined || entry.kind === kind),
  )
}

export function getRegistryEntries(kind: RegistryKind): RegistryEntry[] {
  return registry.filter((entry) => entry.kind === kind)
}

/** An implemented entry, or undefined when the slug is unknown or only planned. */
export function getImplementedEntry(
  slug: string,
  kind?: RegistryKind,
): ImplementedEntry | undefined {
  const entry = getRegistryEntry(slug, kind)
  return entry && isImplemented(entry) ? entry : undefined
}

export function registryHref(entry: Pick<RegistryEntry, 'kind' | 'slug'>): string {
  return `${kindBasePath[entry.kind]}/${entry.slug}`
}
