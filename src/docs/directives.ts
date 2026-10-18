import { parseAttrs, type Attrs } from './attributes'
import { tokenGroups } from './tokens'

// A directive is a paragraph holding only `::name{key="value"}`. It stands for content generated
// from typed data (a props table, a live example, the design tokens), so docs never copy it.
// Whether the slug, part, example or group exists is checked where the data is available: when
// the page renders, and in `validateDocs`.

interface DirectiveSpec {
  required: readonly string[]
  optional: readonly string[]
  /** Allowed values for attributes with a closed set. */
  values?: Readonly<Record<string, readonly string[]>>
}

export const directiveSpecs = {
  'registry-api': { required: ['slug'], optional: ['part'] },
  'registry-index': {
    required: [],
    optional: ['kind', 'category'],
    values: { kind: ['component', 'block'] },
  },
  'registry-example': { required: ['slug', 'example'], optional: [] },
  source: { required: ['path'], optional: [] },
  'design-tokens': { required: ['group'], optional: [], values: { group: tokenGroups } },
  'theme-switcher': { required: [], optional: [] },
} as const satisfies Record<string, DirectiveSpec>

export type DirectiveName = keyof typeof directiveSpecs

export interface Directive {
  name: string
  attrs: Attrs
}

export function isDirectiveName(name: string): name is DirectiveName {
  return Object.hasOwn(directiveSpecs, name)
}

const DIRECTIVE = /^::([a-z][a-z0-9-]*)(?:\{(.*)\})?$/

/** Reads one directive from the whole text of a paragraph. */
export function parseDirective(text: string): { directive: Directive } | { error: string } {
  const match = DIRECTIVE.exec(text.trim())
  const name = match?.[1]
  if (name === undefined) {
    return {
      error: 'a directive is one line, ::name or ::name{key="value"}, alone in its paragraph',
    }
  }
  const parsed = parseAttrs(match?.[2] ?? '')
  if ('error' in parsed) return { error: `::${name}: ${parsed.error}` }
  return { directive: { name, attrs: parsed.attrs } }
}

/** A message when the name or attributes do not fit the directive's spec, else undefined. */
export function directiveShapeError(directive: Directive): string | undefined {
  const { name, attrs } = directive
  if (!isDirectiveName(name)) {
    return `unknown directive ::${name} (known: ${Object.keys(directiveSpecs).join(', ')})`
  }
  const spec: DirectiveSpec = directiveSpecs[name]
  for (const key of spec.required) {
    if (!Object.hasOwn(attrs, key)) return `::${name} needs ${key}="…"`
  }
  for (const [key, value] of Object.entries(attrs)) {
    if (!spec.required.includes(key) && !spec.optional.includes(key)) {
      return `::${name} has no attribute "${key}"`
    }
    const allowed = spec.values?.[key]
    if (allowed && !allowed.includes(value)) {
      return `::${name} ${key}="${value}" is not one of ${allowed.join(', ')}`
    }
  }
  return undefined
}
