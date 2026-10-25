import type { ImplementedEntry } from '../types'

export const ordersDashboardEntry: ImplementedEntry = {
  id: 'orders-dashboard',
  slug: 'orders-dashboard',
  name: 'Orders dashboard',
  description:
    'An order operations view: metrics derived from the data, a filterable table with bulk actions, a responsive detail panel, notifications, and an activity feed.',
  kind: 'block',
  category: 'data-display',
  tags: ['composition', 'dashboard', 'pagination', 'responsive', 'selection', 'sorting', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/orders-dashboard.tsx',
    packages: ['lucide-react'],
    registryDependencies: [
      'activity-list',
      'confirm-action',
      'data-table',
      'data-toolbar',
      'detail-panel',
      'button',
      'card',
      'metric-card',
      'notification-item',
      'status-badge',
    ],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
    notes: [
      'The block keeps its data in memory; replace the reducer with your data layer to persist changes.',
      'Dates and money are formatted in en-US and UTC so the example output is stable; swap the formatters for your locale.',
    ],
  },
  guidelines: [
    'Every metric is calculated from the orders passed in, for the 7 days ending at asOf and the 7 days before. Nothing is fetched and the clock is never read, so the figures are reproducible.',
    'Search ignores case and accents, so “nguyen” finds “Nguyễn”. It matches the order number, customer name, and email.',
    'Changing the search or a filter returns to page 1 and drops selected rows that are no longer visible, so bulk actions never touch rows the user cannot see.',
    'Bulk and detail actions apply only to pending or processing orders. Unavailable actions stay focusable with aria-disabled and a description that explains why.',
    'Cancelling goes through Confirm action. Marking as shipped is applied immediately and recorded in the activity feed.',
    'Layout follows the container: metrics go from one column to two to four, and notifications and activity sit side by side when there is room. The detail panel is inline from 80rem viewports and a sheet below that.',
  ],
  api: {
    parts: [
      {
        name: 'OrdersDashboard',
        props: [
          {
            name: 'orders',
            type: 'readonly Order[]',
            required: true,
            description: 'Starting orders. Changes made in the dashboard stay in memory.',
          },
          {
            name: 'activity',
            type: 'readonly ActivityEntry[]',
            required: true,
            description: 'Starting activity feed, newest first.',
          },
          {
            name: 'notifications',
            type: 'readonly DashboardNotification[]',
            required: true,
            description: 'Starting notifications, newest first.',
          },
          {
            name: 'asOf',
            type: 'string',
            required: true,
            description: 'ISO 8601 end of the reporting window for the metrics.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer section.' },
        ],
      },
      {
        name: 'filterOrders',
        description: 'The pure filter the dashboard uses; exported for tests and server reuse.',
        props: [
          {
            name: 'orders',
            type: 'readonly Order[]',
            required: true,
            description: 'Orders to filter.',
          },
          {
            name: 'filters',
            type: "{ query: string; status: OrderStatus | 'all'; channel: OrderChannel | 'all' }",
            required: true,
            description: 'Every filter must match.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
