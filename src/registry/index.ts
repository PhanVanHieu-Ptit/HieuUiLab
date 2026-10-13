import { badgeEntry } from './badge/meta'
import { breadcrumbEntry } from './breadcrumb/meta'
import { buttonEntry } from './button/meta'
import { cardEntry } from './card/meta'
import { dialogEntry } from './dialog/meta'
import { kbdEntry } from './kbd/meta'
import { separatorEntry } from './separator/meta'
import { sheetEntry } from './sheet/meta'
import { skeletonEntry } from './skeleton/meta'
import { spinnerEntry } from './spinner/meta'
import { tabsEntry } from './tabs/meta'
import type { RegistryEntry } from './types'

/** Alphabetical; the sidebar, index page, and search follow this order. */
export const registry: readonly RegistryEntry[] = [
  badgeEntry,
  breadcrumbEntry,
  buttonEntry,
  cardEntry,
  dialogEntry,
  kbdEntry,
  separatorEntry,
  sheetEntry,
  skeletonEntry,
  spinnerEntry,
  tabsEntry,
]

export function getRegistryEntry(slug: string): RegistryEntry | undefined {
  return registry.find((entry) => entry.slug === slug)
}
