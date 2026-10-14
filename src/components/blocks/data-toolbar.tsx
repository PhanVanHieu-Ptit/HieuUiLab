import { X } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SearchInput } from '@/components/ui/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/cn'

export interface ToolbarFilterOption {
  value: string
  label: string
}

export interface ToolbarFilter {
  id: string
  /** Visible label above the select. */
  label: string
  value: string
  /** The value meaning "not filtered", e.g. `'all'`. Used to decide whether Clear is shown. */
  defaultValue: string
  options: readonly ToolbarFilterOption[]
  onChange: (value: string) => void
}

export interface ToolbarSearch {
  value: string
  onChange: (value: string) => void
  /** Visible label, e.g. "Search orders". */
  label: string
  placeholder?: string
}

export interface DataToolbarProps extends Omit<ComponentProps<'div'>, 'children'> {
  search?: ToolbarSearch
  filters?: readonly ToolbarFilter[]
  /** Number of results after filtering; announced politely when it changes. */
  resultCount?: number
  /** Wording for the count, e.g. `(n) => \`${n} orders\``. */
  formatResultCount?: (count: number) => string
  /** Shows "Clear filters" while the search or any filter differs from its default. */
  onReset?: () => void
  /** Bulk or page actions, aligned to the end. */
  actions?: ReactNode
}

/**
 * Search, filter selects, a live result count, and an actions slot for a
 * collection. Fully controlled: the toolbar renders state and reports changes;
 * the caller filters the data. Controls stack below `sm`.
 */
export function DataToolbar({
  search,
  filters = [],
  resultCount,
  formatResultCount = (count) => `${String(count)} ${count === 1 ? 'result' : 'results'}`,
  onReset,
  actions,
  className,
  ...props
}: DataToolbarProps) {
  const id = useId()
  const active =
    (search !== undefined && search.value.trim() !== '') ||
    filters.some((filter) => filter.value !== filter.defaultValue)

  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {search ? (
          <div className="flex min-w-0 flex-col gap-1.5 sm:max-w-xs sm:flex-1">
            <Label htmlFor={`${id}-search`}>{search.label}</Label>
            <SearchInput
              id={`${id}-search`}
              value={search.value}
              placeholder={search.placeholder}
              onChange={(event) => {
                search.onChange(event.target.value)
              }}
              onClear={() => {
                search.onChange('')
              }}
            />
          </div>
        ) : null}
        {filters.map((filter) => (
          <div key={filter.id} className="flex flex-col gap-1.5 sm:w-40">
            <Label htmlFor={`${id}-${filter.id}`}>{filter.label}</Label>
            <Select value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger id={`${id}-${filter.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {onReset && active ? (
          <Button variant="ghost" onClick={onReset} className="self-start sm:self-auto">
            <X aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
      {resultCount !== undefined || actions ? (
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-sm text-muted-foreground tabular-nums">
            {resultCount !== undefined ? formatResultCount(resultCount) : null}
          </p>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  )
}
