import selectSource from '@/components/ui/select.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { SelectControlledDemo, SelectDemo, SelectFormDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: selectSource,
  examples: [
    {
      id: 'groups',
      title: 'Grouped options',
      description: 'Uncontrolled with a default value. Type a letter to jump to a matching option.',
      component: SelectDemo,
      code: demoCode('SelectDemo'),
    },
    {
      id: 'controlled',
      title: 'Controlled',
      description: 'Disabled options stay visible but are skipped by the arrow keys.',
      component: SelectControlledDemo,
      code: demoCode('SelectControlledDemo'),
    },
    {
      id: 'form',
      title: 'In a form',
      description:
        'With name and required, the value is submitted and validated like a native select.',
      component: SelectFormDemo,
      code: demoCode('SelectFormDemo'),
    },
  ],
}
