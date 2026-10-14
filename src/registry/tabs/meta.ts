import tabsSource from '@/components/ui/tabs.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { TabsLineDemo, TabsPillDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const tabsEntry: ImplementedEntry = {
  id: 'tabs',
  slug: 'tabs',
  name: 'Tabs',
  description:
    'Radix Tabs with line and pill styles. Arrow keys move between tabs; the list scrolls instead of overflowing on small screens.',
  kind: 'component',
  category: 'navigation',
  tags: ['keyboard', 'radix', 'responsive', 'variants'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/tabs.tsx',
    packages: ['class-variance-authority', 'radix-ui'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
  source: tabsSource,
  examples: [
    {
      id: 'line',
      title: 'Line',
      description: 'Disabled tabs are skipped by keyboard navigation.',
      component: TabsLineDemo,
      code: demoCode('TabsLineDemo'),
    },
    { id: 'pill', title: 'Pill', component: TabsPillDemo, code: demoCode('TabsPillDemo') },
  ],
  api: {
    parts: [
      {
        name: 'Tabs',
        description: 'Root; holds the selected value.',
        props: [
          {
            name: 'variant',
            type: "'line' | 'pill'",
            default: "'line'",
            description: 'Style shared by the list and triggers.',
          },
          {
            name: 'defaultValue / value',
            type: 'string',
            description: 'Initially selected (uncontrolled) or selected (controlled) tab.',
          },
        ],
      },
      {
        name: 'TabsList',
        props: [
          {
            name: 'aria-label',
            type: 'string',
            description: 'Names the tab group for assistive tech.',
          },
        ],
      },
      {
        name: 'TabsTrigger',
        props: [
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Prevents selection.',
          },
        ],
      },
    ],
  },
}
