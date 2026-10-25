import emptyStateSource from '@/components/blocks/empty-state.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { EmptyStateDemo, EmptyStateSearchDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: emptyStateSource,
  examples: [
    {
      id: 'first-run',
      title: 'First run',
      description: 'Explain what belongs here and offer the next step.',
      component: EmptyStateDemo,
      code: demoCode('EmptyStateDemo'),
      preview: { layout: 'fill' },
    },
    {
      id: 'no-results',
      title: 'No results',
      component: EmptyStateSearchDemo,
      code: demoCode('EmptyStateSearchDemo'),
      preview: { layout: 'fill' },
    },
  ],
}
