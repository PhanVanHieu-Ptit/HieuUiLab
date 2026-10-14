import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export type SortDirection = 'asc' | 'desc'

/** A native `<table>`; wrap it in a scroll container when it can be wider than its parent. */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return <table className={cn('w-full border-collapse text-sm', className)} {...props} />
}

/** The table's accessible name. Keep it even when hidden: `className="sr-only"`. */
export function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <caption
      className={cn('px-3 py-2 text-left text-sm font-medium text-foreground', className)}
      {...props}
    />
  )
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('border-b bg-muted/40', className)} {...props} />
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('[&>tr:last-child]:border-b-0', className)} {...props} />
}

/** A row. Set `data-state="selected"` or `data-active` to highlight it. */
export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/40 data-[active]:bg-accent/60 data-[state=selected]:bg-primary-subtle/60',
        className,
      )}
      {...props}
    />
  )
}

/** A header cell. `scope` defaults to `col`; use `scope="row"` for row headers in the body. */
export function TableHead({ className, scope = 'col', ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope={scope}
      className={cn(
        'h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('px-3 py-2.5 align-middle', className)} {...props} />
}

const ariaSort = { asc: 'ascending', desc: 'descending' } as const

export interface TableSortHeaderProps extends Omit<ComponentProps<'th'>, 'onClick' | 'align'> {
  /** Current direction for this column, or `null` when the table is sorted by another column. */
  sortDirection: SortDirection | null
  /** Called when the header button is activated (click, Enter, or Space). */
  onSort: () => void
  align?: 'start' | 'end'
}

/**
 * A column header that sorts. The `<th>` carries `aria-sort` only while its
 * column is the active sort, and its content is a native `<button>`, so it is
 * reachable with Tab and activated with Enter or Space.
 */
export function TableSortHeader({
  sortDirection,
  onSort,
  align = 'start',
  className,
  children,
  ...props
}: TableSortHeaderProps) {
  const Icon =
    sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ChevronsUpDown
  return (
    <TableHead
      aria-sort={sortDirection ? ariaSort[sortDirection] : undefined}
      className={cn('px-1.5', align === 'end' && 'text-right', className)}
      {...props}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-1.5 font-medium focus-ring transition-colors hover:bg-accent hover:text-accent-foreground',
          sortDirection && 'text-foreground',
          align === 'end' && 'flex-row-reverse',
        )}
      >
        {children}
        <Icon
          aria-hidden="true"
          className={cn('size-3.5 shrink-0', !sortDirection && 'text-muted-foreground/70')}
        />
      </button>
    </TableHead>
  )
}
