import searchFilterToolbarSource from '@/components/blocks/search-filter-toolbar.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SearchFilterToolbarDemo, SearchFilterToolbarViewsDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: searchFilterToolbarSource,
  examples: [
    {
      id: 'toolbar',
      title: 'Search, filters, and sort',
      description:
        'Example data, invented for this page: twelve items held in memory, filtered by the demo itself.',
      component: SearchFilterToolbarDemo,
      code: demoCode('SearchFilterToolbarDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'views',
      title: 'Saved views and active filters',
      description:
        'Example data, invented for this page. A view applies a whole set of criteria at once; each active one gets a chip you can remove.',
      component: SearchFilterToolbarViewsDemo,
      code: demoCode('SearchFilterToolbarViewsDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
}
