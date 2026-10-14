import { Inbox } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'

import { EmptyState } from '@/components/blocks/empty-state'
import { ErrorState } from '@/components/blocks/error-state'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination } from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortHeader,
  type SortDirection,
} from '@/components/ui/table'
import { cn } from '@/lib/cn'

/** The same shape as Resource list's state: `ready` with no items is the empty state. */
export type DataTableState<T> =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | { status: 'ready'; items: readonly T[] }

export type SortValue = string | number | Date | null | undefined

export interface DataTableSort {
  columnId: string
  direction: SortDirection
}

export interface DataTableColumn<T> {
  /** Stable id; used for the sort state. */
  id: string
  /** Column name shown in the header and used as its accessible name. */
  header: string
  cell: (row: T) => ReactNode
  /** Makes the column sortable. Return a primitive; strings compare with numeric collation. */
  sortValue?: (row: T) => SortValue
  align?: 'start' | 'end'
  /** Render this column's cells as `<th scope="row">`. Use for the column that names the row. */
  rowHeader?: boolean
  /** Hide the column below a breakpoint. Keep the hidden data reachable elsewhere, e.g. a detail view. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
  /** Classes for the header and body cells, e.g. a min width. */
  className?: string
}

export interface DataTableSelection<T> {
  selectedIds: ReadonlySet<string>
  onSelectedIdsChange: (ids: Set<string>) => void
  /** Accessible name of a row's checkbox, e.g. `(order) => \`Select order ${order.number}\``. */
  rowLabel: (row: T) => string
}

export interface DataTableProps<T> {
  /** The table's caption, and the name of its scroll region. */
  label: string
  /** Show the caption visually; it is always available to assistive tech. */
  showCaption?: boolean
  /** Plural noun for the rows, used in status messages, e.g. "orders". */
  itemName?: string
  /** Define outside render, or memoize, so sorting is not redone on every render. */
  columns: readonly DataTableColumn<T>[]
  state: DataTableState<T>
  getRowId: (row: T) => string
  /** Controlled sort. Pass `null` for the original order. */
  sort?: DataTableSort | null
  defaultSort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort | null) => void
  /** Controlled page, starting at 1. Out-of-range values are clamped. */
  page?: number
  onPageChange?: (page: number) => void
  /** Controlled rows per page (1–100). */
  pageSize?: number
  defaultPageSize?: number
  /** Renders a rows-per-page select with these options. */
  pageSizeOptions?: readonly number[]
  onPageSizeChange?: (pageSize: number) => void
  /** Adds a checkbox column. Selection is controlled and survives paging. */
  selection?: DataTableSelection<T>
  /** Highlights one row, e.g. the one shown in a detail panel. */
  activeRowId?: string | null
  /** Overrides for the empty state, e.g. "No orders match these filters". */
  empty?: { title?: ReactNode; description?: ReactNode; action?: ReactNode }
  /** Renders a retry button in the error state. */
  onRetry?: () => void
  /** Placeholder rows while loading. */
  skeletonRows?: number
  className?: string
}

const maxPageSize = 100

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function normalize(value: SortValue): string | number | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : time
  }
  if (typeof value === 'number') return Number.isNaN(value) ? null : value
  return value
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return collator.compare(String(a), String(b))
}

/**
 * Returns a new array sorted by `getValue`. Each value is read once. Empty
 * values (null, undefined, NaN, invalid dates) sort last in both directions,
 * and rows with equal values keep their original order.
 */
export function sortRows<T>(
  rows: readonly T[],
  getValue: (row: T) => SortValue,
  direction: SortDirection,
): T[] {
  const factor = direction === 'asc' ? 1 : -1
  const decorated = rows.map((row, index) => ({ row, index, value: normalize(getValue(row)) }))
  decorated.sort((a, b) => {
    if (a.value === null || b.value === null) {
      if (a.value === b.value) return a.index - b.index
      return a.value === null ? 1 : -1
    }
    return compare(a.value, b.value) * factor || a.index - b.index
  })
  return decorated.map((entry) => entry.row)
}

export interface PageSlice<T> {
  rows: T[]
  /** The page actually shown, after clamping. */
  page: number
  pageCount: number
  /** 1-based position of the first and last row shown; 0 when there are no rows. */
  start: number
  end: number
  total: number
}

/** One page of rows. The page is clamped to the valid range, so a shrinking list never shows a blank page. */
export function paginateRows<T>(rows: readonly T[], page: number, pageSize: number): PageSlice<T> {
  const size = Math.min(Math.max(Math.floor(pageSize) || 1, 1), maxPageSize)
  const pageCount = Math.max(Math.ceil(rows.length / size), 1)
  const current = Math.min(Math.max(Math.floor(page) || 1, 1), pageCount)
  const offset = (current - 1) * size
  const slice = rows.slice(offset, offset + size)
  return {
    rows: slice,
    page: current,
    pageCount,
    start: slice.length === 0 ? 0 : offset + 1,
    end: offset + slice.length,
    total: rows.length,
  }
}

function nextSort(current: DataTableSort | null, columnId: string): DataTableSort | null {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' }
  return current.direction === 'asc' ? { columnId, direction: 'desc' } : null
}

const hideBelowClass = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

/** True while the element is wider inside than out, i.e. it scrolls horizontally. */
function useHorizontalOverflow<E extends HTMLElement>() {
  const ref = useRef<E>(null)
  const [overflowing, setOverflowing] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      setOverflowing(node.scrollWidth > node.clientWidth + 1)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    return () => {
      observer.disconnect()
    }
  }, [])
  return [ref, overflowing] as const
}

const noRows: readonly never[] = []

/**
 * A semantic table for typed rows with loading, error, and empty states,
 * sortable columns (`aria-sort`), client-side pagination, and optional row
 * selection. Every control is a native button or checkbox in the Tab order;
 * when the table is wider than its container, the scroll region itself becomes
 * focusable so it can be scrolled with the arrow keys.
 */
export function DataTable<T>({
  label,
  showCaption = false,
  itemName = 'rows',
  columns,
  state,
  getRowId,
  sort,
  defaultSort = null,
  onSortChange,
  page,
  onPageChange,
  pageSize,
  defaultPageSize = 25,
  pageSizeOptions,
  onPageSizeChange,
  selection,
  activeRowId = null,
  empty,
  onRetry,
  skeletonRows = 5,
  className,
}: DataTableProps<T>) {
  const captionId = useId()
  const pageSizeLabelId = useId()
  const [scrollRef, overflowing] = useHorizontalOverflow<HTMLDivElement>()

  const [innerSort, setInnerSort] = useState<DataTableSort | null>(defaultSort)
  const [innerPage, setInnerPage] = useState(1)
  const [innerPageSize, setInnerPageSize] = useState(defaultPageSize)
  const activeSort = sort === undefined ? innerSort : sort
  const activePageSize = pageSize ?? innerPageSize

  const items = state.status === 'ready' ? state.items : noRows
  const sortColumn = activeSort
    ? columns.find((column) => column.id === activeSort.columnId && column.sortValue)
    : undefined
  const sortValue = sortColumn?.sortValue
  const direction = activeSort?.direction ?? 'asc'

  const sorted = useMemo(
    () => (sortValue ? sortRows(items, sortValue, direction) : items),
    [items, sortValue, direction],
  )
  const slice = useMemo(
    () => paginateRows(sorted, page ?? innerPage, activePageSize),
    [sorted, page, innerPage, activePageSize],
  )

  function changePage(next: number) {
    if (page === undefined) setInnerPage(next)
    onPageChange?.(next)
  }

  function toggleSort(columnId: string) {
    const next = nextSort(sortColumn ? activeSort : null, columnId)
    if (sort === undefined) setInnerSort(next)
    onSortChange?.(next)
    changePage(1)
  }

  function changePageSize(next: number) {
    if (pageSize === undefined) setInnerPageSize(next)
    onPageSizeChange?.(next)
    changePage(1)
  }

  const pageIds = slice.rows.map(getRowId)
  const selectedOnPage = selection
    ? pageIds.filter((id) => selection.selectedIds.has(id)).length
    : 0
  const allOnPage: boolean | 'indeterminate' =
    selectedOnPage === 0 ? false : selectedOnPage === pageIds.length ? true : 'indeterminate'

  function togglePage() {
    if (!selection) return
    const next = new Set(selection.selectedIds)
    for (const id of pageIds) {
      if (allOnPage === true) next.delete(id)
      else next.add(id)
    }
    selection.onSelectedIdsChange(next)
  }

  function toggleRow(id: string, checked: boolean) {
    if (!selection) return
    const next = new Set(selection.selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    selection.onSelectedIdsChange(next)
  }

  const columnCount = columns.length + (selection ? 1 : 0)
  const ready = state.status === 'ready' && slice.total > 0

  function fullWidthRow(content: ReactNode) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={columnCount} className="p-4">
          {content}
        </TableCell>
      </TableRow>
    )
  }

  let body: ReactNode
  if (state.status === 'loading') {
    body = Array.from({ length: skeletonRows }, (_, row) => (
      <TableRow key={row} className="hover:bg-transparent">
        {Array.from({ length: columnCount }, (_, cell) => (
          <TableCell key={cell}>
            <Skeleton className="h-4 w-full max-w-32" />
          </TableCell>
        ))}
      </TableRow>
    ))
  } else if (state.status === 'error') {
    body = fullWidthRow(
      <ErrorState
        className="border-0"
        title={`Couldn’t load ${itemName}`}
        description={state.message ?? 'Check your connection, then try again.'}
        {...(onRetry ? { onRetry } : {})}
      />,
    )
  } else if (slice.total === 0) {
    body = fullWidthRow(
      <EmptyState
        className="border-0"
        icon={<Inbox />}
        title={empty?.title ?? `No ${itemName} yet`}
        description={empty?.description}
        actions={empty?.action}
      />,
    )
  } else {
    body = slice.rows.map((row, index) => {
      const id = pageIds[index] ?? getRowId(row)
      const selected = selection?.selectedIds.has(id) ?? false
      return (
        <TableRow
          key={id}
          data-state={selected ? 'selected' : undefined}
          data-active={id === activeRowId || undefined}
        >
          {selection ? (
            <TableCell className="w-10 pr-0">
              <Checkbox
                aria-label={selection.rowLabel(row)}
                checked={selected}
                onCheckedChange={(checked) => {
                  toggleRow(id, checked === true)
                }}
              />
            </TableCell>
          ) : null}
          {columns.map((column) => {
            const classes = cn(
              column.align === 'end' && 'text-right tabular-nums',
              column.hideBelow && hideBelowClass[column.hideBelow],
              column.className,
            )
            return column.rowHeader ? (
              <TableHead
                key={column.id}
                scope="row"
                className={cn('h-auto py-2.5 text-sm font-medium text-foreground', classes)}
              >
                {column.cell(row)}
              </TableHead>
            ) : (
              <TableCell key={column.id} className={classes}>
                {column.cell(row)}
              </TableCell>
            )
          })}
        </TableRow>
      )
    })
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-3', className)}>
      {state.status === 'loading' ? (
        <p role="status" className="sr-only">
          Loading {itemName}…
        </p>
      ) : null}
      {/* A region that scrolls must be focusable to be scrolled by keyboard (WCAG 2.1.1). */}
      <div
        ref={scrollRef}
        role="region"
        aria-labelledby={captionId}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- only while it overflows
        tabIndex={overflowing ? 0 : undefined}
        className="w-full overflow-x-auto rounded-lg border bg-surface text-surface-foreground focus-ring"
      >
        <Table aria-busy={state.status === 'loading' || undefined}>
          <TableCaption id={captionId} className={showCaption ? 'border-b' : 'sr-only'}>
            {label}
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selection ? (
                <TableHead className="w-10 pr-0">
                  <Checkbox
                    aria-label="Select all rows on this page"
                    checked={allOnPage}
                    disabled={!ready}
                    onCheckedChange={togglePage}
                  />
                </TableHead>
              ) : null}
              {columns.map((column) => {
                const classes = cn(
                  column.hideBelow && hideBelowClass[column.hideBelow],
                  column.className,
                )
                return column.sortValue ? (
                  <TableSortHeader
                    key={column.id}
                    align={column.align ?? 'start'}
                    sortDirection={sortColumn?.id === column.id ? direction : null}
                    onSort={() => {
                      toggleSort(column.id)
                    }}
                    className={classes}
                  >
                    {column.header}
                  </TableSortHeader>
                ) : (
                  <TableHead
                    key={column.id}
                    className={cn(column.align === 'end' && 'text-right', classes)}
                  >
                    {column.header}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </div>
      {ready ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground tabular-nums">
            {slice.start}–{slice.end} of {slice.total} {itemName}
            {selection && selection.selectedIds.size > 0
              ? ` · ${String(selection.selectedIds.size)} selected`
              : null}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {pageSizeOptions && pageSizeOptions.length > 0 ? (
              <div className="flex items-center gap-2">
                <span
                  id={pageSizeLabelId}
                  className="text-sm whitespace-nowrap text-muted-foreground"
                >
                  Rows per page
                </span>
                <Select
                  value={String(activePageSize)}
                  onValueChange={(value) => {
                    changePageSize(Number(value))
                  }}
                >
                  <SelectTrigger size="sm" aria-labelledby={pageSizeLabelId} className="w-18">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {slice.pageCount > 1 ? (
              <Pagination
                aria-label={`${label} pages`}
                page={slice.page}
                pageCount={slice.pageCount}
                onPageChange={changePage}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
