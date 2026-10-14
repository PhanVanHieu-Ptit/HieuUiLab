import { describe, expect, it } from 'vitest'

import { getRegistryEntries, registry } from '.'
import {
  defaultCatalogQuery,
  facetsFor,
  filterRegistry,
  isCatalogQueryActive,
  matchesSearch,
  parseCatalogQuery,
  suggestEntries,
  toSearchParams,
  type CatalogQuery,
} from './catalog'
import { isImplemented } from './types'

const slugs = (entries: readonly { slug: string }[]) => entries.map((entry) => entry.slug)

describe('filterRegistry', () => {
  it('returns every entry, sorted by name, for the default query', () => {
    const result = filterRegistry(registry, defaultCatalogQuery)
    expect(result).toHaveLength(registry.length)
    expect(result.map((entry) => entry.name)).toEqual(
      registry.map((entry) => entry.name).sort((a, b) => a.localeCompare(b, 'en')),
    )
  })

  it('does not mutate the input', () => {
    const before = slugs(registry)
    filterRegistry(registry, { sort: 'status' })
    expect(slugs(registry)).toEqual(before)
  })

  it('searches names, case-insensitively', () => {
    expect(slugs(filterRegistry(registry, { q: 'DIALOG' }))).toContain('dialog')
  })

  it('searches descriptions, tags, and category labels', () => {
    expect(slugs(filterRegistry(registry, { q: 'aria-current' }))).toEqual(['breadcrumb'])
    expect(slugs(filterRegistry(registry, { q: 'focus-trap' }))).toEqual(
      expect.arrayContaining(['dialog', 'sheet', 'confirm-action']),
    )
    expect(slugs(filterRegistry(registry, { q: 'overlays' }))).toEqual([
      'dialog',
      'sheet',
      'tooltip',
    ])
  })

  it('requires every word of the search to match', () => {
    expect(slugs(filterRegistry(registry, { q: 'modal radix' }))).toEqual(['dialog', 'sheet'])
    expect(filterRegistry(registry, { q: 'modal nonexistentword' })).toEqual([])
  })

  it('filters by category', () => {
    const result = filterRegistry(registry, { category: 'feedback' })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((entry) => entry.category === 'feedback')).toBe(true)
  })

  it('filters by tags with AND semantics', () => {
    const loading = filterRegistry(registry, { tags: ['loading'] })
    const loadingStatus = filterRegistry(registry, { tags: ['loading', 'status'] })
    expect(loadingStatus.length).toBeLessThan(loading.length)
    expect(slugs(loadingStatus)).toEqual(['resource-list', 'spinner'])
  })

  it('combines search, category, and tags', () => {
    const result = filterRegistry(getRegistryEntries('component'), {
      q: 'tab',
      category: 'navigation',
      tags: ['keyboard'],
    })
    expect(slugs(result)).toEqual(['tabs'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterRegistry(registry, { category: 'inputs', tags: ['modal'] })).toEqual([])
  })

  it('sorts by status: stable, then experimental, then planned', () => {
    const order = filterRegistry(registry, { sort: 'status' }).map((entry) => entry.status)
    const rank = { stable: 0, experimental: 1, planned: 2 }
    expect(order).toEqual([...order].sort((a, b) => rank[a] - rank[b]))
    expect(order.at(-1)).toBe('planned')
  })

  it('sorts by category in taxonomy order, then name', () => {
    const result = filterRegistry(registry, { sort: 'category' })
    expect(result[0]?.category).toBe('actions')
    const actions = result
      .filter((entry) => entry.category === 'actions')
      .map((entry) => entry.name)
    expect(actions).toEqual([...actions].sort((a, b) => a.localeCompare(b, 'en')))
  })
})

describe('matchesSearch', () => {
  it('matches everything for a blank query', () => {
    expect(registry.every((entry) => matchesSearch(entry, '   '))).toBe(true)
  })
})

describe('URL query', () => {
  it('round-trips through search params', () => {
    const query: CatalogQuery = {
      q: 'modal',
      category: 'overlays',
      tags: ['radix', 'keyboard'],
      sort: 'status',
    }
    expect(parseCatalogQuery(toSearchParams(query))).toEqual(query)
    expect(toSearchParams(query).toString()).toBe(
      'q=modal&category=overlays&tag=radix&tag=keyboard&sort=status',
    )
  })

  it('leaves defaults out of the URL', () => {
    expect(toSearchParams(defaultCatalogQuery).toString()).toBe('')
  })

  it('ignores unknown values and repeated tags', () => {
    const params = new URLSearchParams('category=widgets&tag=shiny&tag=radix&tag=radix&sort=random')
    expect(parseCatalogQuery(params)).toEqual({
      q: '',
      category: undefined,
      tags: ['radix'],
      sort: 'name',
    })
  })

  it('knows when a query narrows the results', () => {
    expect(isCatalogQueryActive(defaultCatalogQuery)).toBe(false)
    expect(isCatalogQueryActive({ ...defaultCatalogQuery, sort: 'status' })).toBe(false)
    expect(isCatalogQueryActive({ ...defaultCatalogQuery, tags: ['radix'] })).toBe(true)
  })
})

describe('facetsFor', () => {
  it('offers only categories and tags that some entry uses', () => {
    const blocks = getRegistryEntries('block')
    const facets = facetsFor(blocks)
    for (const category of facets.categories) {
      expect(blocks.some((entry) => entry.category === category)).toBe(true)
    }
    for (const tag of facets.tags) {
      expect(blocks.some((entry) => entry.tags.includes(tag))).toBe(true)
    }
    expect(facets.categories).not.toContain('overlays')
  })
})

describe('suggestEntries', () => {
  it('suggests close slugs for a typo', () => {
    expect(slugs(suggestEntries(registry, 'buton'))[0]).toBe('button')
    expect(slugs(suggestEntries(registry, 'dialgo'))).toContain('dialog')
  })

  it('suggests nothing for an unrelated slug', () => {
    expect(suggestEntries(registry, 'zzzzzzzzzz')).toEqual([])
  })
})

describe('registry data', () => {
  it('distinguishes planned entries from implemented ones', () => {
    const planned = registry.filter((entry) => !isImplemented(entry))
    expect(planned.length).toBeGreaterThan(0)
    for (const entry of planned) {
      expect(entry).not.toHaveProperty('source')
      expect(entry).not.toHaveProperty('examples')
      expect(entry).not.toHaveProperty('installation')
    }
  })
})
