import { RotateCw } from 'lucide-react'
import { useId, useState } from 'react'

import { EmptyState } from '@/components/blocks/empty-state'
import { ErrorState } from '@/components/blocks/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { MetricCard } from '@/components/ui/metric-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline, type SparklineTone } from '@/components/ui/sparkline'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'

export type ServiceHealth = 'operational' | 'degraded' | 'outage' | 'maintenance'

/** Readings of one service over one range. */
export interface ServiceReading {
  /** p95 latency samples in milliseconds, oldest first. */
  latencyMs: readonly number[]
  /** Share of the range the service was up, 0–100. */
  uptimePct: number
}

export interface MonitoredService {
  id: string
  name: string
  /** The service's state now. */
  status: ServiceHealth
  /** Readings per range id. A range with no entry is shown as having no readings. */
  readings: Readonly<Record<string, ServiceReading>>
}

export type IncidentSeverity = 'minor' | 'major' | 'critical'
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

export interface Incident {
  id: string
  title: string
  /** Id of the affected MonitoredService. */
  serviceId: string
  severity: IncidentSeverity
  status: IncidentStatus
  /** ISO 8601 timestamp. */
  startedAt: string
  /** ISO 8601 timestamp, once resolved. */
  resolvedAt?: string
}

export interface MonitoringRangeOption {
  id: string
  label: string
}

/** What the block shows. A `ready` state with no services shows the empty state. */
export type MonitoringDashboardState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | {
      status: 'ready'
      services: readonly MonitoredService[]
      /** Newest first or not: the block orders them, open ones first. */
      incidents: readonly Incident[]
      /** ISO 8601 time of the last check, shown as “Checked at …”. */
      checkedAt: string
    }

export interface MonitoringDashboardProps {
  state: MonitoringDashboardState
  /**
   * Re-checks the services. Shows a Refresh button while it runs and when it settles; provide the
   * new state yourself. The block starts no timers: poll in your data layer if you need to.
   */
  onRefresh?: () => void | Promise<void>
  /** Shows a retry button in the error state. */
  onRetry?: () => void
  ranges?: readonly MonitoringRangeOption[]
  /** Initial range id. Defaults to the first range. */
  defaultRange?: string
  onRangeChange?: (range: string) => void
  title?: string
  className?: string
}

export interface ServiceSummary {
  total: number
  operational: number
  /** Services that are not operational. */
  withIssues: number
  /** Mean uptime of the services that have readings for the range, or null when none do. */
  uptimePct: number | null
  /** Median of each service's latest p95 sample for the range, or null when none have one. */
  medianP95Ms: number | null
  openIncidents: number
}

/** The figures in the summary cards, calculated from what the block is given. */
export function summarizeServices(
  services: readonly MonitoredService[],
  incidents: readonly Incident[],
  range: string,
): ServiceSummary {
  const readings = services.flatMap((service) => service.readings[range] ?? [])
  const latest = readings
    .map((reading) => reading.latencyMs[reading.latencyMs.length - 1])
    .filter((sample) => sample !== undefined)
    .sort((a, b) => a - b)
  const middle = Math.floor(latest.length / 2)
  const median =
    latest.length === 0
      ? null
      : latest.length % 2 === 1
        ? (latest[middle] ?? null)
        : Math.round(((latest[middle - 1] ?? 0) + (latest[middle] ?? 0)) / 2)
  const operational = services.filter((service) => service.status === 'operational').length
  return {
    total: services.length,
    operational,
    withIssues: services.length - operational,
    uptimePct:
      readings.length === 0
        ? null
        : readings.reduce((sum, reading) => sum + reading.uptimePct, 0) / readings.length,
    medianP95Ms: median,
    openIncidents: incidents.filter((incident) => incident.status !== 'resolved').length,
  }
}

const defaultRanges: readonly MonitoringRangeOption[] = [
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
]

const healthLabel: Record<ServiceHealth, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage',
  maintenance: 'Maintenance',
}
const healthTone: Record<ServiceHealth, StatusTone> = {
  operational: 'success',
  degraded: 'warning',
  outage: 'danger',
  maintenance: 'info',
}
const sparklineTone: Record<ServiceHealth, SparklineTone> = {
  operational: 'success',
  degraded: 'warning',
  outage: 'destructive',
  maintenance: 'muted',
}
const severityLabel: Record<IncidentSeverity, string> = {
  minor: 'Minor',
  major: 'Major',
  critical: 'Critical',
}
const severityTone: Record<IncidentSeverity, StatusTone> = {
  minor: 'info',
  major: 'warning',
  critical: 'danger',
}
const incidentStatusLabel: Record<IncidentStatus, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
})

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : `${dateTime.format(date)} UTC`
}

function MonitoringSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Loading service status…</span>
      <div className="grid gap-4 @lg:grid-cols-2 @[52rem]:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <Skeleton key={card} className="h-24" />
        ))}
      </div>
      <div className="grid gap-3 @lg:grid-cols-2 @[52rem]:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <Skeleton key={card} className="h-32" />
        ))}
      </div>
    </div>
  )
}

function ServiceCard({
  service,
  range,
  rangeLabel,
}: {
  service: MonitoredService
  range: string
  rangeLabel: string
}) {
  const reading = service.readings[range]
  const samples = reading?.latencyMs ?? []
  const latest = samples[samples.length - 1]
  const low = samples.length > 0 ? Math.min(...samples) : undefined
  const high = samples.length > 0 ? Math.max(...samples) : undefined
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
        <CardTitle as="h4" className="min-w-0 text-base">
          {service.name}
        </CardTitle>
        <StatusBadge tone={healthTone[service.status]}>{healthLabel[service.status]}</StatusBadge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {reading && latest !== undefined && low !== undefined && high !== undefined ? (
          <>
            <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
              <span className="tabular-nums">
                <span className="text-lg font-semibold">{latest} ms</span>{' '}
                <span className="text-muted-foreground">p95 latency</span>
              </span>
              <span className="text-muted-foreground tabular-nums">
                {reading.uptimePct.toFixed(2)}% uptime
              </span>
            </p>
            <Sparkline
              values={samples}
              tone={sparklineTone[service.status]}
              label={`${service.name} p95 latency, ${rangeLabel.toLowerCase()}: low ${String(low)} ms, high ${String(high)} ms, latest ${String(latest)} ms`}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No readings for this range.</p>
        )}
      </CardContent>
    </Card>
  )
}

function IncidentList({
  incidents,
  services,
}: {
  incidents: readonly Incident[]
  services: readonly MonitoredService[]
}) {
  // Open incidents first, then resolved, each newest first.
  const ordered = [...incidents].sort(
    (a, b) =>
      Number(a.status === 'resolved') - Number(b.status === 'resolved') ||
      Date.parse(b.startedAt) - Date.parse(a.startedAt),
  )
  return (
    <ul aria-label="Incidents" className="flex flex-col divide-y rounded-lg border px-4">
      {ordered.map((incident) => (
        <li key={incident.id} className="flex flex-col gap-1.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{incident.title}</span>
            <StatusBadge tone={severityTone[incident.severity]}>
              {severityLabel[incident.severity]}
            </StatusBadge>
            <StatusBadge tone={incident.status === 'resolved' ? 'success' : 'info'}>
              {incidentStatusLabel[incident.status]}
            </StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            {services.find((service) => service.id === incident.serviceId)?.name ??
              incident.serviceId}
            {' · Started '}
            <time dateTime={incident.startedAt}>{formatDateTime(incident.startedAt)}</time>
            {incident.resolvedAt ? (
              <>
                {' · Resolved '}
                <time dateTime={incident.resolvedAt}>{formatDateTime(incident.resolvedAt)}</time>
              </>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  )
}

function MonitoringBody({
  state,
  range,
  rangeLabel,
  onlyIssues,
  onOnlyIssuesChange,
  onRetry,
}: {
  state: MonitoringDashboardState
  range: string
  rangeLabel: string
  onlyIssues: boolean
  onOnlyIssuesChange: (next: boolean) => void
  onRetry: (() => void) | undefined
}) {
  const switchId = useId()
  const servicesHeadingId = useId()
  const incidentsHeadingId = useId()

  if (state.status === 'loading') return <MonitoringSkeleton />
  if (state.status === 'error') {
    return (
      <ErrorState
        headingLevel="h3"
        title="Couldn’t load service status"
        {...(state.message ? { description: state.message } : {})}
        {...(onRetry ? { onRetry } : {})}
      />
    )
  }
  if (state.services.length === 0) {
    return (
      <EmptyState
        headingLevel="h3"
        title="No services are monitored yet"
        description="Add a service to start tracking its status and latency."
      />
    )
  }

  const summary = summarizeServices(state.services, state.incidents, range)
  const shown = onlyIssues
    ? state.services.filter((service) => service.status !== 'operational')
    : state.services

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 @lg:grid-cols-2 @[52rem]:grid-cols-4">
        <MetricCard
          label="Services operational"
          value={`${String(summary.operational)} of ${String(summary.total)}`}
          footnote={
            summary.withIssues === 0
              ? 'Everything is running normally'
              : `${String(summary.withIssues)} with issues`
          }
        />
        <MetricCard
          label="Uptime"
          value={summary.uptimePct === null ? '—' : `${summary.uptimePct.toFixed(2)}%`}
          footnote={`Average, ${rangeLabel.toLowerCase()}`}
        />
        <MetricCard
          label="Median p95 latency"
          value={summary.medianP95Ms === null ? '—' : `${String(summary.medianP95Ms)} ms`}
          footnote="Latest sample per service"
        />
        <MetricCard
          label="Open incidents"
          value={String(summary.openIncidents)}
          footnote={summary.openIncidents === 0 ? 'No open incidents' : 'Not yet resolved'}
        />
      </div>

      <section aria-labelledby={servicesHeadingId} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id={servicesHeadingId} className="text-base font-semibold tracking-tight">
            Services
          </h3>
          <div className="flex items-center gap-2">
            <Switch
              id={switchId}
              size="sm"
              checked={onlyIssues}
              onCheckedChange={onOnlyIssuesChange}
            />
            <Label htmlFor={switchId} className="font-normal">
              Only services with issues
            </Label>
          </div>
        </div>
        {shown.length === 0 ? (
          <EmptyState
            headingLevel="h4"
            title="No services have issues"
            description="Every monitored service is operational."
          />
        ) : (
          <ul aria-label="Services" className="grid gap-3 @lg:grid-cols-2 @[52rem]:grid-cols-3">
            {shown.map((service) => (
              <li key={service.id} className="min-w-0">
                <ServiceCard service={service} range={range} rangeLabel={rangeLabel} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={incidentsHeadingId} className="flex flex-col gap-3">
        <h3 id={incidentsHeadingId} className="text-base font-semibold tracking-tight">
          Incidents
        </h3>
        {state.incidents.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No incidents reported.
          </p>
        ) : (
          <IncidentList incidents={state.incidents} services={state.services} />
        )}
      </section>
    </div>
  )
}

/**
 * A service status page: summary figures, a card per service with its health and a latency
 * sparkline, and the incident list, switchable between time ranges. It can ask its owner to
 * refresh, but it holds no data, starts no timers, and fetches nothing. Loading, empty, and error
 * states are built in.
 */
export function MonitoringDashboard({
  state,
  onRefresh,
  onRetry,
  ranges = defaultRanges,
  defaultRange,
  onRangeChange,
  title = 'System status',
  className,
}: MonitoringDashboardProps) {
  const headingId = useId()
  const [range, setRange] = useState(defaultRange ?? ranges[0]?.id ?? '')
  const [onlyIssues, setOnlyIssues] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const rangeLabel = ranges.find((option) => option.id === range)?.label ?? range

  const refresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    setRefreshFailed(false)
    try {
      await onRefresh()
    } catch {
      // The previous results stay on screen; say so rather than failing silently.
      setRefreshFailed(true)
    } finally {
      setRefreshing(false)
    }
  }

  const body = (
    <MonitoringBody
      state={state}
      range={range}
      rangeLabel={rangeLabel}
      onlyIssues={onlyIssues}
      onOnlyIssuesChange={setOnlyIssues}
      onRetry={onRetry}
    />
  )

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={state.status === 'loading'}
      className={cn('@container w-full min-w-0', className)}
    >
      <Tabs
        variant="pill"
        value={range}
        onValueChange={(next) => {
          setRange(next)
          onRangeChange?.(next)
        }}
        className="gap-5"
      >
        <header className="flex flex-col gap-3 @lg:flex-row @lg:items-start @lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={headingId} className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            <p role="status" className="text-sm text-muted-foreground">
              {state.status === 'ready' ? `Checked at ${formatDateTime(state.checkedAt)}` : ''}
            </p>
            {refreshFailed ? (
              <p role="alert" className="text-sm text-destructive">
                Couldn’t refresh. Showing the last results.
              </p>
            ) : null}
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
            {onRefresh ? (
              <Button
                variant="outline"
                size="sm"
                loading={refreshing}
                onClick={() => {
                  void refresh()
                }}
              >
                <RotateCw aria-hidden="true" />
                Refresh
              </Button>
            ) : null}
          </div>
        </header>
        {state.status === 'ready' ? (
          ranges.map((option) => (
            <TabsContent key={option.id} value={option.id}>
              {body}
            </TabsContent>
          ))
        ) : (
          <div>{body}</div>
        )}
      </Tabs>
    </section>
  )
}
