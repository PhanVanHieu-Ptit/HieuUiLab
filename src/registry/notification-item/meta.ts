import notificationItemSource from '@/components/ui/notification-item.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { NotificationItemDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const notificationItemEntry: ImplementedEntry = {
  id: 'notification-item',
  slug: 'notification-item',
  name: 'Notification item',
  description:
    'One notification as an article named by its title, with a read state that is spoken as well as shown and a mark-as-read action.',
  kind: 'component',
  category: 'feedback',
  tags: ['a11y', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/notification-item.tsx',
    packages: [],
    registryDependencies: ['button'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: notificationItemSource,
  examples: [
    {
      id: 'list',
      title: 'Notification list',
      description: 'Marking one as read removes its dot, its highlight, and its button.',
      component: NotificationItemDemo,
      code: demoCode('NotificationItemDemo'),
      preview: { layout: 'fill' },
    },
  ],
  guidelines: [
    'Render items inside a labelled ul; each item is an article named by its title.',
    'Format the time yourself and pass the ISO timestamp too; it is rendered as time dateTime.',
    'Unread items start with visually hidden “Unread:” text, so the state is not conveyed by the dot or color alone.',
    'The mark-as-read button is named “Mark as read: <title>”, so each one is distinguishable in a list of buttons.',
  ],
  api: {
    parts: [
      {
        name: 'NotificationItem',
        props: [
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'Names the article and its button.',
          },
          { name: 'description', type: 'ReactNode', description: 'Supporting text.' },
          {
            name: 'timestamp',
            type: 'string',
            required: true,
            description: 'ISO 8601 time.',
          },
          {
            name: 'timeLabel',
            type: 'string',
            required: true,
            description: 'Formatted time shown to the reader.',
          },
          {
            name: 'read',
            type: 'boolean',
            required: true,
            description: 'Controlled read state.',
          },
          {
            name: 'onMarkRead',
            type: '() => void',
            description: 'Shows a mark-as-read button while unread.',
          },
          { name: 'icon', type: 'ReactNode', description: 'Decorative icon.' },
          nativeProps('article'),
        ],
      },
    ],
  },
}
