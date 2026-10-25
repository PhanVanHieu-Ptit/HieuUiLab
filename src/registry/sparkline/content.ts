import sparklineSource from '@/components/ui/sparkline.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SparklineDemo, SparklineTonesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: sparklineSource,
  examples: [
    {
      id: 'basic',
      title: 'Next to a figure',
      description: 'Example values, invented for this page.',
      component: SparklineDemo,
      code: demoCode('SparklineDemo'),
      preview: { layout: 'fill' },
    },
    {
      id: 'tones',
      title: 'Tones and area',
      description:
        'The tone only sets the color. Whether a rise is good news is up to the surrounding text.',
      component: SparklineTonesDemo,
      code: demoCode('SparklineTonesDemo'),
      preview: { layout: 'fill' },
    },
  ],
}
