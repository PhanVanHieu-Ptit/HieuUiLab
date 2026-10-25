import paginationSource from '@/components/ui/pagination.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { PaginationDemo, PaginationFewPagesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: paginationSource,
  examples: [
    {
      id: 'many-pages',
      title: 'Many pages',
      description:
        'The first and last page are always shown, with one page either side of the current one.',
      component: PaginationDemo,
      code: demoCode('PaginationDemo'),
    },
    {
      id: 'few-pages',
      title: 'Few pages',
      description: 'With seven pages or fewer, every page is shown.',
      component: PaginationFewPagesDemo,
      code: demoCode('PaginationFewPagesDemo'),
    },
  ],
}
