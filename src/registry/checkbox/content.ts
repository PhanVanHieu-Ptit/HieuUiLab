import { Checkbox } from '@/components/ui/checkbox'
import checkboxSource from '@/components/ui/checkbox.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { CheckboxDemo, CheckboxSelectAllDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: checkboxSource,
  examples: [
    {
      id: 'basic',
      title: 'Uncontrolled',
      description: 'Each checkbox is named by its label; clicking the label toggles it.',
      component: CheckboxDemo,
      code: demoCode('CheckboxDemo'),
    },
    {
      id: 'select-all',
      title: 'Controlled select all',
      description:
        'The parent is indeterminate (aria-checked="mixed") while only some children are checked.',
      component: CheckboxSelectAllDemo,
      code: demoCode('CheckboxSelectAllDemo'),
    },
  ],
  playground: definePlayground(Checkbox, {
    part: 'Checkbox',
    controls: [
      { kind: 'boolean', prop: 'defaultChecked', label: 'Checked by default', default: false },
      { kind: 'select', prop: 'size', options: ['sm', 'md'], default: 'md' },
      { kind: 'boolean', prop: 'disabled', default: false },
    ],
    staticProps: { 'aria-label': 'Accept the terms' },
  }),
}
