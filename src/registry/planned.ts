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
