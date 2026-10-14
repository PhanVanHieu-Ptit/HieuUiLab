import {
  isRegistryCategory,
  isRegistryTag,
  registryCategories,
  registryCategoryIds,
  registryTags,
  type RegistryCategory,
  type RegistryTag,
} from './taxonomy'
import {
  isImplemented,
  type ImplementedEntry,
  type RegistryEntry,
  type RegistryStatus,
} from './types'

export const catalogSorts = {
  name: 'Name',
  status: 'Status',
  category: 'Category',
} as const

export type CatalogSort = keyof typeof catalogSorts

export interface CatalogQuery {
  /** Free text, matched against name, slug, description, category, and tags. */
  q: string
  category?: RegistryCategory | undefined
  /** An entry must have every selected tag. */
  tags: readonly RegistryTag[]
  sort: CatalogSort
}

export const defaultCatalogQuery: CatalogQuery = { q: '', tags: [], sort: 'name' }

const statusOrder: Record<RegistryStatus, number> = { stable: 0, experimental: 1, planned: 2 }

function byName(a: RegistryEntry, b: RegistryEntry): number {
  return a.name.localeCompare(b.name, 'en')
}

const comparators: Record<CatalogSort, (a: RegistryEntry, b: RegistryEntry) => number> = {
  name: byName,
  status: (a, b) => statusOrder[a.status] - statusOrder[b.status] || byName(a, b),
  category: (a, b) =>
    registryCategoryIds.indexOf(a.category) - registryCategoryIds.indexOf(b.category) ||
    byName(a, b),
}

function searchableText(entry: RegistryEntry): string {
  return [
    entry.name,
    entry.slug,
    entry.description,
    registryCategories[entry.category].label,
    ...entry.tags,
  ]
    .join(' ')
    .toLowerCase()
}

/** Whether `entry` matches every word of a free-text query. */
export function matchesSearch(entry: RegistryEntry, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const text = searchableText(entry)
  return words.every((word) => text.includes(word))
}

/** Entries matching `query`, in the query's sort order. Does not mutate `entries`. */
export function filterRegistry(
  entries: readonly RegistryEntry[],
  query: Partial<CatalogQuery>,
): RegistryEntry[] {
  const { q = '', category, tags = [], sort = 'name' } = query
  return entries
    .filter(
      (entry) =>
        (category === undefined || entry.category === category) &&
        tags.every((tag) => entry.tags.includes(tag)) &&
        matchesSearch(entry, q),
    )
    .sort(comparators[sort])
}

export function isCatalogQueryActive(query: CatalogQuery): boolean {
  return query.q.trim() !== '' || query.category !== undefined || query.tags.length > 0
}

/** Reads a query from the URL; unknown categories, tags, and sorts are ignored. */
export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const category = params.get('category') ?? ''
  const sort = params.get('sort') ?? ''
  const tags = params.getAll('tag').filter(isRegistryTag)
  return {
    q: params.get('q') ?? '',
    category: isRegistryCategory(category) ? category : undefined,
    tags: [...new Set(tags)],
    sort: Object.hasOwn(catalogSorts, sort) ? (sort as CatalogSort) : 'name',
  }
}

/** The URL form of a query; defaults are left out so the bare URL means "everything". */
export function toSearchParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q.trim()) params.set('q', query.q)
  if (query.category) params.set('category', query.category)
  for (const tag of query.tags) params.append('tag', tag)
  if (query.sort !== 'name') params.set('sort', query.sort)
  return params
}

export interface CatalogFacets {
  categories: RegistryCategory[]
  tags: RegistryTag[]
}

/** Categories and tags used by at least one of `entries`, in taxonomy order. */
export function facetsFor(entries: readonly RegistryEntry[]): CatalogFacets {
  const categories = new Set(entries.map((entry) => entry.category))
  const tags = new Set(entries.flatMap((entry) => entry.tags))
  return {
    categories: registryCategoryIds.filter((id) => categories.has(id)),
    tags: registryTags.filter((tag) => tags.has(tag)),
  }
}

function dependenciesOf(entry: RegistryEntry): readonly string[] {
  return isImplemented(entry) ? entry.installation.registryDependencies : []
}

/** Implemented entries that list `slug` as a direct registry dependency, by name. */
export function registryDependents(
  entries: readonly RegistryEntry[],
  slug: string,
): ImplementedEntry[] {
  return entries
    .filter(isImplemented)
    .filter((entry) => entry.installation.registryDependencies.includes(slug))
    .sort(byName)
}

export interface RelatedEntry {
  entry: RegistryEntry
  /** Why it is related, from its own side, e.g. `Uses Button` or `Also in Actions`. */
  reasons: string[]
}

/**
 * Entries most related to `entry`, scored from metadata alone: a direct registry
 * dependency either way (3), the same category (2), and each shared tag (1).
 * Planned entries are left out, since they have nothing to use yet.
 */
export function relatedEntries(
  entry: RegistryEntry,
  entries: readonly RegistryEntry[],
  limit = 4,
): RelatedEntry[] {
  const scored = entries.flatMap((other) => {
    if (other.slug === entry.slug || !isImplemented(other)) return []
    const reasons: string[] = []
    let score = 0
    if (dependenciesOf(entry).includes(other.slug)) {
      score += 3
      reasons.push(`Required by ${entry.name}`)
    }
    if (dependenciesOf(other).includes(entry.slug)) {
      score += 3
      reasons.push(`Uses ${entry.name}`)
    }
    if (other.category === entry.category) {
      score += 2
      reasons.push(`Also in ${registryCategories[entry.category].label}`)
    }
    const shared = entry.tags.filter((tag) => other.tags.includes(tag))
    if (shared.length > 0) {
      score += shared.length
      reasons.push(`Shares ${shared.join(', ')}`)
    }
    return score > 0 ? [{ entry: other, reasons, score }] : []
  })
  return scored
    .sort((a, b) => b.score - a.score || byName(a.entry, b.entry))
    .slice(0, limit)
    .map(({ entry: related, reasons }) => ({ entry: related, reasons }))
}

/** Entries that best match an unknown slug, for "did you mean" links on a 404. */
export function suggestEntries(
  entries: readonly RegistryEntry[],
  slug: string,
  limit = 3,
): RegistryEntry[] {
  const needle = slug.toLowerCase()
  const words = needle.split(/[^a-z0-9]+/).filter(Boolean)
  const scored = entries.flatMap((entry) => {
    const distance = editDistance(needle, entry.slug)
    const close = distance <= Math.max(2, Math.floor(entry.slug.length / 3))
    const shared = words.some((word) => word.length > 2 && searchableText(entry).includes(word))
    return close || shared ? [{ entry, distance }] : []
  })
  return scored
    .sort((a, b) => a.distance - b.distance || byName(a.entry, b.entry))
    .slice(0, limit)
    .map(({ entry }) => entry)
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const substitution = (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1)
      current.push(Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, substitution))
    }
    previous = current
  }
  return previous[b.length] ?? 0
}
