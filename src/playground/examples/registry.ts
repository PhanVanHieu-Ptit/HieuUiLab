import { getImplementedEntry, registryHref } from '@/registry'
import { playgroundSnippet, resolvePlaygroundProps } from '@/registry/playground'
import type { PlaygroundControl, PlaygroundValue } from '@/registry/types'
import { importPath } from '@/registry/usage'

import { formatImport } from '../code'
import {
  booleanControl,
  defineControls,
  enumControl,
  stringControl,
  type ControlDef,
  type ControlValues,
} from '../controls'
import { definePlaygroundExample, type PlaygroundExample } from '../example'
import { RegistryStage, type RegistryConfig } from './registry-stage'

/** `defaultChecked` → `Default checked`, `aria-invalid` → `Aria invalid`. */
function humanize(prop: string): string {
  const words = prop.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase()
}

function toControl(control: PlaygroundControl): ControlDef {
  const label = control.label ?? humanize(control.prop)
  switch (control.kind) {
    case 'boolean':
      return booleanControl({ label, default: control.default })
    case 'text':
      // A button or badge with no label says nothing, so its content cannot be blank.
      return stringControl({
        label,
        default: control.default,
        required: control.prop === 'children',
      })
    case 'select': {
      const [first, ...rest] = control.options
      if (first === undefined) throw new Error(`Control "${control.prop}" has no options`)
      return enumControl<string>({
        label,
        options: [first, ...rest],
        default: control.default,
        display: control.options.length <= 3 ? 'segmented' : 'select',
      })
    }
  }
}

/** The registry playground only knows strings and flags; a number cannot reach it. */
function toPlaygroundValues(values: ControlValues): Record<string, PlaygroundValue> {
  return Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, PlaygroundValue] => typeof entry[1] !== 'number',
    ),
  )
}

/**
 * An example built from a registry entry's own `playground`, so its controls, defaults, and
 * generated code are the ones the docs validate and the detail page already shows.
 */
export function registryExample(slug: string, description: string): PlaygroundExample {
  const entry = getImplementedEntry(slug)
  const playground = entry?.playground
  if (!entry || !playground) throw new Error(`Registry entry "${slug}" has no playground`)

  const controls = defineControls(
    Object.fromEntries(playground.controls.map((control) => [control.prop, toControl(control)])),
  )
  const importLine = formatImport([playground.part], importPath(entry))

  return definePlaygroundExample({
    id: slug,
    title: entry.name,
    description,
    docsHref: registryHref(entry),
    controls,
    resolve: (values): RegistryConfig => ({
      Component: playground.component,
      props: resolvePlaygroundProps(playground, toPlaygroundValues(values)),
      part: playground.part,
      importLine,
    }),
    Stage: RegistryStage,
    code: (config) => playgroundSnippet(config.importLine, config.part, config.props),
  })
}
