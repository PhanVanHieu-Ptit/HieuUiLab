import separatorSource from '@/components/ui/separator.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SeparatorDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: separatorSource,
  examples: [
    {
      id: 'orientation',
      title: 'Orientation',
      component: SeparatorDemo,
      code: demoCode('SeparatorDemo'),
    },
  ],
}
