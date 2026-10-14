import { useId, type ComponentProps, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export interface NotificationItemProps extends Omit<ComponentProps<'article'>, 'title'> {
  /** Plain text: it also names the mark-as-read button. */
  title: string
  description?: ReactNode
  /** ISO 8601 timestamp, rendered as `<time dateTime>`. */
  timestamp: string
  /** Visible time text, formatted by the caller (keeps time zones and locales out of this file). */
  timeLabel: string
  read: boolean
  /** Shows a "Mark as read" button while unread. */
  onMarkRead?: () => void
  /** Decorative icon; hidden from assistive tech. */
  icon?: ReactNode
}

/**
 * One notification as an `<article>` named by its title. Unread state is a dot
 * plus visually hidden "Unread" text, never color alone. Read state is
 * controlled by the caller. Render a list of them inside a `<ul>`.
 */
export function NotificationItem({
  title,
  description,
  timestamp,
  timeLabel,
  read,
  onMarkRead,
  icon,
  className,
  ...props
}: NotificationItemProps) {
  const titleId = useId()
  return (
    <article
      aria-labelledby={titleId}
      data-read={read || undefined}
      className={cn('flex gap-3 rounded-md px-3 py-3', !read && 'bg-primary-subtle/40', className)}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4"
        >
          {icon}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <p id={titleId} className="min-w-0 flex-1 text-sm font-medium text-pretty">
            {read ? null : <span className="sr-only">Unread:</span>} {title}
          </p>
          {read ? null : (
            <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <time dateTime={timestamp} className="text-xs text-muted-foreground">
            {timeLabel}
          </time>
          {!read && onMarkRead ? (
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0"
              aria-label={`Mark as read: ${title}`}
              onClick={onMarkRead}
            >
              Mark as read
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
