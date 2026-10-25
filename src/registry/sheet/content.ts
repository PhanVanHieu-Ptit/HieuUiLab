import sheetSource from '@/components/ui/sheet.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SheetDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: sheetSource,
  examples: [
    {
      id: 'sides',
      title: 'Sides',
      description: 'The site uses the left sheet for mobile navigation.',
      component: SheetDemo,
      code: demoCode('SheetDemo'),
    },
  ],
}
