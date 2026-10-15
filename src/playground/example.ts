import type { ComponentType } from 'react'

import {
  defaultValues,
  sanitizeValues,
  type ControlSchema,
  type ControlValues,
  type ValuesOf,
} from './controls'

/** Minimum height of the preview frame. */
export type StageHeight = 'sm' | 'md' | 'lg'

/** `centered` for small controls; `fill` stretches the example to the frame's width. */
export type StageLayout = 'centered' | 'fill'

export interface StageProps<C> {
  /** What the example resolved from the current control values. */
  readonly config: C
  /** Element a portalled part (Dialog) renders into, so it stays inside the preview frame. */
  readonly portalContainer: HTMLElement | null
}

export interface ExampleDefinition<S extends ControlSchema, C> {
  /** Stable kebab-case id; also the `?example=` value. */
  readonly id: string
  readonly title: string
  readonly description: string
  /** Registry page of the component, if it has one. */
  readonly docsHref?: string
  /** A line shown under the preview, for behaviour the person using the example should know. */
  readonly note?: string
  readonly controls: S
  readonly height?: StageHeight
  readonly layout?: StageLayout
  /**
   * The single place that turns control values into what the example shows. Both the preview
   * (`Stage`) and the copyable `code` read only this result, so they cannot disagree.
   */
  readonly resolve: (values: ValuesOf<S>) => C
  /** Renders the component. A component, not a function, so it may hold state. */
  readonly Stage: ComponentType<StageProps<C>>
  readonly code: (config: C) => string
}

export interface ResolvedExample {
  /** The sanitized control values. */
  readonly values: ControlValues
  /** Passed to `Stage`; only the example's own `Stage` reads it. */
  readonly config: unknown
  readonly code: string
}

/** An example as stored in the allowlist, with its configuration type erased. */
export interface PlaygroundExample {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly docsHref: string | undefined
  readonly note: string | undefined
  readonly height: StageHeight
  readonly layout: StageLayout
  readonly controls: ControlSchema
  readonly Stage: ComponentType<StageProps<unknown>>
  /** Validates `raw` against the controls first, so anything can be passed in. */
  readonly resolve: (raw: Readonly<Record<string, unknown>>) => ResolvedExample
}

/**
 * Defines an allowlisted example. `resolve` and `code` are checked against the controls and
 * `Stage`; the stored example takes untrusted input and sanitizes it before anything runs.
 */
export function definePlaygroundExample<S extends ControlSchema, C>(
  definition: ExampleDefinition<S, C>,
): PlaygroundExample {
  const { controls } = definition
  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    docsHref: definition.docsHref,
    note: definition.note,
    height: definition.height ?? 'md',
    layout: definition.layout ?? 'centered',
    controls,
    // `config` only ever comes from this example's own `resolve`, so the types agree.
    Stage: definition.Stage as unknown as ComponentType<StageProps<unknown>>,
    resolve: (raw) => {
      const values = sanitizeValues(controls, raw)
      // `values` was just sanitized against `controls`, so it has the shape `ValuesOf<S>` describes.
      const config = definition.resolve(values as unknown as ValuesOf<S>)
      return { values, config, code: definition.code(config) }
    },
  }
}

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Problems with a set of examples; an empty list means they are sound. */
export function validatePlaygroundExamples(examples: readonly PlaygroundExample[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const example of examples) {
    const label = example.id || '(no id)'
    if (!kebabCase.test(example.id)) problems.push(`${label}: the id is not kebab-case`)
    if (seen.has(example.id)) problems.push(`${label}: the id is used more than once`)
    seen.add(example.id)
    if (example.title.trim() === '') problems.push(`${label}: the title is empty`)
    if (example.description.trim() === '') problems.push(`${label}: the description is empty`)
    if (Object.keys(example.controls).length === 0) problems.push(`${label}: it has no controls`)
    if (example.resolve(defaultValues(example.controls)).code.trim() === '') {
      problems.push(`${label}: it generates no code at its defaults`)
    }
  }
  return problems
}
