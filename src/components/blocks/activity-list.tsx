import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface ActivityEntry {
  id: string
  /** Who did it, e.g. "Mai Tran" or "You". */
  actor: string
  /** What happened, as a verb phrase: "marked as shipped". */
  action: string
  /** What it happened to, e.g. "order #1042". */
  target?: string
  /** ISO 8601 timestamp. */
  timestamp: string
  /** Decorative icon; hidden from assistive tech. */
  icon?: ReactNode
}

export interface ActivityListProps extends Omit<ComponentProps<'ol'>, 'children'> {
  /** Accessible name of the list, e.g. "Recent activity". */
  label: string
  /** Newest first. The list renders them in the order given. */
  items: readonly ActivityEntry[]
  /** Formats each timestamp for display. Defaults to the reader's locale and time zone. */
  formatTimestamp?: (iso: string) => string
  /** Shown instead of the list when there are no items. */
  emptyMessage?: ReactNode
}

const defaultFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDefault(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : defaultFormat.format(date)
}

/**
 * A chronological feed as an ordered list. Each entry reads as one sentence,
 * "Actor action target", followed by a `<time dateTime>`. The list does not
 * compute relative times ("5 minutes ago"), so it never reads the clock.
 */
export function ActivityList({
  label,
  items,
  formatTimestamp = formatDefault,
  emptyMessage = 'No activity yet.',
  className,
  ...props
}: ActivityListProps) {
  if (items.length === 0) {
    return <p className={cn('text-sm text-muted-foreground', className)}>{emptyMessage}</p>
  }

  return (
    <ol aria-label={label} className={cn('flex flex-col', className)} {...props}>
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
          {index < items.length - 1 ? (
            <span aria-hidden="true" className="absolute top-7 bottom-0 left-3.5 w-px bg-border" />
          ) : null}
          <div
            aria-hidden="true"
            className="relative flex size-7 shrink-0 items-center justify-center rounded-full border bg-surface text-muted-foreground [&_svg]:size-3.5"
          >
            {item.icon ?? <span className="size-1.5 rounded-full bg-muted-foreground" />}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 pt-1">
            <p className="text-sm text-pretty">
              <span className="font-medium">{item.actor}</span> {item.action}
              {item.target ? <span className="font-medium"> {item.target}</span> : null}
            </p>
            <time dateTime={item.timestamp} className="text-xs text-muted-foreground">
              {formatTimestamp(item.timestamp)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  )
}
