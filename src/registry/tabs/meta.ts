import tabsSource from '@/components/ui/tabs.tsx?raw'

import type { RegistryEntry } from '../types'
import { baseDependencies, demoExtractor } from '../utils'
import { TabsLineDemo, TabsPillDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const tabsEntry: RegistryEntry = {
  slug: 'tabs',
  name: 'Tabs',
  description:
    'Radix Tabs with line and pill styles. Arrow keys move between tabs; the list scrolls instead of overflowing on small screens.',
  category: 'component',
  status: 'stable',
  dependencies: [...baseDependencies, 'radix-ui'],
  targetPath: 'components/ui/tabs.tsx',
  source: tabsSource,
  demos: [
    {
      id: 'line',
      title: 'Line',
      description: 'Disabled tabs are skipped by keyboard navigation.',
      component: TabsLineDemo,
      code: demoCode('TabsLineDemo'),
    },
    { id: 'pill', title: 'Pill', component: TabsPillDemo, code: demoCode('TabsPillDemo') },
  ],
  props: [
    {
      name: 'variant',
      type: "'line' | 'pill'",
      default: "'line'",
      description: 'Tabs: style shared by the list and triggers.',
    },
    {
      name: 'defaultValue / value',
      type: 'string',
      description: 'Tabs: initially selected (uncontrolled) or selected (controlled) tab.',
    },
    {
      name: 'aria-label',
      type: 'string',
      description: 'TabsList: names the tab group for assistive tech.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'TabsTrigger: prevents selection.',
    },
  ],
}
