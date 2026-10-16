import type { FilterToolbarValue } from '@/components/blocks/search-filter-toolbar'

/**
 * Example data for the Search and filter toolbar demos. These twelve items are invented and held
 * in memory; nothing is fetched. The filter below is the demo's own, to make the toolbar's
 * results visible: the toolbar itself never filters anything.
 */
export interface LibraryItem {
  id: string
  name: string
  category: 'forms' | 'data' | 'feedback' | 'navigation'
  status: 'stable' | 'beta' | 'deprecated'
  /** ISO 8601 date. */
  updated: string
}

export const libraryItems: readonly LibraryItem[] = [
  {
    id: 'lib-1',
    name: 'Date range picker',
    category: 'forms',
    status: 'beta',
    updated: '2026-10-08',
  },
  { id: 'lib-2', name: 'Data grid', category: 'data', status: 'stable', updated: '2026-10-02' },
  {
    id: 'lib-3',
    name: 'Toast stack',
    category: 'feedback',
    status: 'stable',
    updated: '2026-09-21',
  },
  {
    id: 'lib-4',
    name: 'Breadcrumb trail',
    category: 'navigation',
    status: 'stable',
    updated: '2026-08-30',
  },
  { id: 'lib-5', name: 'Tag input', category: 'forms', status: 'beta', updated: '2026-10-10' },
  {
    id: 'lib-6',
    name: 'Legacy accordion',
    category: 'navigation',
    status: 'deprecated',
    updated: '2026-03-14',
  },
  { id: 'lib-7', name: 'Pivot table', category: 'data', status: 'beta', updated: '2026-09-29' },
  { id: 'lib-8', name: 'Banner', category: 'feedback', status: 'stable', updated: '2026-07-18' },
  { id: 'lib-9', name: 'Mega menu', category: 'navigation', status: 'beta', updated: '2026-10-05' },
  {
    id: 'lib-10',
    name: 'Inline editor',
    category: 'forms',
    status: 'deprecated',
    updated: '2026-02-02',
  },
  {
    id: 'lib-11',
    name: 'Sparkline cell',
    category: 'data',
    status: 'stable',
    updated: '2026-10-11',
  },
  {
    id: 'lib-12',
    name: 'Progress toast',
    category: 'feedback',
    status: 'deprecated',
    updated: '2026-04-09',
  },
]

export const initialFilterValue: FilterToolbarValue = { query: '', filters: {}, sort: 'name-asc' }

/** The demo's own filter and sort; a real app would do this on the server or in a query. */
export function filterItems(
  items: readonly LibraryItem[],
  value: FilterToolbarValue,
): LibraryItem[] {
  const query = value.query.trim().toLowerCase()
  const category = value.filters.category ?? 'all'
  const status = value.filters.status ?? 'all'
  const matches = items.filter(
    (item) =>
      (query === '' || item.name.toLowerCase().includes(query)) &&
      (category === 'all' || item.category === category) &&
      (status === 'all' || item.status === status),
  )
  return matches.sort((a, b) => {
    if (value.sort === 'updated') return b.updated.localeCompare(a.updated)
    const byName = a.name.localeCompare(b.name)
    return value.sort === 'name-desc' ? -byName : byName
  })
}
