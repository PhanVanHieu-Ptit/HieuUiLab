import errorStateSource from '@/components/blocks/error-state.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { ErrorStateDemo, ErrorStatePlainDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: errorStateSource,
  examples: [
    {
      id: 'retry',
      title: 'With retry',
      description: 'The retry comes first; other actions follow it.',
      component: ErrorStateDemo,
      code: demoCode('ErrorStateDemo'),
    },
    {
      id: 'no-retry',
      title: 'Without retry',
      description: 'When retrying cannot help, explain what the user can do instead.',
      component: ErrorStatePlainDemo,
      code: demoCode('ErrorStatePlainDemo'),
    },
  ],
}
