import tabsSource from '@/components/ui/tabs.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { TabsControlledDemo, TabsLineDemo, TabsPillDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: tabsSource,
  examples: [
    {
      id: 'line',
      title: 'Line',
      description: 'Disabled tabs are skipped by keyboard navigation.',
      component: TabsLineDemo,
      code: demoCode('TabsLineDemo'),
    },
    { id: 'pill', title: 'Pill', component: TabsPillDemo, code: demoCode('TabsPillDemo') },
    {
      id: 'controlled',
      title: 'Controlled',
      description: 'The selected tab is state the Back and Next buttons also change.',
      component: TabsControlledDemo,
      code: demoCode('TabsControlledDemo'),
    },
  ],
}
