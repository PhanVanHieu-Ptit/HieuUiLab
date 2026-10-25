import { isImplemented, type FullRegistryEntry } from '../types'
import { parseSourceImports } from '../validate'
import {
  CN_SOURCE_IMPORT,
  NAMESPACE,
  REGISTRY_NAME,
  REGISTRY_URL_PATH,
  consumerPackages,
  shadcnBuiltinUi,
  shadcnTokens,
} from './config'
import {
  itemFilePath,
  rewriteSource,
  tokensUsed,
  toIndexItem,
  type ShadcnIndex,
  type ShadcnItem,
} from './manifest'

export interface ShadcnIssue {
  /** The item's name, or `index` for the catalog. */
  item: string
  field: string
  message: string
}

/** Everything the rules read. Tests build one from the real registry and break one thing at a time. */
export interface ShadcnRegistryContext {
  entries: readonly FullRegistryEntry[]
  publishedSlugs: readonly string[]
  shadowsBuiltin: readonly string[]
  items: readonly ShadcnItem[]
  index: ShadcnIndex
  /** URL paths of the files committed under `public/r`, e.g. `/r/kbd.json`. */
  publicFiles: readonly string[]
  /** The text of a repository file, or undefined when it does not exist. */
  readFile(path: string): string | undefined
  /** The site's own dependencies and devDependencies from package.json. */
  packageDependencies: Readonly<Record<string, string>>
  /** The site stylesheet, where the design tokens are defined. */
  globalsCss: string
}

const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const npmNamePattern = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/
const supportedTypes = new Set(['registry:ui'])
const stateUtilityPattern = /(?<![\w-])(?:focus-ring|focus-ring-inset|disabled-state)(?![\w-])/

/** Only these keys are emitted. The published schemas accept any key, so a typo would pass them. */
const itemKeys = new Set([
  '$schema',
  'name',
  'title',
  'description',
  'dependencies',
  'registryDependencies',
  'files',
  'categories',
  'docs',
  'type',
])
const indexItemKeys = new Set([...itemKeys].filter((key) => key !== '$schema'))
const fileKeys = new Set(['path', 'content', 'type'])
const indexFileKeys = new Set(['path', 'type'])
const indexKeys = new Set(['$schema', 'name', 'homepage', 'items'])

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

function unknownKeys(value: object, allowed: ReadonlySet<string>): string[] {
  return Object.keys(value).filter((key) => !allowed.has(key))
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

/** Token names the site stylesheet defines as Tailwind colors or shadows. */
function siteTokens(css: string): string[] {
  return [...css.matchAll(/--(?:color|shadow)-([a-z0-9-]+)\s*:/g)].map((match) => match[1] ?? '')
}

/** The slug a namespaced dependency such as `@hieuuilab/button` names, or undefined. */
function ownSlug(dependency: string): string | undefined {
  return dependency.startsWith(`${NAMESPACE}/`) ? dependency.slice(NAMESPACE.length + 1) : undefined
}

export function validateShadcnRegistry(ctx: ShadcnRegistryContext): ShadcnIssue[] {
  const issues: ShadcnIssue[] = []
  const report = (item: string, field: string, message: string) => {
    issues.push({ item, field, message })
  }

  validatePublished(ctx, report)
  validateNames(ctx, report)

  const siteOnlyTokens = [...new Set(siteTokens(ctx.globalsCss))].filter(
    (token) => !shadcnTokens.has(token),
  )
  const names = new Set(ctx.items.map((item) => item.name))
  const allPaths: string[] = []

  for (const item of ctx.items) {
    const entry = ctx.entries.find((candidate) => candidate.slug === item.name)
    validateItem(ctx, item, entry, siteOnlyTokens, names, report)
    allPaths.push(...item.files.map((file) => file.path))
  }
  for (const path of duplicates(allPaths)) {
    report('index', 'files', `two items write the same file path "${path}"`)
  }

  validateDependencyCycles(ctx.items, report)
  validateIndex(ctx, report)
  return issues
}

type Report = (item: string, field: string, message: string) => void

function validatePublished(ctx: ShadcnRegistryContext, report: Report) {
  for (const slug of duplicates(ctx.publishedSlugs)) {
    report(slug, 'publishedSlugs', 'is listed more than once')
  }
  for (const slug of ctx.publishedSlugs) {
    const entry = ctx.entries.find((candidate) => candidate.slug === slug)
    if (!entry) {
      report(slug, 'publishedSlugs', 'is not in the registry')
    } else if (!isImplemented(entry)) {
      report(slug, 'publishedSlugs', 'is planned, not implemented')
    } else {
      if (entry.kind !== 'component') {
        report(slug, 'kind', `${entry.kind}s cannot be published yet; only components`)
      }
      if (entry.installation.requirements.includes('state-utilities')) {
        report(
          slug,
          'installation.requirements',
          'needs the focus-ring, focus-ring-inset or disabled-state utilities, which a project ' +
            'created by shadcn init does not define; publishing them is not supported yet',
        )
      }
    }
    if (!ctx.items.some((item) => item.name === slug)) {
      report(slug, 'items', 'is published but has no item')
    }
  }
  for (const item of ctx.items) {
    if (!ctx.publishedSlugs.includes(item.name)) {
      report(item.name, 'name', 'is generated but not in the published list')
    }
  }
}

function validateNames(ctx: ShadcnRegistryContext, report: Report) {
  const names = ctx.items.map((item) => item.name)
  for (const name of duplicates(names)) report(name, 'name', 'is used by more than one item')

  for (const name of names) {
    if (!namePattern.test(name)) report(name, 'name', 'is not kebab-case')
    // `registry.json` is the catalog; an item with this name would overwrite it.
    if (name === 'registry') report(name, 'name', '"registry" is reserved for the catalog')
    if (shadcnBuiltinUi.has(name) && !ctx.shadowsBuiltin.includes(name)) {
      report(
        name,
        'name',
        'is also the name of a shadcn item, so `shadcn add` with this bare name installs the ' +
          'wrong one; list it in shadowsBuiltin to publish it on purpose',
      )
    }
  }
  for (const name of ctx.shadowsBuiltin) {
    if (!shadcnBuiltinUi.has(name)) {
      report(name, 'shadowsBuiltin', 'is listed but shadcn has no item with this name')
    }
    if (!names.includes(name)) report(name, 'shadowsBuiltin', 'is listed but not published')
  }
}

function validateItem(
  ctx: ShadcnRegistryContext,
  item: ShadcnItem,
  entry: FullRegistryEntry | undefined,
  siteOnlyTokens: readonly string[],
  names: ReadonlySet<string>,
  report: Report,
) {
  const at = (field: string, message: string) => {
    report(item.name, field, message)
  }

  for (const key of unknownKeys(item, itemKeys)) at(key, 'is not a field this registry emits')
  for (const field of ['title', 'description', 'docs'] as const) {
    if (isBlank(item[field])) at(field, 'is empty')
  }
  if (item.categories.length === 0 || item.categories.some(isBlank)) {
    at('categories', 'is empty or has a blank entry')
  }
  // Parsed JSON can hold any string here, whatever the compile-time type says.
  const itemType: string = item.type
  if (!supportedTypes.has(itemType)) at('type', `"${itemType}" is not supported yet`)

  // Files: present, listed once, matching the entry's source after the rewrite.
  if (item.files.length === 0) at('files', 'is empty')
  for (const [position, file] of item.files.entries()) {
    const where = `files[${String(position)}]`
    for (const key of unknownKeys(file, fileKeys))
      at(`${where}.${key}`, 'is not a field this registry emits')
    const fileType: string = file.type
    if (fileType !== itemType) at(`${where}.type`, `is "${fileType}" but the item is "${itemType}"`)
    if (file.path !== itemFilePath(item.name)) {
      at(`${where}.path`, `is "${file.path}", expected "${itemFilePath(item.name)}"`)
    }
    if (isBlank(file.content)) at(`${where}.content`, 'is empty')
    if (file.content.includes(CN_SOURCE_IMPORT)) {
      at(
        `${where}.content`,
        `still imports ${CN_SOURCE_IMPORT}, which a consuming project does not have`,
      )
    }
    const imports = parseSourceImports(file.content)
    for (const specifier of imports.unresolvable) {
      at(`${where}.content`, `imports "${specifier}", which a consuming project cannot resolve`)
    }
    for (const dependency of imports.registryFiles) {
      const slug = dependency.replace(/^components\/(?:ui|blocks)\//, '').replace(/\.tsx$/, '')
      if (!(item.registryDependencies ?? []).includes(`${NAMESPACE}/${slug}`)) {
        at(
          'registryDependencies',
          `imports ${dependency} but does not depend on ${NAMESPACE}/${slug}`,
        )
      }
    }
    if (stateUtilityPattern.test(file.content)) {
      at(
        `${where}.content`,
        'uses focus-ring, focus-ring-inset or disabled-state, which shadcn init does not define',
      )
    }
    const siteOnly = tokensUsed(file.content, siteOnlyTokens)
    if (siteOnly.length > 0) {
      at(
        `${where}.content`,
        `uses ${siteOnly.join(', ')}, tokens only this site defines; a project created by shadcn init does not have them`,
      )
    }

    if (position === 0 && entry && isImplemented(entry)) {
      const sourcePath = `src/${entry.installation.targetPath}`
      const source = ctx.readFile(sourcePath)
      if (source === undefined) {
        at('files', `the source file ${sourcePath} does not exist`)
      } else if (file.content !== rewriteSource(source)) {
        at(`${where}.content`, `differs from ${sourcePath}; run pnpm registry:build`)
      }
    }
  }
  if (!entry) at('name', 'has no matching registry entry')

  // npm dependencies: what the emitted source imports is what the item declares.
  const imported = new Set(
    item.files.flatMap((file) => [...parseSourceImports(file.content).packages]),
  )
  for (const name of duplicates(item.dependencies))
    at('dependencies', `lists "${name}" more than once`)
  for (const name of item.dependencies) {
    if (!npmNamePattern.test(name)) {
      at('dependencies', `"${name}" is not a bare package name (versions are not pinned here)`)
    } else if (!imported.has(name)) {
      at('dependencies', `declares "${name}" but the source does not import it`)
    } else if (!(name in ctx.packageDependencies) && !consumerPackages.includes(name)) {
      at('dependencies', `"${name}" is not a dependency of this site`)
    }
  }
  for (const name of imported) {
    if (!item.dependencies.includes(name)) {
      at('dependencies', `source imports "${name}" but it is not declared`)
    }
  }

  // registry dependencies: only items of this registry, by namespace or full URL.
  const dependencies = item.registryDependencies ?? []
  for (const name of duplicates(dependencies))
    at('registryDependencies', `lists "${name}" more than once`)
  for (const dependency of dependencies) {
    const slug = ownSlug(dependency)
    if (slug !== undefined) {
      if (slug === item.name) at('registryDependencies', 'depends on itself')
      else if (!names.has(slug))
        at('registryDependencies', `"${dependency}" is not a published item`)
    } else if (!/^https?:\/\/\S+\.json$/.test(dependency)) {
      at(
        'registryDependencies',
        `"${dependency}" is a bare name, which shadcn resolves to its own registry; use ${NAMESPACE}/<name> or a full URL`,
      )
    }
  }
}

function validateDependencyCycles(items: readonly ShadcnItem[], report: Report) {
  const edges = new Map(
    items.map((item) => [
      item.name,
      (item.registryDependencies ?? []).map(ownSlug).filter((slug) => slug !== undefined),
    ]),
  )
  const visiting: string[] = []
  const done = new Set<string>()
  const reported = new Set<string>()
  const visit = (name: string) => {
    if (done.has(name)) return
    const at = visiting.indexOf(name)
    if (at !== -1) {
      const cycle = [...visiting.slice(at), name].join(' → ')
      if (!reported.has(cycle)) report(name, 'registryDependencies', `dependency cycle: ${cycle}`)
      reported.add(cycle)
      return
    }
    visiting.push(name)
    for (const next of edges.get(name) ?? []) visit(next)
    visiting.pop()
    done.add(name)
  }
  for (const item of items) visit(item.name)
}

function validateIndex(ctx: ShadcnRegistryContext, report: Report) {
  const at = (field: string, message: string) => {
    report('index', field, message)
  }
  const { index } = ctx

  for (const key of unknownKeys(index, indexKeys)) at(key, 'is not a field this registry emits')
  if (index.name !== REGISTRY_NAME) at('name', `is "${index.name}", expected "${REGISTRY_NAME}"`)
  if (!/^https:\/\/\S+$/.test(index.homepage)) at('homepage', 'is not an https URL')

  for (const [position, entry] of index.items.entries()) {
    for (const key of unknownKeys(entry, indexItemKeys)) {
      at(`items[${String(position)}].${key}`, 'is not a field this registry emits')
    }
    for (const file of entry.files) {
      for (const key of unknownKeys(file, indexFileKeys)) {
        at(`items[${String(position)}].files.${key}`, 'is not a field this registry emits')
      }
    }
  }
  for (const name of duplicates(index.items.map((entry) => entry.name))) {
    at('items', `lists "${name}" more than once`)
  }
  // The catalog must describe exactly the items that are served.
  if (JSON.stringify(index.items) !== JSON.stringify(ctx.items.map(toIndexItem))) {
    at('items', 'does not match the item files; run pnpm registry:build')
  }

  const expected = [
    `${REGISTRY_URL_PATH}/registry.json`,
    ...ctx.items.map((item) => `${REGISTRY_URL_PATH}/${item.name}.json`),
  ]
  for (const path of expected) {
    if (!ctx.publicFiles.includes(path))
      at('files', `public${path} is missing; run pnpm registry:build`)
  }
  for (const path of ctx.publicFiles) {
    if (!expected.includes(path)) at('files', `public${path} belongs to no published item`)
  }
}

export function formatShadcnIssues(issues: readonly ShadcnIssue[]): string {
  return issues.map((issue) => `- ${issue.item} › ${issue.field}: ${issue.message}`).join('\n')
}
