import dataTableSource from '@/components/blocks/data-table.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { DataTableDemo, DataTableSelectionDemo, DataTableStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: dataTableSource,
  examples: [
    {
      id: 'sorting-and-pagination',
      title: 'Sorting and pagination',
      description:
        'Sorted by finish time, newest first. Each sortable header cycles ascending, descending, then the original order. Rows with no value sort last.',
      component: DataTableDemo,
      code: demoCode('DataTableDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
    {
      id: 'states',
      title: 'States',
      description: 'Headers stay in place while loading, on error, and when there are no rows.',
      component: DataTableStatesDemo,
      code: demoCode('DataTableStatesDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
    {
      id: 'selection',
      title: 'Selection and bulk action',
      description:
        'The header checkbox selects the rows on the current page. Selection is kept while paging, and archiving goes through a confirmation.',
      component: DataTableSelectionDemo,
      code: demoCode('DataTableSelectionDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
}
