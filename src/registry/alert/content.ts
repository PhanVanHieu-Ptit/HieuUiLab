import alertSource from '@/components/ui/alert.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { AlertLiveDemo, AlertVariantsDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: alertSource,
  examples: [
    {
      id: 'variants',
      title: 'Variants',
      description:
        'Static messages present on load use role="none" so they are not announced. Titles name the status in words.',
      component: AlertVariantsDemo,
      code: demoCode('AlertVariantsDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
    {
      id: 'live',
      title: 'Result of an action',
      description:
        'Rendered after a click, the default roles announce the message: polite for success, immediate for errors.',
      component: AlertLiveDemo,
      code: demoCode('AlertLiveDemo'),
      preview: { layout: 'fill', height: 'md' },
    },
  ],
}
