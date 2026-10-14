import skeletonSource from '@/components/ui/skeleton.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { SkeletonDemo, SkeletonListDemo } from './demos'
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
  guidelines: [
    'Skeletons are `aria-hidden`. Mark the loading region with `aria-busy` and give it a name or sr-only "Loading…" text, so screen readers know something is coming.',
    'Size placeholders like the content they stand in for, to avoid layout shift when it arrives.',
    'Under `prefers-reduced-motion` the pulse runs once and stops, leaving a static block.',
    'For waits shorter than about 300 ms, show nothing; for actions rather than content, use a Spinner or a loading Button.',
  ],
  api: { parts: [{ name: 'Skeleton', props: [nativeProps('div')] }] },
}
