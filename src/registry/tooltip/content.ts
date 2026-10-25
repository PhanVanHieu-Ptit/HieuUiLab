import tooltipSource from '@/components/ui/tooltip.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { TooltipSidesDemo, TooltipToolbarDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: tooltipSource,
  examples: [
    {
      id: 'toolbar',
      title: 'Icon toolbar',
      description:
        'One provider shares the delay: after the first tooltip opens, moving along the toolbar opens the next at once. Each button still has its own aria-label.',
      component: TooltipToolbarDemo,
      code: demoCode('TooltipToolbarDemo'),
    },
    {
      id: 'sides',
      title: 'Placement',
      description:
        'Without a provider each tooltip creates its own. Placement flips to stay on screen.',
      component: TooltipSidesDemo,
      code: demoCode('TooltipSidesDemo'),
    },
  ],
}
