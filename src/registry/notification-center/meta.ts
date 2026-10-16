import notificationCenterSource from '@/components/blocks/notification-center.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { NotificationCenterDemo, NotificationCenterStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const notificationCenterEntry: ImplementedEntry = {
  id: 'notification-center',
  slug: 'notification-center',
  name: 'Notification center',
  description:
    'An inbox panel with All and Unread tabs, a type filter, mark-as-read actions, and its own loading, empty, and error states.',
  kind: 'block',
  category: 'pages',
  tags: ['a11y', 'async', 'composition', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/notification-center.tsx',
    packages: ['lucide-react'],
    registryDependencies: [
      'empty-state',
      'error-state',
      'badge',
      'button',
      'notification-item',
      'select',
      'skeleton',
      'tabs',
    ],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
    notes: [
      'The block holds no notification data: keep the items in your state (or query cache) and update them in onMarkRead and onMarkAllRead.',
      'Relative times are measured from asOf and short dates are formatted in en-US and UTC, so the output is stable; swap the formatter for your locale.',
    ],
  },
  source: notificationCenterSource,
  examples: [
    {
      id: 'inbox',
      title: 'Inbox',
      description:
        'Example data, invented for this page: 8 notifications held in memory. Changes reset when the page reloads.',
      component: NotificationCenterDemo,
      code: demoCode('NotificationCenterDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'states',
      title: 'Loading, empty, and error',
      description:
        'Example only: pick a mock state to see each one. Retry in the error state returns to the inbox.',
      component: NotificationCenterStatesDemo,
      code: demoCode('NotificationCenterStatesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
  guidelines: [
    'The block is controlled. It never changes a notification itself: update the item in onMarkRead and onMarkAllRead, and pass the new items back in state.',
    'Mark all as read stays focusable and uses aria-disabled while nothing is unread, with a description that says why, instead of disabling it.',
    'The unread count is announced from a status region, not from color or the badge alone. Unread items also carry the visually hidden text “Unread”.',
    'Marking an item read moves focus to the next unread item (or to the panel when none is left), so keyboard users do not lose their place when the button disappears.',
    'Loading is announced with a status message and aria-busy on the panel. The error state is announced as an alert and offers retry when you pass onRetry.',
    'The layout follows the width of its container, not the window, so it works in a sidebar or a narrow column.',
  ],
  api: {
    parts: [
      {
        name: 'NotificationCenter',
        props: [
          {
            name: 'state',
            type: 'NotificationCenterState',
            required: true,
            description: 'What to show: loading, an error, or the ready items.',
          },
          {
            name: 'asOf',
            type: 'string',
            required: true,
            description:
              'ISO 8601 “now” for relative times such as “2 hours ago”. The block never reads the clock.',
          },
          {
            name: 'onMarkRead',
            type: '(id: string) => void',
            required: true,
            description: 'Called with the notification’s id. Update the item in your state.',
          },
          {
            name: 'onMarkAllRead',
            type: '() => void',
            required: true,
            description: 'Called when Mark all as read is pressed while something is unread.',
          },
          {
            name: 'onRetry',
            type: '() => void',
            description: 'Shows a retry button in the error state.',
          },
          {
            name: 'title',
            type: 'string',
            default: "'Notifications'",
            description: 'Heading of the panel; also names the list.',
          },
          {
            name: 'typeLabels',
            type: 'Partial<Record<NotificationType, string>>',
            default:
              "{ mention: 'Mentions', assignment: 'Assignments', system: 'System', security: 'Security' }",
            description: 'Names for the types in the filter, for example to translate them.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer section.' },
        ],
      },
      {
        name: 'NotificationEntry',
        description: 'One notification.',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Stable unique id.' },
          {
            name: 'type',
            type: "'mention' | 'assignment' | 'system' | 'security'",
            required: true,
            description: 'Picks the icon and the type filter group.',
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'Plain text; it also names the mark-as-read button.',
          },
          { name: 'description', type: 'string', description: 'Supporting text.' },
          {
            name: 'timestamp',
            type: 'string',
            required: true,
            description: 'ISO 8601 timestamp.',
          },
          { name: 'read', type: 'boolean', required: true, description: 'Whether it was read.' },
        ],
      },
      {
        name: 'NotificationCenterState',
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
            name: 'items',
            type: 'readonly NotificationEntry[]',
            description: 'With status "ready": the notifications, newest first. Empty is valid.',
          },
        ],
      },
    ],
  },
}
