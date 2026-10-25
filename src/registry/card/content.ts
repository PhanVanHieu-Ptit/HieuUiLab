import cardSource from '@/components/ui/card.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { CardBasicDemo, CardInteractiveDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: cardSource,
  examples: [
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
}
