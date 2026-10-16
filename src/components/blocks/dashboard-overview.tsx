import { Activity, ListOrdered, TrendingUp } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

import { ActivityList, type ActivityEntry } from '@/components/blocks/activity-list'
import { EmptyState } from '@/components/blocks/empty-state'
import { ErrorState } from '@/components/blocks/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard, type MetricChange } from '@/components/ui/metric-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline, type SparklineTone } from '@/components/ui/sparkline'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'

export interface DashboardMetric {
  id: string
  label: string
  /** Preformatted value, e.g. "12,480". Format numbers before passing them in. */
  value: string
  change?: MetricChange
  /** Values for the card's sparkline, oldest first. */
  trend: readonly number[]
  /** Spoken summary of the sparkline, e.g. "Last 7 days: up from 38 to 52". */
  trendLabel: string
  tone?: SparklineTone
}

export interface DashboardTrend {
  /** What the chart measures, e.g. "Tasks completed". Also names the data table. */
  name: string
  /** Spoken summary of the chart, with the takeaway. */
  summary: string
  /** In order, oldest first. The labels are shown as the first and last x-axis captions. */
  points: readonly { label: string; value: number }[]
}

export interface DashboardHighlight {
  id: string
  name: string
  /** Preformatted figure, e.g. "1,204 visits". */
  figure: string
  status: { label: string; tone: StatusTone }
}

/** Everything shown for one time range. */
export interface DashboardPeriod {
  metrics: readonly DashboardMetric[]
  trend: DashboardTrend
  highlights: readonly DashboardHighlight[]
}

export interface DashboardRangeOption {
  id: string
  label: string
}

/** What the block shows. A `ready` range with no data of any kind shows the empty state. */
export type DashboardOverviewState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | {
      status: 'ready'
      /** Data per range id. A range with no entry is shown as empty. */
      periods: Readonly<Record<string, DashboardPeriod>>
      /** Newest first. Not tied to the range. */
      activity: readonly ActivityEntry[]
    }

export interface DashboardOverviewProps {
  state: DashboardOverviewState
  /** ISO 8601 end of the reporting window, shown as “Data as of …”. The block never reads the clock. */
  asOf: string
  title?: string
  /** Text under the title, before “Data as of …”. */
  description?: string
  ranges?: readonly DashboardRangeOption[]
  /** Controlled range id. */
  range?: string
  /** Initial range id when uncontrolled. Defaults to the first range. */
  defaultRange?: string
  onRangeChange?: (range: string) => void
  highlightsTitle?: string
  activityTitle?: string
  /** Shows a retry button in the error state. */
  onRetry?: () => void
  /** Buttons or links at the end of the header. */
  actions?: ReactNode
  className?: string
}

const defaultRanges: readonly DashboardRangeOption[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
]

const numberFormat = new Intl.NumberFormat('en-US')
const dateTime = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : `${dateTime.format(date)} UTC`
}

function isEmptyPeriod(period: DashboardPeriod | undefined): boolean {
  return (
    period === undefined ||
    (period.metrics.length === 0 &&
      period.trend.points.length === 0 &&
      period.highlights.length === 0)
  )
}

function OverviewSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Loading overview…</span>
      <div className="grid gap-4 @lg:grid-cols-2 @[52rem]:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <Skeleton key={card} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-56" />
    </div>
  )
}

function TrendCard({ trend }: { trend: DashboardTrend }) {
  const first = trend.points[0]
  const last = trend.points[trend.points.length - 1]
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle as="h3" className="text-base">
          <TrendingUp aria-hidden="true" className="size-4 text-muted-foreground" />
          {trend.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Sparkline
          area
          values={trend.points.map((point) => point.value)}
          label={trend.summary}
          className="h-32"
        />
        {first && last ? (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{first.label}</span>
            <span>{last.label}</span>
          </div>
        ) : null}
        <details>
          <summary className="w-fit cursor-pointer rounded-sm text-sm font-medium focus-ring">
            View data as table
          </summary>
          <div className="mt-2 max-h-64 overflow-auto rounded-md border">
            <Table>
              <TableCaption className="sr-only">{trend.name}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">{trend.name}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trend.points.map((point) => (
                  <TableRow key={point.label}>
                    <TableHead scope="row" className="font-normal text-foreground">
                      {point.label}
                    </TableHead>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(point.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

function HighlightsCard({ title, items }: { title: string; items: readonly DashboardHighlight[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle as="h3" className="text-base">
          <ListOrdered aria-hidden="true" className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to highlight in this range.</p>
        ) : (
          <ol aria-label={title} className="flex flex-col divide-y">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 text-sm">
                  <span className="text-muted-foreground tabular-nums">{index + 1}.</span>{' '}
                  <span className="font-medium">{item.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground tabular-nums">{item.figure}</span>
                  <StatusBadge tone={item.status.tone}>{item.status.label}</StatusBadge>
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function OverviewBody({
  state,
  range,
  highlightsTitle,
  activityTitle,
  onRetry,
}: {
  state: DashboardOverviewState
  range: string
  highlightsTitle: string
  activityTitle: string
  onRetry: (() => void) | undefined
}) {
  if (state.status === 'loading') return <OverviewSkeleton />
  if (state.status === 'error') {
    return (
      <ErrorState
        headingLevel="h3"
        title="Couldn’t load the overview"
        {...(state.message ? { description: state.message } : {})}
        {...(onRetry ? { onRetry } : {})}
      />
    )
  }
  const period = state.periods[range]
  if (period === undefined || isEmptyPeriod(period)) {
    return (
      <EmptyState
        headingLevel="h3"
        title="No data for this range yet"
        description="Figures appear here once there is activity to report."
      />
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 @lg:grid-cols-2 @[52rem]:grid-cols-4">
        {period.metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            {...(metric.change ? { change: metric.change } : {})}
            footnote={
              <Sparkline
                values={metric.trend}
                label={metric.trendLabel}
                tone={metric.tone ?? 'primary'}
                className="mt-1"
              />
            }
          />
        ))}
      </div>
      <TrendCard trend={period.trend} />
      <div className="grid gap-4 @2xl:grid-cols-2">
        <HighlightsCard title={highlightsTitle} items={period.highlights} />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle as="h3" className="text-base">
              <Activity aria-hidden="true" className="size-4 text-muted-foreground" />
              {activityTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList
              label={activityTitle}
              items={state.activity}
              formatTimestamp={formatDateTime}
              emptyMessage="No recent activity."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * A product overview page: key metrics with trend lines, a main trend chart with a data-table
 * alternative, highlights, and recent activity, switchable between time ranges. The metrics are
 * values you calculate and pass in; the block only lays them out. It has its own loading, empty,
 * and error states and fetches nothing.
 */
export function DashboardOverview({
  state,
  asOf,
  title = 'Overview',
  description,
  ranges = defaultRanges,
  range,
  defaultRange,
  onRangeChange,
  highlightsTitle = 'Highlights',
  activityTitle = 'Recent activity',
  onRetry,
  actions,
  className,
}: DashboardOverviewProps) {
  const headingId = useId()
  const [internalRange, setInternalRange] = useState(defaultRange ?? ranges[0]?.id ?? '')
  const current = range ?? internalRange

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={state.status === 'loading'}
      className={cn('@container w-full min-w-0', className)}
    >
      <Tabs
        variant="pill"
        value={current}
        onValueChange={(next) => {
          setInternalRange(next)
          onRangeChange?.(next)
        }}
        className="gap-5"
      >
        <header className="flex flex-col gap-3 @lg:flex-row @lg:items-end @lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={headingId} className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {description ? `${description} ` : ''}Data as of {formatDateTime(asOf)}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {state.status === 'ready' ? (
              <TabsList aria-label="Time range">
                {ranges.map((option) => (
                  <TabsTrigger key={option.id} value={option.id}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            ) : null}
            {actions}
          </div>
        </header>
        {state.status === 'ready' ? (
          ranges.map((option) => (
            <TabsContent key={option.id} value={option.id}>
              <OverviewBody
                state={state}
                range={current}
                highlightsTitle={highlightsTitle}
                activityTitle={activityTitle}
                onRetry={onRetry}
              />
            </TabsContent>
          ))
        ) : (
          <div>
            <OverviewBody
              state={state}
              range={current}
              highlightsTitle={highlightsTitle}
              activityTitle={activityTitle}
              onRetry={onRetry}
            />
          </div>
        )}
      </Tabs>
    </section>
  )
}
