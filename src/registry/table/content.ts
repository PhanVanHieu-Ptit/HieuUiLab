import tableSource from '@/components/ui/table.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { TableDemo, TableStaticDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: tableSource,
  examples: [
    {
      id: 'sortable-headers',
      title: 'Sortable headers',
      description:
        'Tab to a header and press Enter or Space. Only the sorted column carries aria-sort.',
      component: TableDemo,
      code: demoCode('TableDemo'),
      preview: { layout: 'fill' },
    },
    {
      id: 'static',
      title: 'Static table',
      description: 'A visually hidden caption still names the table.',
      component: TableStaticDemo,
      code: demoCode('TableStaticDemo'),
      preview: { layout: 'fill' },
    },
  ],
}
