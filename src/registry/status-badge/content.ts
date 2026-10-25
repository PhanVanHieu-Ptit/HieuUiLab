import { StatusBadge } from '@/components/ui/status-badge'
import statusBadgeSource from '@/components/ui/status-badge.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { StatusBadgeDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
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
