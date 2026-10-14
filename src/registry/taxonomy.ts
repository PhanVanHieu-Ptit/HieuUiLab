/**
 * Functional groups for registry entries, independent of whether an entry is a
 * component or a block. Order here is the order used by filters and sorting.
 */
export const registryCategories = {
  actions: { label: 'Actions', description: 'Buttons and confirmations that trigger work.' },
  overlays: {
    label: 'Overlays',
    description: 'Content layered above the page: dialogs, drawers, and tooltips.',
  },
  navigation: { label: 'Navigation', description: 'Moving between pages and views.' },
  feedback: { label: 'Feedback', description: 'Loading, empty, and status signals.' },
  layout: { label: 'Layout', description: 'Surfaces and dividers that structure content.' },
  'data-display': { label: 'Data display', description: 'Labels, keys, and collections of data.' },
  inputs: { label: 'Inputs', description: 'Controls that collect values from the user.' },
} as const satisfies Record<string, { label: string; description: string }>

export type RegistryCategory = keyof typeof registryCategories

export const registryCategoryIds = Object.keys(registryCategories) as RegistryCategory[]

/** Cross-cutting traits; an entry may have several. */
export const registryTags = [
  'a11y',
  'async',
  'composition',
  'focus-trap',
  'form',
  'keyboard',
  'loading',
  'modal',
  'pagination',
  'polymorphic',
  'radix',
  'responsive',
  'selection',
  'sorting',
  'status',
  'validation',
  'variants',
] as const

export type RegistryTag = (typeof registryTags)[number]

export function isRegistryCategory(value: string): value is RegistryCategory {
  return Object.hasOwn(registryCategories, value)
}

export function isRegistryTag(value: string): value is RegistryTag {
  return (registryTags as readonly string[]).includes(value)
}
