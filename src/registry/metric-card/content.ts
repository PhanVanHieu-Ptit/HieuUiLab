import metricCardSource from '@/components/ui/metric-card.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { MetricCardDemo, MetricCardPlainDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: metricCardSource,
  examples: [
    {
      id: 'with-change',
      title: 'With change',
      description:
        'Sentiment decides the color: fewer failed deploys would be positive even though the arrow points down.',
      component: MetricCardDemo,
      code: demoCode('MetricCardDemo'),
      preview: { layout: 'fill' },
    },
    {
      id: 'plain',
      title: 'Value only',
      component: MetricCardPlainDemo,
      code: demoCode('MetricCardPlainDemo'),
    },
  ],
}
