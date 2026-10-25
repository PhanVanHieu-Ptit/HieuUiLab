import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

export const metricCardEntry: ImplementedEntry = {
  id: 'metric-card',
  slug: 'metric-card',
  name: 'Metric card',
  description:
    'A labelled number on a Card, with an optional change that screen readers hear as a full sentence.',
  kind: 'component',
  category: 'data-display',
  tags: ['a11y', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/metric-card.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['card'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  guidelines: [
    'Format the value and change before passing them in; the card does not format numbers or currencies.',
    'Show only figures you can calculate from real data. A metric without a comparison period is better than an invented one.',
    'Set sentiment explicitly: whether "up" is good depends on the metric.',
    'Label and value form a description list (dt and dd), so a grid of cards reads as label–value pairs.',
  ],
  api: {
    parts: [
      {
        name: 'MetricCard',
        props: [
          { name: 'label', type: 'string', required: true, description: 'What is measured.' },
          {
            name: 'value',
            type: 'string',
            required: true,
            description: 'Preformatted value.',
          },
          {
            name: 'change',
            type: "{ value: string; direction: 'up' | 'down' | 'flat'; sentiment?: 'positive' | 'negative' | 'neutral'; period: string }",
            description: 'Change against a period, e.g. "the previous 7 days".',
          },
          { name: 'footnote', type: 'ReactNode', description: 'Supporting text.' },
          nativeProps('div'),
        ],
      },
    ],
  },
  content: () => import('./content'),
}
