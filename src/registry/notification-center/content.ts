import notificationCenterSource from '@/components/blocks/notification-center.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { NotificationCenterDemo, NotificationCenterStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
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
}
