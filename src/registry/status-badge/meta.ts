import { StatusBadge } from '@/components/ui/status-badge'
import statusBadgeSource from '@/components/ui/status-badge.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { StatusBadgeDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const statusBadgeEntry: ImplementedEntry = {
  id: 'status-badge',
  slug: 'status-badge',
  name: 'Status badge',
  description:
    'A Badge for the state of a record, with a tone and a decorative dot. The status is always written out.',
  kind: 'component',
  category: 'data-display',
  tags: ['status', 'variants'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/status-badge.tsx',
    packages: [],
    registryDependencies: ['badge'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: statusBadgeSource,
  examples: [
    {
      id: 'tones',
      title: 'Tones',
      description: 'Each invoice status maps to one tone, defined once.',
      component: StatusBadgeDemo,
      code: demoCode('StatusBadgeDemo'),
    },
  ],
  guidelines: [
    'Keep one map from your domain statuses to tones and labels, and use it everywhere the status appears.',
    'The label is required and is what assistive tech reads; the dot and color only reinforce it.',
    'Use danger for terminal failures (failed, void, cancelled) and warning for states that need attention soon.',
  ],
  api: {
    parts: [
      {
        name: 'StatusBadge',
        props: [
          {
            name: 'tone',
            type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'",
            default: "'neutral'",
            description: 'Color of the badge and dot.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            required: true,
            description: 'The status in words.',
          },
          {
            name: 'size',
            type: "'sm' | 'md'",
            default: "'md'",
            description: 'Badge size.',
          },
          nativeProps('span'),
        ],
      },
    ],
  },
  playground: definePlayground(StatusBadge, {
    part: 'StatusBadge',
    controls: [
      { kind: 'text', prop: 'children', label: 'Status', default: 'Shipped' },
      {
        kind: 'select',
        prop: 'tone',
        options: ['neutral', 'info', 'success', 'warning', 'danger'],
        default: 'neutral',
      },
      { kind: 'select', prop: 'size', options: ['sm', 'md'], default: 'md' },
    ],
  }),
}
