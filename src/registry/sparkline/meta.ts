import sparklineSource from '@/components/ui/sparkline.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { SparklineDemo, SparklineTonesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const sparklineEntry: ImplementedEntry = {
  id: 'sparkline',
  slug: 'sparkline',
  name: 'Sparkline',
  description:
    'A small axis-less line chart for a trend next to a number, drawn in an SVG with a spoken summary.',
  kind: 'component',
  category: 'data-display',
  tags: ['a11y', 'charts'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/sparkline.tsx',
    packages: [],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
    notes: [
      'It draws with currentColor and the status text tokens, so it needs no chart palette and follows light and dark mode.',
    ],
  },
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
  guidelines: [
    'A sparkline has no scale, so always show the numbers it summarises (the latest value, or low and high) as text beside it.',
    'Give it a label that states the takeaway, such as “p95 latency, last 24 hours: low 82 ms, high 190 ms”. Without a label the chart is hidden from assistive technology.',
    'Color is never the only signal: pair a warning or destructive tone with words such as “degraded”.',
    'Values are scaled to their own range, so two sparklines are not comparable by height. A flat or single-value series is drawn as a level line.',
    'It stretches to its container’s width. Set the height with a class, for example h-12.',
  ],
  api: {
    parts: [
      {
        name: 'Sparkline',
        props: [
          {
            name: 'values',
            type: 'readonly number[]',
            required: true,
            description: 'Values in order, oldest first. Non-finite numbers are ignored.',
          },
          {
            name: 'label',
            type: 'string',
            description: 'Spoken summary; sets role="img". Without it the chart is aria-hidden.',
          },
          {
            name: 'tone',
            type: "'primary' | 'success' | 'warning' | 'destructive' | 'muted'",
            default: "'primary'",
            description: 'Color of the line, from the status text tokens.',
          },
          {
            name: 'area',
            type: 'boolean',
            default: 'false',
            description: 'Fill the area under the line.',
          },
          nativeProps('svg'),
        ],
      },
      {
        name: 'sparklinePath',
        description:
          'The pure path builder the chart uses; exported for tests and server rendering.',
        props: [
          {
            name: 'values',
            type: 'readonly number[]',
            required: true,
            description: 'The series. Empty or all non-finite gives empty paths.',
          },
          { name: 'width', type: 'number', required: true, description: 'Width of the box.' },
          { name: 'height', type: 'number', required: true, description: 'Height of the box.' },
          {
            name: 'inset',
            type: 'number',
            default: '2',
            description: 'Space kept above and below the line so the stroke is not clipped.',
          },
        ],
      },
    ],
  },
}
