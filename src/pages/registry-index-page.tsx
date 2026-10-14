import { Inbox, SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { PageHeader } from '@/components/site/page'
import { RegistryCard } from '@/components/site/registry-card'
import { RegistryFilters } from '@/components/site/registry-filters'
import { Button } from '@/components/ui/button'
import { getRegistryEntries } from '@/registry'
import {
  facetsFor,
  filterRegistry,
  parseCatalogQuery,
  toSearchParams,
  type CatalogQuery,
} from '@/registry/catalog'
import type { RegistryKind } from '@/registry/types'

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
          />
          {results.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              headingLevel="h2"
              title={`No ${noun} match these filters`}
              description={
                query.q.trim()
                  ? `Nothing matches “${query.q.trim()}” with the selected filters. Try fewer words or tags.`
                  : 'No entry has every selected filter. Try removing a tag or the category.'
              }
              actions={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <ul
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
