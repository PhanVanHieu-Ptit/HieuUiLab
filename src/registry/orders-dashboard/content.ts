import ordersDashboardSource from '@/components/blocks/orders-dashboard.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { OrdersDashboardDemo, OrdersDashboardEmptyDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: ordersDashboardSource,
  examples: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Example data, held in memory: 64 orders, 8 activity entries, and 5 notifications. Changes reset when the page reloads.',
      component: OrdersDashboardDemo,
      code: demoCode('OrdersDashboardDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
    {
      id: 'empty',
      title: 'No data',
      description: 'Every section has its own empty state.',
      component: OrdersDashboardEmptyDemo,
      code: demoCode('OrdersDashboardEmptyDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
}
