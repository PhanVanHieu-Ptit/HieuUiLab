import searchFilterFormSource from '@/components/blocks/search-filter-form.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SearchFilterFormDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: searchFilterFormSource,
  examples: [
    {
      id: 'orders',
      title: 'Filter orders',
      description:
        'Example only: searches eight sample orders in memory. Try an end date before the start date, or no statuses.',
      component: SearchFilterFormDemo,
      code: demoCode('SearchFilterFormDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
}
