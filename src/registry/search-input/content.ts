import searchInputSource from '@/components/ui/search-input.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SearchInputDemo, SearchInputSizesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: searchInputSource,
  examples: [
    {
      id: 'clear',
      title: 'Controlled with clear',
      description: 'Clear with the button or Escape; the match count is a polite status.',
      component: SearchInputDemo,
      code: demoCode('SearchInputDemo'),
    },
    {
      id: 'sizes',
      title: 'Sizes and disabled',
      component: SearchInputSizesDemo,
      code: demoCode('SearchInputSizesDemo'),
    },
  ],
}
