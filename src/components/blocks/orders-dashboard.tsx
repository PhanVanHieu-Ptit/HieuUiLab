import { Ban, Bell, PackageCheck, Truck } from 'lucide-react'
import { useId, useMemo, useReducer, useState } from 'react'

import { ActivityList, type ActivityEntry } from '@/components/blocks/activity-list'
import { ConfirmAction } from '@/components/blocks/confirm-action'
import { DataTable, type DataTableColumn } from '@/components/blocks/data-table'
import { DataToolbar } from '@/components/blocks/data-toolbar'
import { DetailPanel } from '@/components/blocks/detail-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard, type MetricChange } from '@/components/ui/metric-card'
import { NotificationItem } from '@/components/ui/notification-item'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { cn } from '@/lib/cn'

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof orderStatuses)[number]

const orderChannels = ['web', 'mobile', 'marketplace'] as const
export type OrderChannel = (typeof orderChannels)[number]

export interface Order {
  id: string
  /** Display number, e.g. "#1042". */
  number: string
  customer: { name: string; email: string }
  city: string
  status: OrderStatus
  channel: OrderChannel
  itemCount: number
  /** Integer cents, so totals never accumulate floating-point error. */
  totalCents: number
  /** ISO 8601 timestamp. */
  placedAt: string
}

export interface DashboardNotification {
  id: string
  title: string
  description: string
  /** ISO 8601 timestamp. */
  timestamp: string
  read: boolean
}

export interface OrderFilters {
  query: string
  status: OrderStatus | 'all'
  channel: OrderChannel | 'all'
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const statusTones: Record<OrderStatus, StatusTone> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'neutral',
  delivered: 'success',
  cancelled: 'danger',
}

const channelLabels: Record<OrderChannel, string> = {
  web: 'Web',
  mobile: 'Mobile app',
  marketplace: 'Marketplace',
}

/** Lower-case, accent-free text, so "nguyen" finds "Nguyễn" and "duc" finds "Đức". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/**
 * Orders matching every filter. The query is trimmed, ignores case and
 * accents, and matches the order number, customer name, or email.
 */
export function filterOrders(orders: readonly Order[], filters: OrderFilters): Order[] {
  const query = fold(filters.query.trim())
  return orders.filter(
    (order) =>
      (filters.status === 'all' || order.status === filters.status) &&
      (filters.channel === 'all' || order.channel === filters.channel) &&
      (query === '' ||
        [order.number, order.customer.name, order.customer.email].some((field) =>
          fold(field).includes(query),
        )),
  )
}

const dayMs = 86_400_000

interface Period {
  revenueCents: number
  orderCount: number
  /** Non-cancelled orders; the base for revenue and average order value. */
  keptCount: number
  cancelledCount: number
}

export interface OrderSummary {
  openOrders: number
  current: Period
  previous: Period
}

/**
 * Figures for the 7 days up to `asOf` and the 7 days before, from the given
 * orders only. Cancelled orders are excluded from revenue.
 */
export function summarizeOrders(orders: readonly Order[], asOf: string): OrderSummary {
  const end = Date.parse(asOf)
  const empty = (): Period => ({ revenueCents: 0, orderCount: 0, keptCount: 0, cancelledCount: 0 })
  const current = empty()
  const previous = empty()
  let openOrders = 0
  for (const order of orders) {
    if (order.status === 'pending' || order.status === 'processing') openOrders += 1
    const placed = Date.parse(order.placedAt)
    const period =
      placed > end - 7 * dayMs && placed <= end
        ? current
        : placed > end - 14 * dayMs && placed <= end - 7 * dayMs
          ? previous
          : null
    if (!period) continue
    period.orderCount += 1
    if (order.status === 'cancelled') {
      period.cancelledCount += 1
    } else {
      period.keptCount += 1
      period.revenueCents += order.totalCents
    }
  }
  return { openOrders, current, previous }
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const wholeCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const points = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso))
}

const period = 'the previous 7 days'

/** Relative change between two amounts; none when there is nothing to compare with. */
function relativeChange(
  current: number,
  previous: number,
  goodWhen: 'up' | 'down',
): MetricChange | undefined {
  if (previous === 0) return undefined
  const ratio = (current - previous) / previous
  const direction = Math.abs(ratio) < 0.0005 ? 'flat' : ratio > 0 ? 'up' : 'down'
  return {
    value: percent.format(Math.abs(ratio)),
    direction,
    sentiment: direction === 'flat' ? 'neutral' : direction === goodWhen ? 'positive' : 'negative',
    period,
  }
}

/** Change between two rates in percentage points. */
function pointChange(current: number, previous: number, goodWhen: 'up' | 'down'): MetricChange {
  const delta = (current - previous) * 100
  const direction = Math.abs(delta) < 0.05 ? 'flat' : delta > 0 ? 'up' : 'down'
  return {
    value: `${points.format(Math.abs(delta))} pts`,
    direction,
    sentiment: direction === 'flat' ? 'neutral' : direction === goodWhen ? 'positive' : 'negative',
    period,
  }
}

const average = (p: Period) => (p.keptCount === 0 ? 0 : p.revenueCents / p.keptCount)
const cancelRate = (p: Period) => (p.orderCount === 0 ? 0 : p.cancelledCount / p.orderCount)

interface DashboardState {
  orders: readonly Order[]
  activity: readonly ActivityEntry[]
  notifications: readonly DashboardNotification[]
  /** Counter for ids of activity entries created here. */
  sequence: number
}

type DashboardAction =
  | { type: 'update-status'; ids: readonly string[]; status: 'shipped' | 'cancelled'; at: string }
  | { type: 'mark-read'; id: string }
  | { type: 'mark-all-read' }

const isChangeable = (order: Order) => order.status === 'pending' || order.status === 'processing'

function reducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'update-status': {
      const ids = new Set(action.ids)
      const changed = state.orders.filter((order) => ids.has(order.id) && isChangeable(order))
      if (changed.length === 0) return state
      const [first] = changed
      const entry: ActivityEntry = {
        id: `local-${String(state.sequence)}`,
        actor: 'You',
        action: action.status === 'shipped' ? 'marked as shipped' : 'cancelled',
        target:
          changed.length === 1 && first
            ? `order ${first.number}`
            : `${String(changed.length)} orders`,
        timestamp: action.at,
        icon: action.status === 'shipped' ? <Truck /> : <Ban />,
      }
      return {
        ...state,
        orders: state.orders.map((order) =>
          ids.has(order.id) && isChangeable(order) ? { ...order, status: action.status } : order,
        ),
        activity: [entry, ...state.activity],
        sequence: state.sequence + 1,
      }
    }
    case 'mark-read':
      return {
        ...state,
        notifications: state.notifications.map((item) =>
          item.id === action.id ? { ...item, read: true } : item,
        ),
      }
    case 'mark-all-read':
      return {
        ...state,
        notifications: state.notifications.map((item) => ({ ...item, read: true })),
      }
  }
}

const defaultFilters: OrderFilters = { query: '', status: 'all', channel: 'all' }

function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as readonly string[]).includes(value)
}

function isOrderChannel(value: string): value is OrderChannel {
  return (orderChannels as readonly string[]).includes(value)
}

export interface OrdersDashboardProps {
  /** Starting data. Changes made in the dashboard are kept in memory only. */
  orders: readonly Order[]
  activity: readonly ActivityEntry[]
  notifications: readonly DashboardNotification[]
  /** End of the reporting window (ISO 8601). Metrics never read the clock. */
  asOf: string
  className?: string
}

/**
 * An order operations view composed from the data-display collection:
 * metrics derived from the orders, a filterable and sortable table with bulk
 * actions, a detail panel, notifications, and an activity feed. It holds its
 * data in memory and has no backend.
 */
export function OrdersDashboard({
  orders: initialOrders,
  activity: initialActivity,
  notifications: initialNotifications,
  asOf,
  className,
}: OrdersDashboardProps) {
  const headingId = useId()
  const openHintId = useId()
  const bulkHintId = useId()
  const detailHintId = useId()
  const [state, dispatch] = useReducer(reducer, {
    orders: initialOrders,
    activity: initialActivity,
    notifications: initialNotifications,
    sequence: 1,
  })
  const [filters, setFilters] = useState<OrderFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [detailId, setDetailId] = useState<string | null>(null)

  const filtered = useMemo(() => filterOrders(state.orders, filters), [state.orders, filters])
  const summary = useMemo(() => summarizeOrders(state.orders, asOf), [state.orders, asOf])
  const selectedOrders = filtered.filter((order) => selectedIds.has(order.id))
  const changeable = selectedOrders.filter(isChangeable)
  const detail = state.orders.find((order) => order.id === detailId)
  const unread = state.notifications.filter((item) => !item.read).length

  function updateFilters(next: OrderFilters) {
    setFilters(next)
    setPage(1)
    // Keep only selected rows that are still visible, so bulk actions never touch hidden rows.
    const visible = new Set(filterOrders(state.orders, next).map((order) => order.id))
    setSelectedIds((current) => new Set([...current].filter((id) => visible.has(id))))
  }

  function updateStatus(ids: readonly string[], status: 'shipped' | 'cancelled') {
    dispatch({ type: 'update-status', ids, status, at: new Date().toISOString() })
    setSelectedIds(new Set())
  }

  const columns = useMemo<DataTableColumn<Order>[]>(
    () => [
      {
        id: 'number',
        header: 'Order',
        rowHeader: true,
        sortValue: (order) => order.number,
        cell: (order) => (
          <button
            type="button"
            aria-describedby={openHintId}
            onClick={() => {
              setDetailId(order.id)
            }}
            className="cursor-pointer rounded-sm font-medium text-primary underline-offset-4 focus-ring hover:underline"
          >
            {order.number}
          </button>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        sortValue: (order) => order.customer.name,
        className: 'min-w-44',
        cell: (order) => (
          <div className="flex flex-col">
            <span>{order.customer.name}</span>
            <span className="text-xs text-muted-foreground">{order.customer.email}</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        sortValue: (order) => orderStatuses.indexOf(order.status),
        cell: (order) => (
          <StatusBadge tone={statusTones[order.status]}>{statusLabels[order.status]}</StatusBadge>
        ),
      },
      {
        id: 'channel',
        header: 'Channel',
        hideBelow: 'md',
        cell: (order) => channelLabels[order.channel],
      },
      {
        id: 'items',
        header: 'Items',
        align: 'end',
        hideBelow: 'lg',
        sortValue: (order) => order.itemCount,
        cell: (order) => order.itemCount,
      },
      {
        id: 'placed',
        header: 'Placed',
        sortValue: (order) => Date.parse(order.placedAt),
        className: 'whitespace-nowrap',
        cell: (order) => (
          <time dateTime={order.placedAt}>{dateFormat.format(new Date(order.placedAt))}</time>
        ),
      },
      {
        id: 'total',
        header: 'Total',
        align: 'end',
        sortValue: (order) => order.totalCents,
        cell: (order) => currency.format(order.totalCents / 100),
      },
    ],
    [openHintId],
  )

  const revenueChange = relativeChange(
    summary.current.revenueCents,
    summary.previous.revenueCents,
    'up',
  )
  const averageChange = relativeChange(average(summary.current), average(summary.previous), 'up')

  const bulkHint =
    selectedOrders.length === 0
      ? 'Select pending or processing orders to ship or cancel them.'
      : changeable.length === 0
        ? 'Only pending or processing orders can be shipped or cancelled.'
        : `${String(changeable.length)} of ${String(selectedOrders.length)} selected can be updated.`
  const changeableIds = changeable.map((order) => order.id)
  const count = changeable.length

  return (
    <section
      aria-labelledby={headingId}
      className={cn('@container flex w-full min-w-0 flex-col gap-6', className)}
    >
      <span id={openHintId} hidden>
        Opens order details
      </span>
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-heading">
          Orders
        </h2>
        <p className="text-sm text-muted-foreground">
          Example data, held in memory. Figures are calculated from these orders for the 7 days
          ending {dateFormat.format(new Date(asOf))}.
        </p>
      </div>

      <div className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-4">
        <MetricCard
          label="Open orders"
          value={String(summary.openOrders)}
          footnote="Pending or processing"
        />
        <MetricCard
          label="Revenue, last 7 days"
          value={wholeCurrency.format(summary.current.revenueCents / 100)}
          {...(revenueChange ? { change: revenueChange } : {})}
        />
        <MetricCard
          label="Average order value"
          value={currency.format(average(summary.current) / 100)}
          {...(averageChange ? { change: averageChange } : {})}
        />
        <MetricCard
          label="Cancellation rate"
          value={percent.format(cancelRate(summary.current))}
          change={pointChange(cancelRate(summary.current), cancelRate(summary.previous), 'down')}
        />
      </div>

      <div
        className={cn(
          'grid min-w-0 gap-6',
          detail && 'xl:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]',
        )}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <DataToolbar
            search={{
              label: 'Search orders',
              placeholder: 'Number, customer, or email',
              value: filters.query,
              onChange: (query) => {
                updateFilters({ ...filters, query })
              },
            }}
            filters={[
              {
                id: 'status',
                label: 'Status',
                value: filters.status,
                defaultValue: 'all',
                options: [
                  { value: 'all', label: 'All statuses' },
                  ...orderStatuses.map((value) => ({ value, label: statusLabels[value] })),
                ],
                onChange: (value) => {
                  if (value === 'all' || isOrderStatus(value)) {
                    updateFilters({ ...filters, status: value })
                  }
                },
              },
              {
                id: 'channel',
                label: 'Channel',
                value: filters.channel,
                defaultValue: 'all',
                options: [
                  { value: 'all', label: 'All channels' },
                  ...orderChannels.map((value) => ({ value, label: channelLabels[value] })),
                ],
                onChange: (value) => {
                  if (value === 'all' || isOrderChannel(value)) {
                    updateFilters({ ...filters, channel: value })
                  }
                },
              },
            ]}
            resultCount={filtered.length}
            formatResultCount={(n) => `${String(n)} ${n === 1 ? 'order' : 'orders'}`}
            onReset={() => {
              updateFilters(defaultFilters)
            }}
            actions={
              <>
                <p id={bulkHintId} className="sr-only">
                  {bulkHint}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  aria-disabled={count === 0}
                  aria-describedby={bulkHintId}
                  onClick={() => {
                    if (count > 0) updateStatus(changeableIds, 'shipped')
                  }}
                >
                  <Truck aria-hidden="true" />
                  {count > 0 ? `Mark ${String(count)} as shipped` : 'Mark as shipped'}
                </Button>
                <ConfirmAction
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      aria-disabled={count === 0}
                      aria-describedby={bulkHintId}
                      onClick={(event) => {
                        if (count === 0) event.preventDefault()
                      }}
                    >
                      <Ban aria-hidden="true" />
                      {count > 0 ? `Cancel ${String(count)}…` : 'Cancel…'}
                    </Button>
                  }
                  title={count === 1 ? 'Cancel 1 order?' : `Cancel ${String(count)} orders?`}
                  description="Customers are notified and payments are refunded. Shipped and delivered orders in the selection are not affected."
                  confirmLabel="Cancel orders"
                  cancelLabel="Keep orders"
                  onConfirm={() => {
                    updateStatus(changeableIds, 'cancelled')
                  }}
                />
              </>
            }
          />
          <DataTable
            label="Orders"
            itemName="orders"
            columns={columns}
            state={{ status: 'ready', items: filtered }}
            getRowId={(order) => order.id}
            defaultSort={{ columnId: 'placed', direction: 'desc' }}
            page={page}
            onPageChange={setPage}
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
            selection={{
              selectedIds,
              onSelectedIdsChange: setSelectedIds,
              rowLabel: (order) => `Select order ${order.number}`,
            }}
            activeRowId={detailId}
            empty={
              state.orders.length === 0
                ? { title: 'No orders yet', description: 'New orders appear here.' }
                : {
                    title: 'No orders match these filters',
                    description: 'Try a different search, or clear the filters.',
                    action: (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateFilters(defaultFilters)
                        }}
                      >
                        Clear filters
                      </Button>
                    ),
                  }
            }
          />
        </div>

        <DetailPanel
          open={detail !== undefined}
          onOpenChange={(open) => {
            if (!open) setDetailId(null)
          }}
          inlineQuery="(min-width: 80rem)"
          title={detail ? `Order ${detail.number}` : 'Order'}
          description={detail ? `Placed ${formatDateTime(detail.placedAt)}` : undefined}
        >
          {detail ? (
            <>
              <StatusBadge tone={statusTones[detail.status]} className="self-start">
                {statusLabels[detail.status]}
              </StatusBadge>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Customer</dt>
                <dd>{detail.customer.name}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="break-all">{detail.customer.email}</dd>
                <dt className="text-muted-foreground">City</dt>
                <dd>{detail.city}</dd>
                <dt className="text-muted-foreground">Channel</dt>
                <dd>{channelLabels[detail.channel]}</dd>
                <dt className="text-muted-foreground">Items</dt>
                <dd className="tabular-nums">{detail.itemCount}</dd>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-medium tabular-nums">
                  {currency.format(detail.totalCents / 100)}
                </dd>
              </dl>
              <p id={detailHintId} className="text-xs text-muted-foreground">
                {isChangeable(detail)
                  ? 'This order can still be shipped or cancelled.'
                  : `${statusLabels[detail.status]} orders can no longer be changed.`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  aria-disabled={!isChangeable(detail)}
                  aria-describedby={detailHintId}
                  onClick={() => {
                    if (isChangeable(detail)) updateStatus([detail.id], 'shipped')
                  }}
                >
                  <Truck aria-hidden="true" />
                  Mark as shipped
                </Button>
                <ConfirmAction
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      aria-disabled={!isChangeable(detail)}
                      aria-describedby={detailHintId}
                      onClick={(event) => {
                        if (!isChangeable(detail)) event.preventDefault()
                      }}
                    >
                      <Ban aria-hidden="true" />
                      Cancel order…
                    </Button>
                  }
                  title={`Cancel order ${detail.number}?`}
                  description={`${detail.customer.name} is notified and refunded ${currency.format(detail.totalCents / 100)}.`}
                  confirmLabel="Cancel order"
                  cancelLabel="Keep order"
                  onConfirm={() => {
                    updateStatus([detail.id], 'cancelled')
                  }}
                />
              </div>
            </>
          ) : null}
        </DetailPanel>
      </div>

      <div className="grid gap-6 @3xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base">
              <Bell aria-hidden="true" className="size-4 text-muted-foreground" />
              Notifications
              {unread > 0 ? (
                <span className="text-sm font-normal text-muted-foreground">({unread} unread)</span>
              ) : null}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              aria-disabled={unread === 0}
              onClick={() => {
                if (unread > 0) dispatch({ type: 'mark-all-read' })
              }}
            >
              Mark all read
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {state.notifications.length === 0 ? (
              <p className="px-3 pb-3 text-sm text-muted-foreground">You’re all caught up.</p>
            ) : (
              <ul aria-label="Notifications" className="flex flex-col gap-1">
                {state.notifications.map((item) => (
                  <li key={item.id}>
                    <NotificationItem
                      title={item.title}
                      description={item.description}
                      timestamp={item.timestamp}
                      timeLabel={formatDateTime(item.timestamp)}
                      read={item.read}
                      onMarkRead={() => {
                        dispatch({ type: 'mark-read', id: item.id })
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              <PackageCheck aria-hidden="true" className="size-4 text-muted-foreground" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList
              label="Recent activity"
              items={state.activity.slice(0, 8)}
              formatTimestamp={formatDateTime}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
