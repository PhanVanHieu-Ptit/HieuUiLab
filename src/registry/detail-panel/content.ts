import detailPanelSource from '@/components/blocks/detail-panel.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { DetailPanelDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: detailPanelSource,
  examples: [
    {
      id: 'tickets',
      title: 'List with details',
      description:
        'From a 64rem viewport the panel opens beside the list; below that it is a sheet. Resize the window while it is open to see it switch.',
      component: DetailPanelDemo,
      code: demoCode('DetailPanelDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
}
