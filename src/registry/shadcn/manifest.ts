import { parseSourceImports } from '../validate'
import type { ImplementedEntry, RegistryEntry } from '../types'
import { isImplemented } from '../types'
import {
  CN_PACKAGE,
  CN_SOURCE_IMPORT,
  REGISTRY_ITEM_SCHEMA_URL,
  REGISTRY_NAME,
  REGISTRY_SCHEMA_URL,
  REGISTRY_URL_PATH,
  shadcnTokens,
} from './config'

/** The item and file types this registry can emit so far. */
export type ShadcnItemType = 'registry:ui'

export interface ShadcnItemFile {
  path: string
  content: string
  type: ShadcnItemType
}

/**
 * One installable item, as served at `/r/<name>.json`. Key order follows what `shadcn build`
 * writes, so the install test can compare this against the official build byte for byte.
 */
export interface ShadcnItem {
  $schema: typeof REGISTRY_ITEM_SCHEMA_URL
  name: string
  title: string
  description: string
  dependencies: string[]
  registryDependencies?: string[]
  files: ShadcnItemFile[]
  docs: string
  categories: string[]
  type: ShadcnItemType
}

/** An item as listed in the index: the same fields, without the file contents or `$schema`. */
export interface ShadcnIndexItem extends Omit<ShadcnItem, '$schema' | 'files'> {
  files: Omit<ShadcnItemFile, 'content'>[]
}

/** The catalog served at `/r/registry.json`. */
export interface ShadcnIndex {
  $schema: typeof REGISTRY_SCHEMA_URL
  name: string
  homepage: string
  items: ShadcnIndexItem[]
}

export interface ShadcnRegistry {
  items: ShadcnItem[]
  index: ShadcnIndex
  /** File contents to write, keyed by path from the repository root. */
  files: Record<string, string>
}

/** Where a published item's file is listed. The consumer's `ui` alias decides the real location. */
export function itemFilePath(slug: string): string {
  return `registry/ui/${slug}.tsx`
}

/**
 * The entry's source as a consumer installs it. The site imports its own `cn` helper from
 * `@/lib/cn`; a project created by `shadcn init` has no such file, and shadcn's own items import
 * `cn` from the `cn` package, so the emitted file does too.
 */
export function rewriteSource(source: string): string {
  return source.replaceAll(`from '${CN_SOURCE_IMPORT}'`, `from '${CN_PACKAGE}'`)
}

/**
 * Tailwind utilities in `source` that use one of the given color tokens, e.g. `bg-muted` yields
 * `muted`. A token is matched whole, so `text-muted` does not count as `text-muted-foreground`.
 */
export function tokensUsed(source: string, tokens: Iterable<string>): string[] {
  const prefixes =
    'bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|caret|accent|shadow'
  const found: string[] = []
  for (const token of tokens) {
    const pattern = new RegExp(`(?<![\\w-])(?:${prefixes})-${token}(?![\\w-])`)
    if (pattern.test(source)) found.push(token)
  }
  return found.sort()
}

/** True when the source uses a bare `border` utility, which relies on the base-layer border color. */
export function usesBareBorder(source: string): boolean {
  return /(?<![\w-])border(?![\w-])/.test(source)
}

/** The note the CLI prints after install, derived from what the source actually uses. */
function installNote(content: string): string {
  const used = tokensUsed(content, shadcnTokens)
  const tokens = used.length > 0 ? ` (${used.join(', ')})` : ''
  const border = usesBareBorder(content)
    ? ' Bare border utilities use the default border color from the base layer that shadcn init writes.'
    : ''
  return `Needs Tailwind CSS v4 and the semantic color tokens that shadcn init writes${tokens}.${border}`
}

/** Maps one implemented entry to a registry item. Throws for kinds that are not supported yet. */
export function toShadcnItem(entry: ImplementedEntry): ShadcnItem {
  if (entry.kind !== 'component') {
    throw new Error(`${entry.slug}: only components can be published so far, not ${entry.kind}s`)
  }
  const content = rewriteSource(entry.source)
  const dependencies = [...parseSourceImports(content).packages].sort()
  return {
    $schema: REGISTRY_ITEM_SCHEMA_URL,
    name: entry.slug,
    title: entry.name,
    description: entry.description,
    dependencies,
    files: [{ path: itemFilePath(entry.slug), content, type: 'registry:ui' }],
    docs: installNote(content),
    categories: [entry.category, ...entry.tags],
    type: 'registry:ui',
  }
}

export function toIndexItem(item: ShadcnItem): ShadcnIndexItem {
  return {
    name: item.name,
    title: item.title,
    description: item.description,
    dependencies: item.dependencies,
    ...(item.registryDependencies ? { registryDependencies: item.registryDependencies } : {}),
    files: item.files.map(({ path, type }) => ({ path, type })),
    docs: item.docs,
    categories: item.categories,
    type: item.type,
  }
}

/** JSON as it is committed: two-space indent and a final newline. */
export function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

/** Builds every published item, the index, and the files to write for them. */
export function buildShadcnRegistry(
  entries: readonly RegistryEntry[],
  slugs: readonly string[],
  homepage: string,
): ShadcnRegistry {
  const items = slugs.map((slug) => {
    const entry = entries.find((candidate) => candidate.slug === slug)
    if (!entry || !isImplemented(entry)) throw new Error(`${slug}: not an implemented entry`)
    return toShadcnItem(entry)
  })
  const index: ShadcnIndex = {
    $schema: REGISTRY_SCHEMA_URL,
    name: REGISTRY_NAME,
    homepage,
    items: items.map(toIndexItem),
  }
  const files: Record<string, string> = {
    [`public${REGISTRY_URL_PATH}/registry.json`]: serialize(index),
  }
  for (const item of items) files[`public${REGISTRY_URL_PATH}/${item.name}.json`] = serialize(item)
  return { items, index, files }
}
