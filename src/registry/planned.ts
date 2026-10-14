import type { PlannedEntry } from './types'

/** Entries that are not built yet. They have no source, examples, or install steps. */
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
