import activityListSource from '@/components/blocks/activity-list.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { ActivityListDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const activityListEntry: ImplementedEntry = {
  id: 'activity-list',
  slug: 'activity-list',
  name: 'Activity list',
  description:
    'A chronological feed as an ordered list: who did what to what, with a machine-readable time.',
  kind: 'block',
  category: 'data-display',
  tags: ['a11y', 'composition'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/activity-list.tsx',
    packages: [],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: activityListSource,
  examples: [
    {
      id: 'feed',
      title: 'Activity feed',
      description: 'Times are formatted in UTC here so the example reads the same everywhere.',
      component: ActivityListDemo,
      code: demoCode('ActivityListDemo'),
      preview: { layout: 'fill' },
    },
  ],
  guidelines: [
    'Pass entries newest first; the list keeps the order you give it.',
    'Write action as a verb phrase so each entry reads as one sentence: “Mai Tran deployed web to production”.',
    'Pass formatTimestamp to control locale and time zone. Without it, the reader’s own locale and time zone are used.',
    'The list does not show relative times (“5 minutes ago”), which would need a clock and periodic re-rendering.',
  ],
  api: {
    parts: [
      {
        name: 'ActivityList',
        props: [
          {
            name: 'label',
            type: 'string',
            required: true,
            description: 'Accessible name of the list.',
          },
          {
            name: 'items',
            type: 'readonly { id; actor; action; target?; timestamp; icon? }[]',
            required: true,
            description: 'Entries, newest first.',
          },
          {
            name: 'formatTimestamp',
            type: '(iso: string) => string',
            description: 'Formats each time. Defaults to the reader’s locale.',
          },
          {
            name: 'emptyMessage',
            type: 'ReactNode',
            default: "'No activity yet.'",
            description: 'Shown when there are no entries.',
          },
          nativeProps('ol'),
        ],
      },
    ],
  },
}
