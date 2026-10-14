import { isPackageName, isRequirementId } from './packages'
import { isRegistryCategory, isRegistryTag } from './taxonomy'
import type { ApiPart, ImplementedEntry, PropDoc, RegistryEntry } from './types'
import { partExportNames, sourceExports } from './usage'

export interface RegistryIssue {
  /** The entry's id, or its position when the id itself is unusable. */
  entry: string
  field: string
  message: string
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const targetPathPattern = /^components\/(?:ui|blocks)\/[a-z0-9]+(?:-[a-z0-9]+)*\.tsx$/
const kinds = new Set(['component', 'block'])
const statuses = new Set(['stable', 'experimental', 'planned'])
/** Imports a consuming project already has; not listed as install steps. */
const peerModules = new Set(['react', 'react-dom'])
const stateUtilityPattern = /\b(?:focus-ring|focus-ring-inset|disabled-state)\b/
/** Fields only an implemented entry may have; a planned entry carrying one is mislabelled. */
const implementedOnlyFields = ['installation', 'source', 'examples', 'api'] as const

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

interface SourceImports {
  packages: Set<string>
  /** Registry target paths, e.g. `components/ui/button.tsx`. */
  registryFiles: Set<string>
  usesCn: boolean
  /** App-internal or relative imports that a consuming project would not have. */
  unresolvable: string[]
}

/** Module specifiers imported by a source file, grouped by what they mean for installation. */
export function parseSourceImports(source: string): SourceImports {
  const specifiers = [
    ...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
    ...source.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm),
  ].map((match) => match[1] ?? '')

  const result: SourceImports = {
    packages: new Set(),
    registryFiles: new Set(),
    usesCn: false,
    unresolvable: [],
  }
  for (const specifier of specifiers) {
    if (specifier === '@/lib/cn') {
      result.usesCn = true
    } else if (/^@\/components\/(?:ui|blocks)\//.test(specifier)) {
      result.registryFiles.add(`${specifier.slice(2)}.tsx`)
    } else if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      result.unresolvable.push(specifier)
    } else {
      const segments = specifier.split('/')
      const name = specifier.startsWith('@') ? segments.slice(0, 2).join('/') : (segments[0] ?? '')
      if (!peerModules.has(name)) result.packages.add(name)
    }
  }
  return result
}

function validateImplemented(
  entry: ImplementedEntry,
  bySlug: ReadonlyMap<string, RegistryEntry>,
  report: (field: string, message: string) => void,
) {
  const { installation, examples, api, source } = entry

  if (isBlank(source)) report('source', 'is empty')
  if (!targetPathPattern.test(installation.targetPath)) {
    report(
      'installation.targetPath',
      `"${installation.targetPath}" is not components/(ui|blocks)/<name>.tsx`,
    )
  }

  for (const name of installation.packages as readonly string[]) {
    if (!isPackageName(name)) report('installation.packages', `unknown package "${name}"`)
  }
  for (const name of duplicates(installation.packages)) {
    report('installation.packages', `lists "${name}" more than once`)
  }
  for (const id of installation.requirements as readonly string[]) {
    if (!isRequirementId(id)) report('installation.requirements', `unknown requirement "${id}"`)
  }
  for (const id of duplicates(installation.requirements)) {
    report('installation.requirements', `lists "${id}" more than once`)
  }

  for (const slug of installation.registryDependencies) {
    const dependency = bySlug.get(slug)
    if (slug === entry.slug) {
      report('installation.registryDependencies', 'depends on itself')
    } else if (!dependency) {
      report('installation.registryDependencies', `"${slug}" is not in the registry`)
    } else if (dependency.status === 'planned') {
      report('installation.registryDependencies', `"${slug}" is planned, not implemented`)
    }
  }
  for (const slug of duplicates(installation.registryDependencies)) {
    report('installation.registryDependencies', `lists "${slug}" more than once`)
  }

  // The declared install steps must match what the source actually imports.
  if (!isBlank(source)) {
    const imports = parseSourceImports(source)
    for (const name of imports.packages) {
      if (!(installation.packages as readonly string[]).includes(name)) {
        report('installation.packages', `source imports "${name}" but it is not declared`)
      }
    }
    for (const name of installation.packages) {
      if (!imports.packages.has(name)) {
        report('installation.packages', `declares "${name}" but the source does not import it`)
      }
    }
    for (const specifier of imports.unresolvable) {
      report('source', `imports "${specifier}", which a consuming project would not have`)
    }
    const dependencyFiles = new Map(
      installation.registryDependencies.flatMap((slug) => {
        const dependency = bySlug.get(slug)
        return dependency && 'installation' in dependency
          ? [[dependency.installation.targetPath, slug] as const]
          : []
      }),
    )
    for (const file of imports.registryFiles) {
      if (!dependencyFiles.has(file)) {
        report(
          'installation.registryDependencies',
          `source imports ${file} but no dependency provides it`,
        )
      }
    }
    for (const [file, slug] of dependencyFiles) {
      if (!imports.registryFiles.has(file)) {
        report(
          'installation.registryDependencies',
          `declares "${slug}" but the source does not import it`,
        )
      }
    }
    if (imports.usesCn !== installation.requirements.includes('cn-helper')) {
      report(
        'installation.requirements',
        imports.usesCn
          ? 'source uses cn but cn-helper is not required'
          : 'requires cn-helper but the source does not use cn',
      )
    }
    if (
      stateUtilityPattern.test(source) !== installation.requirements.includes('state-utilities')
    ) {
      report(
        'installation.requirements',
        stateUtilityPattern.test(source)
          ? 'source uses a state utility but state-utilities is not required'
          : 'requires state-utilities but the source does not use them',
      )
    }
  }

  if (examples.length === 0) report('examples', 'needs at least one example')
  for (const id of duplicates(examples.map((example) => example.id))) {
    report('examples', `example id "${id}" is used more than once`)
  }
  for (const example of examples) {
    if (!slugPattern.test(example.id))
      report('examples', `example id "${example.id}" is not kebab-case`)
    if (isBlank(example.title)) report(`examples.${example.id}`, 'has no title')
    if (isBlank(example.code)) report(`examples.${example.id}`, 'has no code')
    if (typeof example.component !== 'function')
      report(`examples.${example.id}`, 'has no component')
  }

  for (const [index, guideline] of (entry.guidelines ?? []).entries()) {
    if (isBlank(guideline)) report('guidelines', `guideline #${String(index)} is empty`)
  }

  if (api.parts.length === 0) report('api', 'needs at least one part')
  for (const name of duplicates(api.parts.map((part) => part.name))) {
    report('api', `part "${name}" is documented more than once`)
  }
  for (const part of api.parts) {
    for (const name of duplicates(part.props.map((prop) => prop.name))) {
      report(`api.${part.name}`, `prop "${name}" is documented more than once`)
    }
    for (const prop of part.props) {
      if (isBlank(prop.type) || isBlank(prop.description)) {
        report(`api.${part.name}`, `prop "${prop.name}" needs a type and a description`)
      }
      if (prop.required && prop.default !== undefined) {
        report(`api.${part.name}`, `prop "${prop.name}" is required but has a default`)
      }
    }
  }

  // The generated import line names only real exports.
  if (!isBlank(source)) {
    const exported = sourceExports(source)
    for (const part of api.parts) {
      for (const name of partExportNames(part)) {
        if (!exported.has(name)) report(`api.${part.name}`, `source does not export "${name}"`)
      }
    }
  }

  validatePlayground(entry, report)
}

/** The documented prop named exactly `name`, or one of a grouped doc like `name / value`. */
function findPropDoc(part: ApiPart, name: string): PropDoc | undefined {
  return part.props.find((prop) => prop.name.split(' / ').some((each) => each.trim() === name))
}

/** The string literals of a type made only of them, e.g. `'sm' | 'md'`; otherwise undefined. */
function literalUnion(type: string): string[] | undefined {
  if (!/^\s*'[^']*'(?:\s*\|\s*'[^']*')*\s*$/.test(type)) return undefined
  return [...type.matchAll(/'([^']*)'/g)].map((match) => match[1] ?? '')
}

/** A documented default as the control value it means: `'md'` → `md`, `false` → `false`. */
function documentedDefault(prop: PropDoc): string | undefined {
  return prop.default?.replace(/^'(.*)'$/, '$1')
}

function validatePlayground(
  entry: ImplementedEntry,
  report: (field: string, message: string) => void,
) {
  const { playground } = entry
  if (!playground) return
  const field = 'playground'
  const part = entry.api.parts.find((each) => each.name === playground.part)
  if (!part) {
    report(field, `part "${playground.part}" is not documented in api.parts`)
    return
  }
  const name = playground.component.displayName ?? playground.component.name
  // Minified builds rename functions; the check only means something in dev and tests.
  if (import.meta.env.DEV && name !== playground.part) {
    report(field, `renders ${name || 'an anonymous component'} but generates <${playground.part}>`)
  }
  if (playground.controls.length === 0) report(field, 'needs at least one control')
  for (const prop of duplicates([
    ...playground.controls.map((control) => control.prop),
    ...Object.keys(playground.staticProps ?? {}),
  ])) {
    report(field, `sets "${prop}" more than once`)
  }

  const spreadsNative = part.props.some((prop) => prop.name === '...props')
  for (const control of playground.controls) {
    const label = `control "${control.prop}"`
    const doc = findPropDoc(part, control.prop)
    if (!doc && !spreadsNative) {
      report(field, `${label} is not a documented prop of ${part.name}`)
      continue
    }
    if (control.kind === 'select') {
      // An omitted select must render as its default, so the default must be documented.
      const exact = part.props.find((prop) => prop.name === control.prop)
      if (exact?.default === undefined) {
        report(field, `${label} needs a documented default`)
      } else if (documentedDefault(exact) !== control.default) {
        report(field, `${label} defaults to "${control.default}" but the docs say ${exact.default}`)
      }
      const literals = exact ? literalUnion(exact.type) : undefined
      for (const option of control.options) {
        if (literals && !literals.includes(option)) {
          report(field, `${label} offers "${option}", which ${exact?.type ?? ''} does not allow`)
        }
      }
      if (!control.options.includes(control.default)) {
        report(field, `${label} default "${control.default}" is not one of its options`)
      }
    } else if (control.kind === 'boolean') {
      // An omitted flag is false, so a documented default must be false too.
      const exact = part.props.find((prop) => prop.name === control.prop)
      if (exact?.default !== undefined && exact.default !== 'false') {
        report(
          field,
          `${label} is left out when false, but the docs default it to ${exact.default}`,
        )
      }
    }
  }
}

/** Registry dependency cycles, each as a path of slugs, e.g. `a → b → a`. */
function findCycles(entries: readonly RegistryEntry[]): string[] {
  const graph = new Map(
    entries.map((entry) => [
      entry.slug,
      'installation' in entry ? entry.installation.registryDependencies : [],
    ]),
  )
  const cycles: string[] = []
  const done = new Set<string>()

  function visit(slug: string, path: string[]) {
    if (path.includes(slug)) {
      cycles.push([...path.slice(path.indexOf(slug)), slug].join(' → '))
      return
    }
    if (done.has(slug)) return
    for (const next of graph.get(slug) ?? []) {
      if (next !== slug) visit(next, [...path, slug])
    }
    done.add(slug)
  }

  for (const slug of graph.keys()) visit(slug, [])
  return cycles
}

/**
 * Every problem with the registry's metadata. Types catch most mistakes at build
 * time; this catches the rest: duplicates, broken references, entries whose
 * declared install steps drift from their source, and casts around the types.
 */
export function validateRegistry(entries: readonly RegistryEntry[]): RegistryIssue[] {
  const issues: RegistryIssue[] = []
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]))

  for (const id of duplicates(entries.map((entry) => entry.id))) {
    issues.push({ entry: id, field: 'id', message: `id "${id}" is used by more than one entry` })
  }
  for (const slug of duplicates(entries.map((entry) => entry.slug))) {
    issues.push({
      entry: slug,
      field: 'slug',
      message: `slug "${slug}" is used by more than one entry`,
    })
  }

  entries.forEach((entry, index) => {
    const label = isBlank(entry.id) ? `#${String(index)}` : entry.id
    const report = (field: string, message: string) => {
      issues.push({ entry: label, field, message })
    }

    if (!slugPattern.test(entry.id)) report('id', `"${entry.id}" is not kebab-case`)
    if (!slugPattern.test(entry.slug)) report('slug', `"${entry.slug}" is not kebab-case`)
    if (isBlank(entry.name)) report('name', 'is empty')
    if (isBlank(entry.description)) report('description', 'is empty')
    if (!kinds.has(entry.kind)) report('kind', `unknown kind "${entry.kind}"`)
    if (!statuses.has(entry.status)) report('status', `unknown status "${entry.status}"`)
    const category: string = entry.category
    if (!isRegistryCategory(category)) report('category', `unknown category "${category}"`)
    for (const tag of entry.tags as readonly string[]) {
      if (!isRegistryTag(tag)) report('tags', `unknown tag "${tag}"`)
    }
    for (const tag of duplicates(entry.tags)) report('tags', `lists "${tag}" more than once`)

    if (entry.status === 'planned') {
      if (isBlank(entry.plannedScope)) report('plannedScope', 'is empty')
      for (const field of [...implementedOnlyFields, 'guidelines']) {
        if (field in entry) report(field, 'a planned entry must not have implementation fields')
      }
    } else {
      for (const field of implementedOnlyFields) {
        if (!(field in entry)) report(field, 'is missing')
      }
      if (implementedOnlyFields.every((field) => field in entry)) {
        validateImplemented(entry, bySlug, report)
      }
    }
  })

  for (const cycle of findCycles(entries)) {
    issues.push({
      entry: cycle.split(' → ')[0] ?? '',
      field: 'installation.registryDependencies',
      message: `dependency cycle ${cycle}`,
    })
  }

  return issues
}

export function formatIssues(issues: readonly RegistryIssue[]): string {
  return issues.map((issue) => `- ${issue.entry} › ${issue.field}: ${issue.message}`).join('\n')
}

export function assertValidRegistry(entries: readonly RegistryEntry[]): void {
  const issues = validateRegistry(entries)
  if (issues.length > 0) {
    throw new Error(`Invalid registry metadata:\n${formatIssues(issues)}`)
  }
}
