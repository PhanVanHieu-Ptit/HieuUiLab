import { Switch } from '@/components/ui/switch'
import switchSource from '@/components/ui/switch.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SwitchControlledDemo, SwitchDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: switchSource,
  examples: [
    {
      id: 'basic',
      title: 'Uncontrolled',
      component: SwitchDemo,
      code: demoCode('SwitchDemo'),
    },
    {
      id: 'controlled',
      title: 'Controlled setting',
      description: 'The hint is linked with aria-describedby and reflects the current state.',
      component: SwitchControlledDemo,
      code: demoCode('SwitchControlledDemo'),
    },
  ],
  playground: definePlayground(Switch, {
    part: 'Switch',
    controls: [
      { kind: 'boolean', prop: 'defaultChecked', label: 'Checked by default', default: false },
      { kind: 'select', prop: 'size', options: ['sm', 'md'], default: 'md' },
      { kind: 'boolean', prop: 'disabled', default: false },
    ],
    staticProps: { 'aria-label': 'Email notifications' },
  }),
}
