import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

import { DataToolbar, type ToolbarFilterOption } from '@/components/blocks/data-toolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

/** Everything the toolbar edits, in one value so a saved view can be a plain object. */
export interface FilterToolbarValue {
  query: string
  /** Chosen option per filter id. A filter that is missing here, or equals its default, is off. */
  filters: Readonly<Record<string, string>>
  sort: string
}

export interface FilterToolbarFilter {
  id: string
  /** Visible label above the select. */
  label: string
  options: readonly ToolbarFilterOption[]
  /** The option meaning “not filtered”, e.g. `'all'`. */
  defaultValue: string
}

/** A saved set of criteria that one press applies. */
export interface FilterToolbarView {
  id: string
  label: string
  value: FilterToolbarValue
}

export interface SearchFilterToolbarProps {
  value: FilterToolbarValue
  /** Called with the complete next value; keep it in your state or the URL and filter with it. */
  onValueChange: (value: FilterToolbarValue) => void
  filters?: readonly FilterToolbarFilter[]
  /** Adds a “Sort by” select. The first option is the default sort. */
  sortOptions?: readonly ToolbarFilterOption[]
  /** Saved views shown as toggle buttons above the toolbar. */
  views?: readonly FilterToolbarView[]
  /** Name of the search landmark. */
  label?: string
  /** Visible label of the search field. */
  searchLabel?: string
  searchPlaceholder?: string
  /** Number of results after filtering; announced politely when it changes. */
  resultCount?: number
  formatResultCount?: (count: number) => string
  /** Page actions, aligned to the end of the count row. */
  actions?: ReactNode
  className?: string
}

interface Chip {
  key: string
  text: string
  /** Names the remove button, so a screen reader hears which filter goes away. */
  removeLabel: string
  value: FilterToolbarValue
}

/** The option a filter is set to, falling back to its default. */
function chosen(value: FilterToolbarValue, filter: FilterToolbarFilter): string {
  return value.filters[filter.id] ?? filter.defaultValue
}

/** Whether two values select the same results, ignoring explicit defaults and stray spaces. */
function sameValue(
  a: FilterToolbarValue,
  b: FilterToolbarValue,
  filters: readonly FilterToolbarFilter[],
): boolean {
  return (
    a.query.trim() === b.query.trim() &&
    a.sort === b.sort &&
    filters.every((filter) => chosen(a, filter) === chosen(b, filter))
  )
}

/**
 * A search field and filter selects (the DataToolbar) with the parts a list page usually adds:
 * saved views, a sort control, and a removable chip for every active criterion. It holds no data
 * and no state: it renders one `value` and reports each change as a new complete value.
 */
export function SearchFilterToolbar({
  value,
  onValueChange,
  filters = [],
  sortOptions = [],
  views = [],
  label = 'Search and filter',
  searchLabel = 'Search',
  searchPlaceholder,
  resultCount,
  formatResultCount,
  actions,
  className,
}: SearchFilterToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  // Where focus goes after a chip is removed: a chip key, or null for the toolbar itself.
  const pendingFocus = useRef<string | null | undefined>(undefined)
  const defaultSort = sortOptions[0]?.value ?? value.sort

  const chips: Chip[] = []
  if (value.query.trim() !== '') {
    chips.push({
      key: 'query',
      text: `Search: “${value.query.trim()}”`,
      removeLabel: `Remove filter Search: ${value.query.trim()}`,
      value: { ...value, query: '' },
    })
  }
  for (const filter of filters) {
    const current = chosen(value, filter)
    if (current === filter.defaultValue) continue
    const optionLabel = filter.options.find((option) => option.value === current)?.label ?? current
    chips.push({
      key: `filter:${filter.id}`,
      text: `${filter.label}: ${optionLabel}`,
      removeLabel: `Remove filter ${filter.label}: ${optionLabel}`,
      value: { ...value, filters: { ...value.filters, [filter.id]: filter.defaultValue } },
    })
  }

  const reset = () => {
    onValueChange({ query: '', filters: {}, sort: defaultSort })
  }

  const removeChip = (index: number) => {
    const chip = chips[index]
    if (!chip) return
    pendingFocus.current = (chips[index + 1] ?? chips[index - 1])?.key ?? null
    onValueChange(chip.value)
  }

  // A removed chip takes its button with it, which would drop focus to the page.
  useEffect(() => {
    const target = pendingFocus.current
    if (target === undefined) return
    pendingFocus.current = undefined
    const root = rootRef.current
    const chip = Array.from(root?.querySelectorAll<HTMLElement>('[data-chip-key]') ?? []).find(
      (node) => node.dataset.chipKey === target,
    )
    ;(chip?.querySelector('button') ?? root)?.focus()
  }, [value])

  return (
    <div
      ref={rootRef}
      role="search"
      aria-label={label}
      tabIndex={-1}
      className={cn(
        '@container flex w-full min-w-0 flex-col gap-3 rounded-md focus-ring',
        className,
      )}
    >
      {views.length > 0 ? (
        <div role="group" aria-label="Saved views" className="flex flex-wrap items-center gap-2">
          {views.map((view) => {
            const active = sameValue(value, view.value, filters)
            return (
              <Button
                key={view.id}
                size="sm"
                variant={active ? 'secondary' : 'outline'}
                aria-pressed={active}
                onClick={() => {
                  onValueChange(view.value)
                }}
              >
                {view.label}
              </Button>
            )
          })}
        </div>
      ) : null}
      <DataToolbar
        search={{
          label: searchLabel,
          value: value.query,
          onChange: (query) => {
            onValueChange({ ...value, query })
          },
          ...(searchPlaceholder ? { placeholder: searchPlaceholder } : {}),
        }}
        filters={[
          ...filters.map((filter) => ({
            id: filter.id,
            label: filter.label,
            value: chosen(value, filter),
            defaultValue: filter.defaultValue,
            options: filter.options,
            onChange: (next: string) => {
              onValueChange({ ...value, filters: { ...value.filters, [filter.id]: next } })
            },
          })),
          ...(sortOptions.length > 0
            ? [
                {
                  id: 'sort',
                  label: 'Sort by',
                  value: value.sort,
                  defaultValue: defaultSort,
                  options: sortOptions,
                  onChange: (sort: string) => {
                    onValueChange({ ...value, sort })
                  },
                },
              ]
            : []),
        ]}
        onReset={reset}
        {...(resultCount === undefined ? {} : { resultCount })}
        {...(formatResultCount ? { formatResultCount } : {})}
        {...(actions ? { actions } : {})}
      />
      {chips.length > 0 ? (
        <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2">
          {chips.map((chip, index) => (
            <li key={chip.key} data-chip-key={chip.key} className="max-w-full">
              <Badge variant="outline" className="max-w-full gap-1 pr-1">
                <span className="min-w-0 truncate">{chip.text}</span>
                <button
                  type="button"
                  aria-label={chip.removeLabel}
                  onClick={() => {
                    removeChip(index)
                  }}
                  className="inline-flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground focus-ring transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3"
                >
                  <X aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
