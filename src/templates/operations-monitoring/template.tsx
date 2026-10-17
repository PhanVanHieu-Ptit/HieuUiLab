import { Activity, BellRing, ListChecks } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

import { ActivityList, type ActivityEntry } from '@/components/blocks/activity-list'
import { EmptyState } from '@/components/blocks/empty-state'
import { ErrorState } from '@/components/blocks/error-state'
import {
  MonitoringDashboard,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
  type MonitoredService,
  type MonitoringDashboardState,
} from '@/components/blocks/monitoring-dashboard'
import {
  NotificationCenter,
  type NotificationCenterState,
  type NotificationEntry,
} from '@/components/blocks/notification-center'
import {
  SearchFilterToolbar,
  type FilterToolbarValue,
} from '@/components/blocks/search-filter-toolbar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExampleOnlyNotice, MockPicker } from '@/registry/demo-controls'
import { mockDelay } from '@/registry/mock-delay'
import {
  checkedAtAfter,
  healthyServices,
  incidents as allIncidents,
  services as allServices,
} from '@/registry/monitoring-dashboard/mock-data'
import { formatUtc } from '@/templates/shared/format'
import { TemplateShell } from '@/templates/shared/template-shell'

type ViewId = 'status' | 'alerts' | 'log'
type MockState = 'ready' | 'quiet' | 'loading' | 'error'

const mockStates: readonly { value: MockState; label: string }[] = [
  { value: 'ready', label: 'With incidents' },
  { value: 'quiet', label: 'All operational' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

const severityLabels: Record<IncidentSeverity, string> = {
  minor: 'Minor',
  major: 'Major',
  critical: 'Critical',
}

const statusLabels: Record<IncidentStatus, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

const initialLogValue: FilterToolbarValue = { query: '', filters: {}, sort: 'newest' }

function serviceName(services: readonly MonitoredService[], id: string): string {
  return services.find((service) => service.id === id)?.name ?? id
}

/** Incidents as notifications, so the inbox and the dashboard can never disagree. */
function alertsFor(
  incidents: readonly Incident[],
  services: readonly MonitoredService[],
  readIds: ReadonlySet<string>,
): NotificationEntry[] {
  return incidents
    .map((incident): NotificationEntry => {
      const detail = [
        serviceName(services, incident.serviceId),
        severityLabels[incident.severity],
        statusLabels[incident.status],
      ]
      return {
        id: incident.id,
        // The inbox has a limited set of types; an incident being investigated is the one that
        // needs a person, so it takes the "assignment" slot (relabelled below).
        type: incident.status === 'investigating' ? 'assignment' : 'system',
        title: incident.title,
        description: detail.join(' · '),
        timestamp: incident.resolvedAt ?? incident.startedAt,
        read: readIds.has(incident.id),
      }
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

/** The incident log: one entry when an incident opened and another when it resolved. */
function logFor(
  incidents: readonly Incident[],
  services: readonly MonitoredService[],
  value: FilterToolbarValue,
): ActivityEntry[] {
  const query = value.query.trim().toLowerCase()
  const service = value.filters.service ?? 'all'
  const status = value.filters.status ?? 'all'

  const entries = incidents
    .filter((incident) => {
      const name = serviceName(services, incident.serviceId)
      return (
        (service === 'all' || incident.serviceId === service) &&
        (status === 'all' || (status === 'open') === (incident.status !== 'resolved')) &&
        (query === '' || `${incident.title} ${name}`.toLowerCase().includes(query))
      )
    })
    .flatMap((incident): ActivityEntry[] => {
      const actor = serviceName(services, incident.serviceId)
      const opened: ActivityEntry = {
        id: `${incident.id}-opened`,
        actor,
        action: `incident opened (${severityLabels[incident.severity].toLowerCase()})`,
        target: incident.title,
        timestamp: incident.startedAt,
      }
      return incident.resolvedAt
        ? [
            opened,
            {
              id: `${incident.id}-resolved`,
              actor,
              action: 'incident resolved',
              target: incident.title,
              timestamp: incident.resolvedAt,
            },
          ]
        : [opened]
    })

  return entries.sort((a, b) =>
    value.sort === 'oldest'
      ? a.timestamp.localeCompare(b.timestamp)
      : b.timestamp.localeCompare(a.timestamp),
  )
}

function IncidentLog({
  mock,
  incidents,
  services,
  onRetry,
}: {
  mock: MockState
  incidents: readonly Incident[]
  services: readonly MonitoredService[]
  onRetry: () => void
}) {
  const headingId = useId()
  const [value, setValue] = useState<FilterToolbarValue>(initialLogValue)
  const entries = logFor(incidents, services, value)

  let body: ReactNode
  if (mock === 'loading') {
    body = (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">Loading the incident log…</span>
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-12" />
        ))}
      </div>
    )
  } else if (mock === 'error') {
    body = (
      <ErrorState
        headingLevel="h3"
        title="Couldn’t load the incident log"
        description="Mock: the status service did not respond."
        onRetry={onRetry}
      />
    )
  } else if (incidents.length === 0) {
    body = (
      <EmptyState
        title="No incidents"
        description="Every service is operational, so there is nothing to list."
      />
    )
  } else if (entries.length === 0) {
    body = (
      <EmptyState
        title="No incidents match"
        description="Try a different search, or remove a filter."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(initialLogValue)
            }}
          >
            Clear everything
          </Button>
        }
      />
    )
  } else {
    body = <ActivityList label="Incident log" items={entries} formatTimestamp={formatUtc} />
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          Incident log
        </h2>
        <p className="text-sm text-muted-foreground">
          When each incident opened and resolved, newest first.
        </p>
      </header>
      <SearchFilterToolbar
        label="Search the incident log"
        searchLabel="Search incidents"
        searchPlaceholder="Title or service"
        value={value}
        onValueChange={setValue}
        views={[
          { id: 'all', label: 'All incidents', value: initialLogValue },
          {
            id: 'open',
            label: 'Open',
            value: { query: '', filters: { status: 'open' }, sort: 'newest' },
          },
          {
            id: 'resolved',
            label: 'Resolved',
            value: { query: '', filters: { status: 'resolved' }, sort: 'newest' },
          },
        ]}
        filters={[
          {
            id: 'service',
            label: 'Service',
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All services' },
              ...services.map((service) => ({ value: service.id, label: service.name })),
            ],
          },
          {
            id: 'status',
            label: 'Status',
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All statuses' },
              { value: 'open', label: 'Open' },
              { value: 'resolved', label: 'Resolved' },
            ],
          },
        ]}
        sortOptions={[
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' },
        ]}
        resultCount={entries.length}
        formatResultCount={(count) => `${String(count)} ${count === 1 ? 'event' : 'events'}`}
      />
      {body}
    </section>
  )
}

/**
 * An operations console: a service status board, an alert inbox, and an incident log, all read
 * from one list of services and incidents. The inbox and the log are derived from the incidents
 * the dashboard shows, and the refresh count and read state live here, so refreshing the board
 * moves the inbox clock and marking an alert read updates the sidebar badge.
 */
export function OperationsMonitoringTemplate() {
  const [view, setView] = useState<ViewId>('status')
  const [mock, setMock] = useState<MockState>('ready')
  const [refreshes, setRefreshes] = useState(0)
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(
    () => new Set(allIncidents.filter((i) => i.status === 'resolved').map((i) => i.id)),
  )

  const services = mock === 'quiet' ? healthyServices : allServices
  const incidents = mock === 'quiet' ? [] : allIncidents
  const checkedAt = checkedAtAfter(refreshes)
  const alerts = alertsFor(incidents, services, readIds)
  const unread = alerts.filter((alert) => !alert.read).length
  const retry = () => {
    setMock('ready')
  }

  const statusState: MonitoringDashboardState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: 'Mock: the status service did not respond.' }
        : { status: 'ready', services, incidents, checkedAt }

  const alertsState: NotificationCenterState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: 'Mock: the alert service did not respond.' }
        : { status: 'ready', items: alerts }

  return (
    <TemplateShell
      appName="Operations console"
      activeView={view}
      onViewChange={setView}
      views={[
        { id: 'status', label: 'Service status', icon: <Activity aria-hidden="true" /> },
        {
          id: 'alerts',
          label: 'Alerts',
          icon: <BellRing aria-hidden="true" />,
          ...(unread > 0
            ? { badge: { text: String(unread), label: `${String(unread)} unread` } }
            : {}),
        },
        { id: 'log', label: 'Incident log', icon: <ListChecks aria-hidden="true" /> },
      ]}
      controls={
        <div className="grid gap-3">
          <ExampleOnlyNotice>
            Nothing is being monitored: the services, readings, and incidents are invented.
          </ExampleOnlyNotice>
          <MockPicker legend="Mock state" options={mockStates} value={mock} onChange={setMock} />
        </div>
      }
    >
      {view === 'status' ? (
        <MonitoringDashboard
          state={statusState}
          onRetry={retry}
          onRefresh={async () => {
            await mockDelay(600)
            setRefreshes((count) => count + 1)
          }}
        />
      ) : null}
      {view === 'alerts' ? (
        <NotificationCenter
          title="Alerts"
          state={alertsState}
          asOf={checkedAt}
          onRetry={retry}
          typeLabels={{ assignment: 'Needs a response', system: 'Updates' }}
          onMarkRead={(id) => {
            setReadIds((current) => new Set(current).add(id))
          }}
          onMarkAllRead={() => {
            setReadIds(new Set(incidents.map((incident) => incident.id)))
          }}
        />
      ) : null}
      {view === 'log' ? (
        <IncidentLog mock={mock} incidents={incidents} services={services} onRetry={retry} />
      ) : null}
    </TemplateShell>
  )
}
