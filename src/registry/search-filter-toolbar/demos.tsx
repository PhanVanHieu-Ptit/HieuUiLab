import { useState } from 'react'

import { EmptyState } from '@/components/blocks/empty-state'
import {
  SearchFilterToolbar,
  type FilterToolbarValue,
} from '@/components/blocks/search-filter-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { filterItems, initialFilterValue, libraryItems } from './mock-data'

export function SearchFilterToolbarDemo() {
  const [value, setValue] = useState<FilterToolbarValue>(initialFilterValue)
  const results = filterItems(libraryItems, value)

  return (
    <div className="grid w-full gap-4">
      <SearchFilterToolbar
        value={value}
        onValueChange={setValue}
        searchPlaceholder="Name"
        filters={[
          {
            id: 'category',
            label: 'Category',
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All categories' },
              { value: 'forms', label: 'Forms' },
              { value: 'data', label: 'Data' },
              { value: 'feedback', label: 'Feedback' },
              { value: 'navigation', label: 'Navigation' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All statuses' },
              { value: 'stable', label: 'Stable' },
              { value: 'beta', label: 'Beta' },
              { value: 'deprecated', label: 'Deprecated' },
            ],
          },
        ]}
        sortOptions={[
          { value: 'name-asc', label: 'Name, A to Z' },
          { value: 'name-desc', label: 'Name, Z to A' },
          { value: 'updated', label: 'Recently updated' },
        ]}
        resultCount={results.length}
        formatResultCount={(count) => `${String(count)} of ${String(libraryItems.length)} items`}
      />
      {results.length === 0 ? (
        <EmptyState
          title="No items match"
          description="Try a different search, or remove a filter."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue(initialFilterValue)
              }}
            >
              Clear everything
            </Button>
          }
        />
      ) : (
        <ul aria-label="Items" className="divide-y rounded-lg border">
          {results.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0 truncate text-sm font-medium">{item.name}</span>
              <Badge variant={item.status === 'deprecated' ? 'warning' : 'neutral'}>
                {item.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SearchFilterToolbarViewsDemo() {
  const [value, setValue] = useState<FilterToolbarValue>({
    query: 'e',
    filters: { status: 'beta' },
    sort: 'updated',
  })
  const results = filterItems(libraryItems, value)

  return (
    <div className="grid w-full gap-4">
      <SearchFilterToolbar
        label="Search items"
        value={value}
        onValueChange={setValue}
        views={[
          { id: 'all', label: 'All items', value: initialFilterValue },
          {
            id: 'beta',
            label: 'Beta',
            value: { query: '', filters: { status: 'beta' }, sort: 'updated' },
          },
          {
            id: 'attention',
            label: 'Needs attention',
            value: { query: '', filters: { status: 'deprecated' }, sort: 'name-asc' },
          },
        ]}
        filters={[
          {
            id: 'status',
            label: 'Status',
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All statuses' },
              { value: 'stable', label: 'Stable' },
              { value: 'beta', label: 'Beta' },
              { value: 'deprecated', label: 'Deprecated' },
            ],
          },
        ]}
        sortOptions={[
          { value: 'name-asc', label: 'Name, A to Z' },
          { value: 'updated', label: 'Recently updated' },
        ]}
        resultCount={results.length}
        actions={
          <Button variant="outline" size="sm">
            Export (example)
          </Button>
        }
      />
      <ul aria-label="Items" className="divide-y rounded-lg border">
        {results.map((item) => (
          <li key={item.id} className="px-4 py-2.5 text-sm">
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
