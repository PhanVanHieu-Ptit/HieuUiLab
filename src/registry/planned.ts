import type { PlannedEntry } from './types'

/** Entries that are not built yet. They have no source, examples, or install steps. */
export const tooltipEntry: PlannedEntry = {
  id: 'tooltip',
  slug: 'tooltip',
  name: 'Tooltip',
  description: 'A short, non-interactive hint shown on hover and keyboard focus.',
  kind: 'component',
  category: 'overlays',
  tags: ['a11y', 'keyboard', 'radix'],
  status: 'planned',
  plannedScope:
    'Radix Tooltip with a delay group, shown on focus as well as hover, dismissed with Escape, and never the only place important information lives.',
}

export const comboboxEntry: PlannedEntry = {
  id: 'combobox',
  slug: 'combobox',
  name: 'Combobox',
  description: 'A text input with a filterable list of options.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'async', 'keyboard'],
  status: 'planned',
  plannedScope:
    'The ARIA combobox pattern with aria-activedescendant, keyboard navigation, an announced result count, and support for options loaded asynchronously.',
}

export const dataTableEntry: PlannedEntry = {
  id: 'data-table',
  slug: 'data-table',
  name: 'Data table',
  description: 'A sortable table for remote data with loading, empty, and error states.',
  kind: 'block',
  category: 'data-display',
  tags: ['async', 'composition', 'loading'],
  status: 'planned',
  plannedScope:
    'A semantic table with sortable column headers (aria-sort), the same explicit states as Resource list, and a horizontal scroll container on narrow screens.',
}
