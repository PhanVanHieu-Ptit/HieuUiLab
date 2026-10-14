import skeletonSource from '@/components/ui/skeleton.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { SkeletonDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const skeletonEntry: ImplementedEntry = {
  id: 'skeleton',
  slug: 'skeleton',
  name: 'Skeleton',
  description:
    'A pulsing placeholder that reserves layout while content loads. Hidden from assistive tech; mark the region aria-busy instead.',
  kind: 'component',
  category: 'feedback',
  tags: ['loading'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/skeleton.tsx',
    packages: [],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: skeletonSource,
  examples: [
    {
      id: 'basic',
      title: 'Loading layout',
      component: SkeletonDemo,
      code: demoCode('SkeletonDemo'),
    },
  ],
  api: { parts: [{ name: 'Skeleton', props: [nativeProps('div')] }] },
}
