import { Badge } from '@/components/ui/badge'
import badgeSource from '@/components/ui/badge.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { BadgeSizesDemo, BadgeVariantsDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
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
