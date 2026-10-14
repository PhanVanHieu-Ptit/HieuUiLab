import { Inbox, SearchX } from 'lucide-react'
import { useId } from 'react'
import { Link, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { PageHeader } from '@/components/site/page'
import { RegistryCard } from '@/components/site/registry-card'
import { RegistryFilters } from '@/components/site/registry-filters'
import { Button } from '@/components/ui/button'
import { catalogHref, getRegistryEntries, registryHref } from '@/registry'
import {
  facetsFor,
  filterRegistry,
  parseCatalogQuery,
  suggestEntries,
  toSearchParams,
  type CatalogQuery,
} from '@/registry/catalog'
import type { RegistryKind } from '@/registry/types'

const otherKind: Record<RegistryKind, RegistryKind> = { component: 'block', block: 'component' }
const plural: Record<RegistryKind, string> = { component: 'components', block: 'blocks' }

const proseLink = 'rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring'

interface RegistryIndexPageProps {
  kind: RegistryKind
  title: string
  description: string
}

/** A kind's catalog. Search, filters, and sort live in the URL so results can be shared. */
export function RegistryIndexPage({ kind, title, description }: RegistryIndexPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const entries = getRegistryEntries(kind)
  const query = parseCatalogQuery(searchParams)
  const results = filterRegistry(entries, query)
  const noun = title.toLowerCase()
  const resultsId = useId()

  function update(next: CatalogQuery, options?: { typing?: boolean }) {
    // Typing replaces the history entry; each discrete filter change can be undone with Back.
    setSearchParams(toSearchParams(next), {
      replace: options?.typing === true,
      preventScrollReset: true,
    })
  }

  function clearFilters() {
    update({ ...query, q: '', category: undefined, tags: [] })
  }

  return (
    <article className="flex flex-col gap-8">
      <PageHeader title={title} description={description} />
      {entries.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          headingLevel="h2"
          title={`No ${noun} yet`}
          description="Entries appear here once they are added to the registry."
        />
      ) : (
        <>
          <RegistryFilters
            query={query}
            facets={facetsFor(entries)}
            onChange={update}
            noun={noun}
            resultCount={results.length}
            total={entries.length}
            resultsId={resultsId}
          />
          {results.length === 0 ? (
            <NoResults kind={kind} noun={noun} query={query} onClear={clearFilters} />
          ) : (
            <ul
              id={resultsId}
              aria-label={`${title} results`}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {results.map((entry) => (
                <li key={entry.id} className="flex">
                  <RegistryCard entry={entry} headingLevel="h2" showTaxonomy />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  )
}

interface NoResultsProps {
  kind: RegistryKind
  noun: string
  query: CatalogQuery
  onClear: () => void
}

/**
 * What to try when nothing matches: close names for a likely typo, the other
 * catalog when it has matches for the same words, and clearing the filters.
 */
function NoResults({ kind, noun, query, onClear }: NoResultsProps) {
  const q = query.q.trim()
  const suggestions = q ? suggestEntries(getRegistryEntries(kind), q) : []
  const other = otherKind[kind]
  const elsewhere = q ? filterRegistry(getRegistryEntries(other), { q }).length : 0

  return (
    <div className="flex flex-col gap-4">
      <EmptyState
        icon={<SearchX />}
        headingLevel="h2"
        title={`No ${noun} match these filters`}
        description={
          q
            ? `Nothing matches “${q}” with the selected filters. Try fewer words, or remove a filter above.`
            : 'No entry has every selected filter. Remove a tag or the category above.'
        }
        actions={
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        }
      />
      {suggestions.length > 0 || elsewhere > 0 ? (
        <nav aria-label="Search suggestions" className="flex flex-col gap-1 text-center text-sm">
          {suggestions.length > 0 ? (
            <p className="text-muted-foreground">
              Did you mean{' '}
              {suggestions.map((suggestion, index) => (
                <span key={suggestion.slug}>
                  {index > 0 ? (index === suggestions.length - 1 ? ' or ' : ', ') : null}
                  <Link to={registryHref(suggestion)} className={proseLink}>
                    {suggestion.name}
                  </Link>
                </span>
              ))}
              ?
            </p>
          ) : null}
          {elsewhere > 0 ? (
            <p className="text-muted-foreground">
              <Link to={catalogHref(other, { q })} className={proseLink}>
                {elsewhere === 1
                  ? `1 ${other} matches “${q}”`
                  : `${String(elsewhere)} ${plural[other]} match “${q}”`}
              </Link>
            </p>
          ) : null}
        </nav>
      ) : null}
    </div>
  )
}
