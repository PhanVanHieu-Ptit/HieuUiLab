import activityListSource from '@/components/blocks/activity-list.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { ActivityListDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: activityListSource,
  examples: [
    {
      id: 'feed',
      title: 'Activity feed',
      description: 'Times are formatted in UTC here so the example reads the same everywhere.',
      component: ActivityListDemo,
      code: demoCode('ActivityListDemo'),
      preview: { layout: 'fill' },
    },
  ],
}
