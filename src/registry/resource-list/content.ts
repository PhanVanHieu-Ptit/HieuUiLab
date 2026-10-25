import resourceListSource from '@/components/blocks/resource-list.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { ResourceListDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: resourceListSource,
  examples: [
    {
      id: 'states',
      title: 'States',
      description: 'Switch between the four states. The error state retries into the ready state.',
      component: ResourceListDemo,
      code: demoCode('ResourceListDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
}
