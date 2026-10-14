import { Badge } from '@/components/ui/badge'
import badgeSource from '@/components/ui/badge.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { BadgeSizesDemo, BadgeVariantsDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const badgeEntry: ImplementedEntry = {
  id: 'badge',
  slug: 'badge',
  name: 'Badge',
  description:
    'A compact, non-interactive label for status, counts, and metadata. Status variants use status tokens only.',
  kind: 'component',
  category: 'data-display',
  tags: ['status', 'variants'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/badge.tsx',
    packages: ['class-variance-authority'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: badgeSource,
  examples: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Color is never the only signal: the text always names the status.',
      component: BadgeVariantsDemo,
      code: demoCode('BadgeVariantsDemo'),
    },
    { id: 'sizes', title: 'Sizes', component: BadgeSizesDemo, code: demoCode('BadgeSizesDemo') },
  ],
  guidelines: [
    'Badges are static text, not buttons. For removable or clickable chips, use a Button.',
    'The text must name the status ("Failed", "3 new"); status colour alone carries no meaning for some readers.',
    'For counts announced to screen readers, include the noun in sr-only text, for example "3 unread messages".',
  ],
  api: {
    parts: [
      {
        name: 'Badge',
        props: [
          {
            name: 'variant',
            type: "'neutral' | 'primary' | 'outline' | 'success' | 'warning' | 'info' | 'destructive'",
            default: "'neutral'",
            description: 'Visual style.',
          },
          {
            name: 'size',
            type: "'sm' | 'md'",
            default: "'md'",
            description: 'Height and padding.',
          },
          nativeProps('span'),
        ],
      },
    ],
  },
  playground: definePlayground(Badge, {
    part: 'Badge',
    controls: [
      { kind: 'text', prop: 'children', label: 'Label', default: 'Beta' },
      {
        kind: 'select',
        prop: 'variant',
        options: ['neutral', 'primary', 'outline', 'success', 'warning', 'info', 'destructive'],
        default: 'neutral',
      },
      { kind: 'select', prop: 'size', options: ['sm', 'md'], default: 'md' },
    ],
  }),
}
