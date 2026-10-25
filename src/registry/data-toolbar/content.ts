import dataToolbarSource from '@/components/blocks/data-toolbar.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { DataToolbarDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: dataToolbarSource,
  examples: [
    {
      id: 'filter-list',
      title: 'Filtering a list',
      description:
        'Type or pick a role: the count is announced politely, and Clear filters appears once anything is filtered.',
      component: DataToolbarDemo,
      code: demoCode('DataToolbarDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
}
