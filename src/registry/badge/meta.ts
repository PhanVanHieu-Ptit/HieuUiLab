import badgeSource from '@/components/ui/badge.tsx?raw'

import type { RegistryEntry } from '../types'
import { baseDependencies, demoExtractor, nativeProps } from '../utils'
import { BadgeSizesDemo, BadgeVariantsDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const badgeEntry: RegistryEntry = {
  slug: 'badge',
  name: 'Badge',
  description:
    'A compact, non-interactive label for status, counts, and metadata. Status variants use status tokens only.',
  category: 'component',
  status: 'stable',
  dependencies: [...baseDependencies],
  targetPath: 'components/ui/badge.tsx',
  source: badgeSource,
  demos: [
    {
      id: 'variants',
      title: 'Variants',
      description: 'Color is never the only signal: the text always names the status.',
      component: BadgeVariantsDemo,
      code: demoCode('BadgeVariantsDemo'),
    },
    { id: 'sizes', title: 'Sizes', component: BadgeSizesDemo, code: demoCode('BadgeSizesDemo') },
  ],
  props: [
    {
      name: 'variant',
      type: "'neutral' | 'primary' | 'outline' | 'success' | 'warning' | 'info' | 'destructive'",
      default: "'neutral'",
      description: 'Visual style.',
    },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Height and padding.' },
    nativeProps('span'),
  ],
}
