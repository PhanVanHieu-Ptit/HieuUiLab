import skeletonSource from '@/components/ui/skeleton.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SkeletonDemo, SkeletonListDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: skeletonSource,
  examples: [
    {
      id: 'basic',
      title: 'Loading layout',
      description:
        'The wrapper is a named status with aria-busy; the blocks themselves are hidden.',
      component: SkeletonDemo,
      code: demoCode('SkeletonDemo'),
    },
    {
      id: 'list',
      title: 'Loading, then content',
      description:
        'Placeholders match the size of the content that replaces them, so nothing shifts. Reload to see it again.',
      component: SkeletonListDemo,
      code: demoCode('SkeletonListDemo'),
    },
  ],
}
