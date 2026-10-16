import {
  AtSign,
  Bell,
  CheckCheck,
  ClipboardList,
  Info,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { EmptyState } from '@/components/blocks/empty-state'
import { ErrorState } from '@/components/blocks/error-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NotificationItem } from '@/components/ui/notification-item'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'

const notificationTypes = ['mention', 'assignment', 'system', 'security'] as const
export type NotificationType = (typeof notificationTypes)[number]

export interface NotificationEntry {
  id: string
  type: NotificationType
  /** Plain text: it also names the mark-as-read button. */
  title: string
  description?: string
  /** ISO 8601 timestamp. */
  timestamp: string
  read: boolean
}

/** What the block shows. `ready` with no items is the empty state. */
export type NotificationCenterState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | { status: 'ready'; items: readonly NotificationEntry[] }

export interface NotificationCenterProps {
  state: NotificationCenterState
  /** ISO 8601 "now" for relative times such as "2 hours ago". The block never reads the clock. */
  asOf: string
  /** Called with the notification's id. Update the item in your state; the block is controlled. */
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  /** Shows a retry button in the error state. */
  onRetry?: () => void
  title?: string
  /** Overrides for the type names in the filter, e.g. to translate them. */
  typeLabels?: Partial<Record<NotificationType, string>>
  className?: string
}

type NotificationTab = 'all' | 'unread'
type TypeFilter = 'all' | NotificationType

const typeIcons: Record<NotificationType, LucideIcon> = {
  mention: AtSign,
  assignment: ClipboardList,
  system: Info,
  security: ShieldAlert,
}

const defaultTypeLabels: Record<NotificationType, string> = {
  mention: 'Mentions',
  assignment: 'Assignments',
  system: 'System',
  security: 'Security',
}

const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

/** "5 minutes ago", "Yesterday", or a short date, measured from `asOf` rather than the clock. */
function relativeTime(timestamp: string, asOf: string): string {
  const elapsed = Date.parse(asOf) - Date.parse(timestamp)
  if (Number.isNaN(elapsed) || elapsed < 0) return shortDate.format(new Date(timestamp))
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${String(minutes)} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${String(hours)} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${String(days)} days ago`
  return shortDate.format(new Date(timestamp))
}

function isTypeFilter(value: string): value is TypeFilter {
  return value === 'all' || notificationTypes.some((type) => type === value)
}

function NotificationSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4 p-4">
      <span className="sr-only">Loading notifications…</span>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full max-w-sm" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * A notification inbox: All / Unread tabs, a type filter, mark one or all as read, and its own
 * loading, empty, and error states. It holds no notification data: pass the items in `state` and
 * update them in `onMarkRead` and `onMarkAllRead`. Nothing is fetched.
 */
export function NotificationCenter({
  state,
  asOf,
  onMarkRead,
  onMarkAllRead,
  onRetry,
  title = 'Notifications',
  typeLabels,
  className,
}: NotificationCenterProps) {
  const headingId = useId()
  const hintId = useId()
  const [tab, setTab] = useState<NotificationTab>('all')
  const [type, setType] = useState<TypeFilter>('all')
  const panelRef = useRef<HTMLDivElement>(null)
  // Where focus goes after the item being marked read changes: an item id, or null for the panel.
  const pendingFocus = useRef<string | null | undefined>(undefined)

  const labels = { ...defaultTypeLabels, ...typeLabels }
  const items = state.status === 'ready' ? state.items : []
  const unread = items.filter((item) => !item.read).length
  const visible = items.filter(
    (item) => (tab === 'all' || !item.read) && (type === 'all' || item.type === type),
  )

  const markRead = (id: string) => {
    const index = visible.findIndex((item) => item.id === id)
    const after = visible.slice(index + 1).find((item) => !item.read)
    const before = visible
      .slice(0, Math.max(index, 0))
      .reverse()
      .find((item) => !item.read)
    pendingFocus.current = (after ?? before)?.id ?? null
    onMarkRead(id)
  }

  // The button that was pressed disappears (and in Unread, so does its item), which would drop
  // focus to the page. Move it to the next unread item, or to the panel when none is left.
  useEffect(() => {
    const target = pendingFocus.current
    if (target === undefined) return
    pendingFocus.current = undefined
    const panel = panelRef.current
    const article = Array.from(
      panel?.querySelectorAll<HTMLElement>('[data-notification-id]') ?? [],
    ).find((node) => node.dataset.notificationId === target)
    const button = article?.querySelector('button') ?? null
    ;(button ?? panel)?.focus()
  }, [state])

  const showAll = () => {
    setTab('all')
    setType('all')
  }

  let body: ReactNode
  if (state.status === 'loading') {
    body = <NotificationSkeleton />
  } else if (state.status === 'error') {
    body = (
      <div className="p-4">
        <ErrorState
          headingLevel="h3"
          title="Couldn’t load notifications"
          {...(state.message ? { description: state.message } : {})}
          {...(onRetry ? { onRetry } : {})}
        />
      </div>
    )
  } else {
    let content: ReactNode
    if (items.length === 0) {
      content = (
        <EmptyState
          icon={<Bell />}
          title="No notifications yet"
          description="When something needs your attention, it shows up here."
        />
      )
    } else if (visible.length === 0) {
      const filtered = type !== 'all'
      content = (
        <EmptyState
          icon={<CheckCheck />}
          title={filtered ? 'Nothing matches this filter' : 'You’re all caught up'}
          description={
            filtered
              ? 'No notifications of this type in this view.'
              : 'There are no unread notifications.'
          }
          actions={
            <Button variant="outline" size="sm" onClick={showAll}>
              Show all notifications
            </Button>
          }
        />
      )
    } else {
      content = (
        <ul aria-label={title} className="flex flex-col gap-1">
          {visible.map((item) => {
            const Icon = typeIcons[item.type]
            return (
              <li key={item.id}>
                <NotificationItem
                  data-notification-id={item.id}
                  title={item.title}
                  {...(item.description ? { description: item.description } : {})}
                  timestamp={item.timestamp}
                  timeLabel={relativeTime(item.timestamp, asOf)}
                  read={item.read}
                  icon={<Icon />}
                  onMarkRead={() => {
                    markRead(item.id)
                  }}
                />
              </li>
            )
          })}
        </ul>
      )
    }

    body = (
      <Tabs
        variant="pill"
        value={tab}
        onValueChange={(value) => {
          if (value === 'all' || value === 'unread') setTab(value)
        }}
        className="gap-0"
      >
        <div className="flex flex-col gap-3 border-b px-4 py-3 @lg:flex-row @lg:items-center @lg:justify-between">
          <TabsList aria-label="Filter notifications by read state" className="w-fit">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread{unread > 0 ? ` (${String(unread)})` : ''}
            </TabsTrigger>
          </TabsList>
          <Select
            value={type}
            onValueChange={(value) => {
              if (isTypeFilter(value)) setType(value)
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter by type" className="@lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {notificationTypes.map((value) => (
                <SelectItem key={value} value={value}>
                  {labels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(['all', 'unread'] as const).map((value) => (
          <TabsContent key={value} value={value} className="p-2">
            {content}
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  return (
    <section aria-labelledby={headingId} className={cn('@container w-full min-w-0', className)}>
      <div
        ref={panelRef}
        tabIndex={-1}
        aria-busy={state.status === 'loading'}
        className="overflow-hidden rounded-lg border bg-surface text-surface-foreground focus-ring"
      >
        <header className="flex flex-col gap-3 border-b p-4 @lg:flex-row @lg:items-center @lg:justify-between">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Bell aria-hidden="true" className="size-4 text-muted-foreground" />
              <h2 id={headingId} className="text-base font-semibold tracking-tight">
                {title}
              </h2>
              {unread > 0 ? (
                <Badge variant="primary" size="sm" aria-hidden="true">
                  {unread}
                </Badge>
              ) : null}
            </div>
            <p role="status" className="text-sm text-muted-foreground">
              {state.status === 'ready'
                ? unread === 0
                  ? 'You’re all caught up.'
                  : `${String(unread)} unread`
                : ''}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            aria-disabled={unread === 0}
            aria-describedby={unread === 0 ? hintId : undefined}
            onClick={() => {
              if (unread > 0) onMarkAllRead()
            }}
          >
            <CheckCheck aria-hidden="true" />
            Mark all as read
          </Button>
          <span id={hintId} className="sr-only">
            There are no unread notifications to mark.
          </span>
        </header>
        {body}
      </div>
    </section>
  )
}
