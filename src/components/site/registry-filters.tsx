import { SearchIcon, X } from 'lucide-react'
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import {
  catalogSorts,
  isCatalogQueryActive,
  type CatalogFacets,
  type CatalogQuery,
  type CatalogSort,
} from '@/registry/catalog'
import { isRegistryCategory, registryCategories, type RegistryTag } from '@/registry/taxonomy'

import { nativeFieldClass } from './native-field'

interface RegistryFiltersProps {
  query: CatalogQuery
  facets: CatalogFacets
  /** `typing` is true for keystrokes in the search box, so callers can avoid one history entry per key. */
  onChange: (query: CatalogQuery, options?: { typing?: boolean }) => void
  /** Plural noun for what is being filtered, e.g. "components". */
  noun: string
  resultCount: number
  total: number
  /** Id of the results list the search box filters. */
  resultsId?: string
}

interface ActiveFilter {
  key: string
  /** Visible text of the chip. */
  text: string
  /** Completes "Remove …" for the accessible name. */
  label: string
  remove: (query: CatalogQuery) => CatalogQuery
}

/** One removable chip per active filter: the search text, the category, each tag. */
function activeFilters(query: CatalogQuery): ActiveFilter[] {
  const filters: ActiveFilter[] = []
  const q = query.q.trim()
  if (q) {
    filters.push({
      key: 'q',
      text: `“${q}”`,
      label: `search “${q}”`,
      remove: (current) => ({ ...current, q: '' }),
    })
  }
  if (query.category) {
    const { label } = registryCategories[query.category]
    filters.push({
      key: 'category',
      text: label,
      label: `category ${label}`,
      remove: (current) => ({ ...current, category: undefined }),
    })
  }
  for (const tag of query.tags) {
    filters.push({
      key: `tag-${tag}`,
      text: tag,
      label: `tag ${tag}`,
      remove: (current) => ({ ...current, tags: current.tags.filter((each) => each !== tag) }),
    })
  }
  return filters
}

/** Search, category, tag, and sort controls for a registry index page. */
export function RegistryFilters({
  query,
  facets,
  onChange,
  noun,
  resultCount,
  total,
  resultsId,
}: RegistryFiltersProps) {
  const id = useId()
  const active = isCatalogQueryActive(query)

  function toggleTag(tag: RegistryTag) {
    const tags = query.tags.includes(tag)
      ? query.tags.filter((selected) => selected !== tag)
      : [...query.tags, tag]
    onChange({ ...query, tags })
  }

  return (
    <div className="flex flex-col gap-4">
      <search className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={`${id}-q`} className="text-sm font-medium">
            Search {noun}
          </label>
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id={`${id}-q`}
              type="search"
              value={query.q}
              placeholder="Name, description, or tag"
              autoComplete="off"
              spellCheck={false}
              aria-controls={resultsId}
              onChange={(event) => {
                onChange({ ...query, q: event.target.value }, { typing: true })
              }}
              onKeyDown={(event) => {
                // Not every browser clears a search field on Escape; make it consistent.
                if (event.key === 'Escape' && query.q !== '') {
                  event.preventDefault()
                  onChange({ ...query, q: '' })
                }
              }}
              className={cn(nativeFieldClass, 'w-full pl-9')}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor={`${id}-category`} className="text-sm font-medium">
              Category
            </label>
            <select
              id={`${id}-category`}
              value={query.category ?? ''}
              onChange={(event) => {
                const { value } = event.target
                onChange({ ...query, category: isRegistryCategory(value) ? value : undefined })
              }}
              className={nativeFieldClass}
            >
              <option value="">All categories</option>
              {facets.categories.map((category) => (
                <option key={category} value={category}>
                  {registryCategories[category].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor={`${id}-sort`} className="text-sm font-medium">
              Sort by
            </label>
            <select
              id={`${id}-sort`}
              value={query.sort}
              onChange={(event) => {
                onChange({ ...query, sort: event.target.value as CatalogSort })
              }}
              className={nativeFieldClass}
            >
              {Object.entries(catalogSorts).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </search>

      {facets.tags.length > 0 ? (
        <div
          role="group"
          aria-labelledby={`${id}-tags`}
          className="flex flex-wrap items-center gap-2"
        >
          <span id={`${id}-tags`} className="mr-1 text-sm font-medium">
            Tags
          </span>
          {facets.tags.map((tag) => {
            const pressed = query.tags.includes(tag)
            return (
              <Button
                key={tag}
                size="sm"
                variant={pressed ? 'secondary' : 'outline'}
                aria-pressed={pressed}
                onClick={() => {
                  toggleTag(tag)
                }}
                className="h-7 rounded-full px-2.5 font-mono"
              >
                {tag}
              </Button>
            )
          })}
        </div>
      ) : null}

      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <p role="status" className="mr-auto text-sm text-muted-foreground">
          {active
            ? `${String(resultCount)} of ${String(total)} ${noun}`
            : `${String(total)} ${noun}`}
        </p>
        {active ? (
          <>
            <ul aria-label="Active filters" className="flex flex-wrap gap-2">
              {activeFilters(query).map((filter) => (
                <li key={filter.key}>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Remove ${filter.label}`}
                    onClick={() => {
                      onChange(filter.remove(query))
                    }}
                    className="h-7 rounded-full px-2.5"
                  >
                    {filter.text}
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onChange({ ...query, q: '', category: undefined, tags: [] })
              }}
            >
              Clear filters
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
