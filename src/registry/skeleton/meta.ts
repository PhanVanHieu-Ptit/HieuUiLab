import skeletonSource from '@/components/ui/skeleton.tsx?raw'

import type { RegistryEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { SkeletonDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const skeletonEntry: RegistryEntry = {
  slug: 'skeleton',
  name: 'Skeleton',
  description:
    'A pulsing placeholder that reserves layout while content loads. Hidden from assistive tech; mark the region aria-busy instead.',
  category: 'component',
  status: 'stable',
  dependencies: ['clsx', 'tailwind-merge'],
  targetPath: 'components/ui/skeleton.tsx',
  source: skeletonSource,
  demos: [
    {
      id: 'basic',
      title: 'Loading layout',
      component: SkeletonDemo,
      code: demoCode('SkeletonDemo'),
    },
  ],
  props: [nativeProps('div')],
}
