import labelSource from '@/components/ui/label.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { LabelControlsDemo, LabelDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: labelSource,
  examples: [
    {
      id: 'required',
      title: 'Required field',
      description: 'The asterisk is hidden from screen readers; the input carries required.',
      component: LabelDemo,
      code: demoCode('LabelDemo'),
    },
    {
      id: 'controls',
      title: 'With checkboxes',
      description:
        'Clicking the label toggles the checkbox. A label after a disabled peer control dims.',
      component: LabelControlsDemo,
      code: demoCode('LabelControlsDemo'),
    },
  ],
}
