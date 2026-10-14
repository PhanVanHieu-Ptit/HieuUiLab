import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

/**
 * The page numbers to show: always the first and last page, `siblings` pages
 * either side of the current one, and an ellipsis for each gap. The number of
 * items stays constant once `pageCount` exceeds `siblings * 2 + 5`, so the
 * control does not change width while paging.
 */
export function getPageItems(page: number, pageCount: number, siblings = 1): PageItem[] {
  if (pageCount < 1) return []
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index)
  const slots = siblings * 2 + 5
  if (pageCount <= slots) return range(1, pageCount)

  const current = Math.min(Math.max(page, 1), pageCount)
  const left = Math.max(current - siblings, 1)
  const right = Math.min(current + siblings, pageCount)
  const showStartGap = left > 2
  const showEndGap = right < pageCount - 1

  if (!showStartGap) return [...range(1, slots - 2), 'ellipsis-end', pageCount]
  if (!showEndGap) return [1, 'ellipsis-start', ...range(pageCount - (slots - 3), pageCount)]
  return [1, 'ellipsis-start', ...range(left, right), 'ellipsis-end', pageCount]
}

export interface PaginationProps extends Omit<ComponentProps<'nav'>, 'onChange'> {
  /** Current page, starting at 1. */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** Pages shown either side of the current page. */
  siblings?: number
}

/**
 * Previous/next and numbered page buttons in a labelled `<nav>`. The current
 * page has `aria-current="page"`. Below `sm` only previous/next and a
 * "Page x of y" summary are shown. Previous/next use `aria-disabled` rather
 * than `disabled`, so focus is not lost when the first or last page is reached.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblings = 1,
  className,
  'aria-label': ariaLabel = 'Pagination',
  ...props
}: PaginationProps) {
  const current = Math.min(Math.max(page, 1), Math.max(pageCount, 1))
  const atStart = current <= 1
  const atEnd = current >= pageCount

  function go(target: number) {
    return () => {
      if (target < 1 || target > pageCount || target === current) return
      onPageChange(target)
    }
  }

  return (
    <nav aria-label={ariaLabel} className={cn('flex items-center gap-1', className)} {...props}>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Previous page"
        aria-disabled={atStart}
        onClick={go(current - 1)}
      >
        <ChevronLeft aria-hidden="true" />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      <span className="px-2 text-sm whitespace-nowrap text-muted-foreground tabular-nums sm:hidden">
        Page {current} of {Math.max(pageCount, 1)}
      </span>
      <ul className="hidden items-center gap-1 sm:flex">
        {getPageItems(current, pageCount, siblings).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Button
                variant={item === current ? 'outline' : 'ghost'}
                size="sm"
                aria-label={`Page ${String(item)}`}
                aria-current={item === current ? 'page' : undefined}
                onClick={go(item)}
                className="min-w-8 px-2 tabular-nums"
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-sm text-muted-foreground">
              …
            </li>
          ),
        )}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Next page"
        aria-disabled={atEnd}
        onClick={go(current + 1)}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}
