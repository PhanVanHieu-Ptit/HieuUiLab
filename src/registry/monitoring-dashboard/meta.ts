import monitoringDashboardSource from '@/components/blocks/monitoring-dashboard.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { MonitoringDashboardDemo, MonitoringDashboardStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const monitoringDashboardEntry: ImplementedEntry = {
  id: 'monitoring-dashboard',
  slug: 'monitoring-dashboard',
  name: 'Monitoring dashboard',
  description:
    'A service status page: summary figures, a health card with a latency sparkline per service, an incident list, a manual refresh, and loading, empty, and error states.',
  kind: 'block',
  category: 'pages',
  tags: ['a11y', 'async', 'charts', 'composition', 'dashboard', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/monitoring-dashboard.tsx',
    packages: ['lucide-react'],
    registryDependencies: [
      'empty-state',
      'error-state',
      'button',
      'card',
      'label',
      'metric-card',
      'skeleton',
      'sparkline',
      'status-badge',
      'switch',
      'tabs',
    ],
    requirements: ['cn-helper', 'design-tokens'],
    notes: [
      'The block monitors nothing and polls nothing. Fetch status in your data layer (on an interval, from a stream, or on demand) and pass it in state; onRefresh is only the button.',
      'Dates are formatted in en-US and UTC so the output is stable; swap formatDateTime for your locale and time zone.',
    ],
  },
  source: monitoringDashboardSource,
  examples: [
    {
      id: 'status-board',
      title: 'Status board',
      description:
        'Example data, invented for this page: six services and four incidents. Refresh waits briefly and moves the “checked at” time on by a minute; no system is checked.',
      component: MonitoringDashboardDemo,
      code: demoCode('MonitoringDashboardDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'states',
      title: 'Quiet, empty, loading, and error',
      description:
        'Example only: pick a mock state, including a refresh that fails. Retry in the error state returns to the board.',
      component: MonitoringDashboardStatesDemo,
      code: demoCode('MonitoringDashboardStatesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
  guidelines: [
    'Status is never shown by color alone: every service has a badge with the state in words, and every sparkline is paired with the latest figure and a spoken label that gives the low, high, and latest values.',
    'The summary figures come from the exported summarizeServices, so the same numbers are available to tests, alerts, and server code.',
    'Refresh shows a busy button while onRefresh runs. If it rejects, the last results stay on screen with an alert saying so; report your own errors through state.',
    'There are no timers in the block. “Checked at” is whatever checkedAt you pass, so the page never claims to be fresher than your data.',
    'Open incidents are listed first, then resolved ones, each newest first. Incidents are not filtered by range: pass the ones you want to show.',
    '“Only services with issues” keeps its setting when the range changes, and says so when nothing matches instead of showing an empty grid.',
  ],
  api: {
    parts: [
      {
        name: 'MonitoringDashboard',
        props: [
          {
            name: 'state',
            type: 'MonitoringDashboardState',
            required: true,
            description: 'What to show: loading, an error, or the services and incidents.',
          },
          {
            name: 'onRefresh',
            type: '() => void | Promise<void>',
            description:
              'Shows a Refresh button. Re-check in your data layer and pass the new state; a rejection shows an alert.',
          },
          {
            name: 'onRetry',
            type: '() => void',
            description: 'Shows a retry button in the error state.',
          },
          {
            name: 'ranges',
            type: 'readonly { id: string; label: string }[]',
            default: "[{ id: '24h', label: 'Last 24 hours' }, { id: '7d', label: 'Last 7 days' }]",
            description: 'The time ranges offered; each id is a key of a service’s readings.',
          },
          {
            name: 'defaultRange',
            type: 'string',
            default: 'the first range',
            description: 'Initial range id.',
          },
          {
            name: 'onRangeChange',
            type: '(range: string) => void',
            description: 'Called with the new range id when the tab changes.',
          },
          {
            name: 'title',
            type: 'string',
            default: "'System status'",
            description: 'Heading of the page.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer section.' },
        ],
      },
      {
        name: 'summarizeServices',
        description:
          'The pure calculation behind the summary cards; exported for tests and servers.',
        props: [
          {
            name: 'services',
            type: 'readonly MonitoredService[]',
            required: true,
            description: 'The monitored services.',
          },
          {
            name: 'incidents',
            type: 'readonly Incident[]',
            required: true,
            description: 'Counted as open unless their status is resolved.',
          },
          {
            name: 'range',
            type: 'string',
            required: true,
            description: 'Range id whose readings are used.',
          },
        ],
      },
      {
        name: 'MonitoringDashboardState',
        description: 'One of three shapes, told apart by status.',
        props: [
          {
            name: 'status',
            type: "'loading' | 'error' | 'ready'",
            required: true,
            description: 'Which shape this is.',
          },
          {
            name: 'message',
            type: 'string',
            description: 'With status "error": what went wrong. Replaces the default text.',
          },
          {
            name: 'services',
            type: 'readonly MonitoredService[]',
            description: 'With status "ready": the services. Empty shows the empty state.',
          },
          {
            name: 'incidents',
            type: 'readonly Incident[]',
            description: 'With status "ready": the incidents to list.',
          },
          {
            name: 'checkedAt',
            type: 'string',
            description: 'With status "ready": ISO 8601 time of the last check.',
          },
        ],
      },
      {
        name: 'MonitoredService',
        description: 'One service.',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Stable unique id.' },
          { name: 'name', type: 'string', required: true, description: 'Display name.' },
          {
            name: 'status',
            type: "'operational' | 'degraded' | 'outage' | 'maintenance'",
            required: true,
            description: 'The service’s state now.',
          },
          {
            name: 'readings',
            type: 'Readonly<Record<string, ServiceReading>>',
            required: true,
            description: 'Latency samples (ms, oldest first) and uptime percentage per range id.',
          },
        ],
      },
      {
        name: 'Incident',
        description: 'One incident.',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Stable unique id.' },
          { name: 'title', type: 'string', required: true, description: 'What happened.' },
          {
            name: 'serviceId',
            type: 'string',
            required: true,
            description: 'Id of the affected service.',
          },
          {
            name: 'severity',
            type: "'minor' | 'major' | 'critical'",
            required: true,
            description: 'How serious it is.',
          },
          {
            name: 'status',
            type: "'investigating' | 'identified' | 'monitoring' | 'resolved'",
            required: true,
            description: 'Where it stands.',
          },
          {
            name: 'startedAt',
            type: 'string',
            required: true,
            description: 'ISO 8601 timestamp.',
          },
          {
            name: 'resolvedAt',
            type: 'string',
            description: 'ISO 8601 timestamp, once resolved.',
          },
        ],
      },
    ],
  },
}
