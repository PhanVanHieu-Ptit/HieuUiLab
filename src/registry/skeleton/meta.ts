import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

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
  guidelines: [
    'Skeletons are `aria-hidden`. Mark the loading region with `aria-busy` and give it a name or sr-only "Loading…" text, so screen readers know something is coming.',
    'Size placeholders like the content they stand in for, to avoid layout shift when it arrives.',
    'Under `prefers-reduced-motion` the pulse runs once and stops, leaving a static block.',
    'For waits shorter than about 300 ms, show nothing; for actions rather than content, use a Spinner or a loading Button.',
  ],
  api: { parts: [{ name: 'Skeleton', props: [nativeProps('div')] }] },
  content: () => import('./content'),
}
