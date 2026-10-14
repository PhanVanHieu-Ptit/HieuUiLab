import type { ComponentType } from 'react'

import type { PackageName, RequirementId } from './packages'
import type { RegistryCategory, RegistryTag } from './taxonomy'

export type { PackageName, RequirementId } from './packages'
export type { RegistryCategory, RegistryTag } from './taxonomy'

/** What an entry is; decides its URL (`/components/:slug` or `/blocks/:slug`). */
export type RegistryKind = 'component' | 'block'

/**
 * - `stable`: implemented, tested, API considered settled.
 * - `experimental`: implemented and tested, API may still change.
 * - `planned`: not implemented yet; listed for transparency only.
 */
export type RegistryStatus = 'stable' | 'experimental' | 'planned'

export type ImplementedStatus = Exclude<RegistryStatus, 'planned'>

export interface PropDoc {
  name: string
  type: string
  default?: string
  required?: boolean
  description: string
}

/** One exported part of an entry's public API, e.g. `Dialog` or `DialogContent`. */
export interface ApiPart {
  name: string
  description?: string
  props: readonly PropDoc[]
}

export interface RegistryApi {
  parts: readonly [ApiPart, ...ApiPart[]]
}

/** How an example's live preview is framed. */
export interface PreviewConfig {
  /** `centered` for small controls; `fill` stretches the example to the frame's width. */
  layout?: 'centered' | 'fill'
  /** Minimum frame height. */
  height?: 'sm' | 'md' | 'lg'
}

export interface RegistryExample {
  id: string
  title: string
  description?: string
  component: ComponentType
  /** Source of the example itself, shown in the Code tab. */
  code: string
  preview?: PreviewConfig
}

export interface RegistryInstallation {
  /** Path the source is expected to live at in a consuming project. */
  targetPath: string
  /** npm packages the source imports directly. */
  packages: readonly PackageName[]
  /** Slugs of other registry entries the source imports. Copy those first. */
  registryDependencies: readonly string[]
  /** Project setup the source relies on, e.g. the cn helper. */
  requirements: readonly RequirementId[]
  /** Extra steps or caveats, one sentence each. */
  notes?: readonly string[]
}

interface RegistryEntryBase {
  /** Stable identifier; never reused, even if the slug changes. */
  id: string
  /** URL segment, unique across all kinds. */
  slug: string
  name: string
  description: string
  kind: RegistryKind
  category: RegistryCategory
  tags: readonly RegistryTag[]
}

/** An entry with real source, examples, and install steps. */
export interface ImplementedEntry extends RegistryEntryBase {
  status: ImplementedStatus
  installation: RegistryInstallation
  /** Full source of the component file. */
  source: string
  examples: readonly [RegistryExample, ...RegistryExample[]]
  api: RegistryApi
}

/**
 * An entry that does not exist yet. It has no source, examples, or install
 * steps, so it cannot be rendered as if it were implemented.
 */
export interface PlannedEntry extends RegistryEntryBase {
  status: 'planned'
  /** What the entry will cover once built. */
  plannedScope: string
}

export type RegistryEntry = ImplementedEntry | PlannedEntry

export function isImplemented(entry: RegistryEntry): entry is ImplementedEntry {
  return entry.status !== 'planned'
}
