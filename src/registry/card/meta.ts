import cardSource from '@/components/ui/card.tsx?raw'

import type { RegistryEntry } from '../types'
import { baseDependencies, demoExtractor, nativeProps } from '../utils'
import { CardBasicDemo, CardInteractiveDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const cardEntry: RegistryEntry = {
  slug: 'card',
  name: 'Card',
  description:
    'A bordered surface for grouped content, with header, title, description, content, and footer parts and a whole-card link variant.',
  category: 'component',
  status: 'stable',
  dependencies: [...baseDependencies, 'radix-ui'],
  targetPath: 'components/ui/card.tsx',
  source: cardSource,
  demos: [
    { id: 'basic', title: 'Basic', component: CardBasicDemo, code: demoCode('CardBasicDemo') },
    {
      id: 'interactive',
      title: 'Interactive and dashed',
      description:
        'CardLink stretches its hit area over the card; the focus ring is drawn on the card.',
      component: CardInteractiveDemo,
      code: demoCode('CardInteractiveDemo'),
    },
  ],
  props: [
    {
      name: 'variant',
      type: "'default' | 'interactive' | 'dashed'",
      default: "'default'",
      description: 'Card: interactive adds hover and focus states for use with CardLink.',
    },
    {
      name: 'as',
      type: "'h2' | 'h3' | 'h4' | 'p'",
      default: "'h3'",
      description: 'CardTitle: heading level that fits the page outline.',
    },
    {
      name: 'asChild',
      type: 'boolean',
      default: 'false',
      description: 'CardLink: merge onto a child such as a router Link.',
    },
    nativeProps('div'),
  ],
}
