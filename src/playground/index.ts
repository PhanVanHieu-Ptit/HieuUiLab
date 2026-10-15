import { validatePlaygroundExamples, type PlaygroundExample } from './example'
import { dataTableExample } from './examples/data-table'
import { dialogExample } from './examples/dialog'
import { registryExample } from './examples/registry'

/**
 * Every example the playground can show. This list is the allowlist: an example can only render
 * the components its own module imports, and nothing here is resolved from a string, compiled,
 * or evaluated at runtime.
 */
export const playgroundExamples: readonly [PlaygroundExample, ...PlaygroundExample[]] = [
  registryExample('button', 'Variants, sizes, and the loading and disabled states.'),
  registryExample('input', 'Placeholder, size, and the invalid and disabled states.'),
  registryExample('badge', 'Label, variant, and size.'),
  dialogExample,
  dataTableExample,
]

if (import.meta.env.DEV) {
  const problems = validatePlaygroundExamples(playgroundExamples)
  if (problems.length > 0) {
    throw new Error(`Invalid playground examples:\n${problems.map((p) => `- ${p}`).join('\n')}`)
  }
}

/** The example with this id, or undefined for anything else, including a missing id. */
export function getPlaygroundExample(id: string | null | undefined): PlaygroundExample | undefined {
  return playgroundExamples.find((example) => example.id === id)
}
