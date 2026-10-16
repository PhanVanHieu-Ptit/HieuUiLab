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
  /**
   * Adds a Full / Tablet / Mobile width switch and keeps the example mounted when the Code tab is
   * shown. Only container queries follow the chosen width, so use it for examples built with them.
   */
  responsive?: boolean
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

/** A value a playground control can set: an option, a flag, or text. */
export type PlaygroundValue = string | boolean

/** One control in an entry's playground; `prop` is a prop of the playground's API part. */
export type PlaygroundControl =
  | {
      kind: 'select'
      prop: string
      label?: string
      /** A subset of the literals in the documented type. */
      options: readonly string[]
      /** Must equal the documented default, so leaving the prop out renders the same. */
      default: string
    }
  | { kind: 'boolean'; prop: string; label?: string; default: boolean }
  /** Free text; `prop: 'children'` sets the element's content. */
  | { kind: 'text'; prop: string; label?: string; default: string }

/**
 * Live controls for one part of an entry. The preview and the generated code are
 * both built from the same resolved props, so they cannot disagree.
 */
export interface RegistryPlayground {
  /** API part the controls configure; also the JSX tag in the generated code. */
  part: string
  /** The real component the preview renders. */
  component: ComponentType<Record<string, PlaygroundValue>>
  controls: readonly PlaygroundControl[]
  /** Props always passed, e.g. an aria-label. Shown in the generated code too. */
  staticProps?: Readonly<Record<string, PlaygroundValue>>
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
  /**
   * Usage notes and behavioural constraints, shown before the install steps:
   * when to use it, what it must not be used for, and accessibility caveats.
   */
  guidelines?: readonly string[]
  api: RegistryApi
  /** Live prop controls, only for entries that render fully from props and text. */
  playground?: RegistryPlayground
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
