import type { ComponentType } from 'react'

export type RegistryCategory = 'component' | 'block' | 'experiment'

/**
 * - `stable`: implemented, tested, API considered settled.
 * - `beta`: implemented, API may still change.
 * - `planned`: not implemented yet; listed for transparency only.
 */
export type RegistryStatus = 'stable' | 'beta' | 'planned'

export interface PropDoc {
  name: string
  type: string
  default?: string
  description: string
}

export interface RegistryDemo {
  id: string
  title: string
  description?: string
  component: ComponentType
  /** Source of the demo itself, shown in the Code tab. */
  code: string
}

export interface RegistryEntry {
  slug: string
  name: string
  description: string
  category: RegistryCategory
  status: RegistryStatus
  /** npm packages the copied source depends on. */
  dependencies: readonly string[]
  /** Slugs of other registry entries the source imports, e.g. a block's components. */
  registryDependencies?: readonly string[]
  /** Path the source is expected to live at in a consuming project. */
  targetPath: string
  /** Full source of the component file. */
  source: string
  demos: readonly RegistryDemo[]
  props: readonly PropDoc[]
}
