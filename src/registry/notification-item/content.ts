import notificationItemSource from '@/components/ui/notification-item.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { NotificationItemDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
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
}
