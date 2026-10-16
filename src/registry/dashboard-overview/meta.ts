import dashboardOverviewSource from '@/components/blocks/dashboard-overview.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { DashboardOverviewDemo, DashboardOverviewStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const dashboardOverviewEntry: ImplementedEntry = {
  id: 'dashboard-overview',
  slug: 'dashboard-overview',
  name: 'Dashboard overview',
  description:
    'A summary page: metric cards with trend lines, a main chart with a data-table alternative, highlights, and recent activity, switchable between time ranges.',
  kind: 'block',
  category: 'pages',
  tags: ['a11y', 'charts', 'composition', 'dashboard', 'responsive', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/dashboard-overview.tsx',
    packages: ['lucide-react'],
    registryDependencies: [
      'activity-list',
      'empty-state',
      'error-state',
      'card',
      'metric-card',
      'skeleton',
      'sparkline',
      'status-badge',
      'table',
      'tabs',
    ],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
    notes: [
      'The block shows figures; it does not calculate them. Query and format your metrics, per range, and pass them in state.',
      'Dates are formatted in en-US and UTC so the output is stable; swap formatDateTime for your locale and time zone.',
    ],
  },
  source: dashboardOverviewSource,
  examples: [
    {
      id: 'overview',
      title: 'Workspace usage',
      description:
        'Example data, invented for this page: a made-up workspace with figures for two ranges. Nothing is fetched.',
      component: DashboardOverviewDemo,
      code: demoCode('DashboardOverviewDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'states',
      title: 'Loading, empty, and error',
      description:
        'Example only: pick a mock state to see each one. Retry in the error state returns to the data.',
      component: DashboardOverviewStatesDemo,
      code: demoCode('DashboardOverviewStatesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
  guidelines: [
    'Metrics arrive precomputed (value, change, trend) so the same layout fits any domain. For a page whose figures are derived from rows, see Orders dashboard.',
    'Every chart has a text alternative: a spoken label that states the takeaway, and a “View data as table” disclosure for the main trend. Sparklines have no scale, so each card also shows the figure.',
    'Whether a rise is good news is yours to say: set the change sentiment and the sparkline tone explicitly. The words (“Up 12.4% compared with…”) carry the meaning, not the color.',
    'The time range is uncontrolled by default; pass range and onRangeChange to control it, for example to keep it in the URL. A range with no entry in periods shows the empty state.',
    'Loading is announced with a status message and aria-busy. The error state is announced as an alert and offers retry when you pass onRetry.',
    'The grid follows the width of its container: one column on narrow frames, two from 32rem, four from 52rem. Highlights and activity sit side by side from 42rem.',
  ],
  api: {
    parts: [
      {
        name: 'DashboardOverview',
        props: [
          {
            name: 'state',
            type: 'DashboardOverviewState',
            required: true,
            description: 'What to show: loading, an error, or the ready data.',
          },
          {
            name: 'asOf',
            type: 'string',
            required: true,
            description:
              'ISO 8601 end of the reporting window, shown as “Data as of …”. The block never reads the clock.',
          },
          {
            name: 'title',
            type: 'string',
            default: "'Overview'",
            description: 'Heading of the page.',
          },
          {
            name: 'description',
            type: 'string',
            description: 'Text under the title, before “Data as of …”.',
          },
          {
            name: 'ranges',
            type: 'readonly { id: string; label: string }[]',
            default: "[{ id: '7d', label: 'Last 7 days' }, { id: '30d', label: 'Last 30 days' }]",
            description: 'The time ranges offered; each id is a key of periods.',
          },
          {
            name: 'range',
            type: 'string',
            description: 'Controlled range id. Pair with onRangeChange.',
          },
          {
            name: 'defaultRange',
            type: 'string',
            default: 'the first range',
            description: 'Initial range id when uncontrolled.',
          },
          {
            name: 'onRangeChange',
            type: '(range: string) => void',
            description: 'Called with the new range id when the tab changes.',
          },
          {
            name: 'highlightsTitle',
            type: 'string',
            default: "'Highlights'",
            description: 'Title of the ranked list.',
          },
          {
            name: 'activityTitle',
            type: 'string',
            default: "'Recent activity'",
            description: 'Title of the activity feed.',
          },
          {
            name: 'onRetry',
            type: '() => void',
            description: 'Shows a retry button in the error state.',
          },
          {
            name: 'actions',
            type: 'ReactNode',
            description: 'Buttons or links at the end of the header.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer section.' },
        ],
      },
      {
        name: 'DashboardOverviewState',
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
            name: 'periods',
            type: 'Readonly<Record<string, DashboardPeriod>>',
            description: 'With status "ready": data per range id.',
          },
          {
            name: 'activity',
            type: 'readonly ActivityEntry[]',
            description: 'With status "ready": newest first. Not tied to the range.',
          },
        ],
      },
      {
        name: 'DashboardPeriod',
        description: 'Everything shown for one range.',
        props: [
          {
            name: 'metrics',
            type: 'readonly DashboardMetric[]',
            required: true,
            description: 'Cards: label, preformatted value, optional change, and a trend.',
          },
          {
            name: 'trend',
            type: 'DashboardTrend',
            required: true,
            description: 'The main chart: name, spoken summary, and labelled points.',
          },
          {
            name: 'highlights',
            type: 'readonly DashboardHighlight[]',
            required: true,
            description: 'Ranked items with a figure and a status badge.',
          },
        ],
      },
      {
        name: 'DashboardMetric',
        description: 'One metric card.',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Stable unique id.' },
          { name: 'label', type: 'string', required: true, description: 'What is measured.' },
          {
            name: 'value',
            type: 'string',
            required: true,
            description: 'Preformatted value, e.g. "12,480".',
          },
          { name: 'change', type: 'MetricChange', description: 'Change against a period.' },
          {
            name: 'trend',
            type: 'readonly number[]',
            required: true,
            description: 'Values for the sparkline, oldest first.',
          },
          {
            name: 'trendLabel',
            type: 'string',
            required: true,
            description: 'Spoken summary of the sparkline.',
          },
          {
            name: 'tone',
            type: 'SparklineTone',
            default: "'primary'",
            description: 'Color of the sparkline.',
          },
        ],
      },
      {
        name: 'DashboardTrend',
        description: 'The main chart.',
        props: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'What the chart measures; also names the data table.',
          },
          {
            name: 'summary',
            type: 'string',
            required: true,
            description: 'Spoken summary with the takeaway.',
          },
          {
            name: 'points',
            type: 'readonly { label: string; value: number }[]',
            required: true,
            description: 'Oldest first. The first and last labels caption the chart.',
          },
        ],
      },
      {
        name: 'DashboardHighlight',
        description: 'One row of the ranked list.',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Stable unique id.' },
          { name: 'name', type: 'string', required: true, description: 'What is ranked.' },
          {
            name: 'figure',
            type: 'string',
            required: true,
            description: 'Preformatted figure, e.g. "1,204 visits".',
          },
          {
            name: 'status',
            type: '{ label: string; tone: StatusTone }',
            required: true,
            description: 'The status in words, with its tone.',
          },
        ],
      },
    ],
  },
}
