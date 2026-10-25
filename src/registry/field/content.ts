import fieldSource from '@/components/ui/field.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { FieldControlsDemo, FieldDemo, FieldErrorDemo, FieldSetDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: fieldSource,
  examples: [
    {
      id: 'basic',
      title: 'Label and helper text',
      description: 'The description is linked to the input; the label shows the required marker.',
      component: FieldDemo,
      code: demoCode('FieldDemo'),
    },
    {
      id: 'error',
      title: 'Field-level error',
      description:
        'Plain React state: rendering a FieldError marks the input invalid and adds the message to its description.',
      component: FieldErrorDemo,
      code: demoCode('FieldErrorDemo'),
    },
    {
      id: 'controls',
      title: 'Every control',
      description:
        'Textarea, Select, a native date input, Switch, and Checkbox share the same wiring.',
      component: FieldControlsDemo,
      code: demoCode('FieldControlsDemo'),
      preview: { height: 'lg' },
    },
    {
      id: 'fieldset',
      title: 'Group with one error',
      description: 'FieldSet names the group with its legend and links the group’s error to it.',
      component: FieldSetDemo,
      code: demoCode('FieldSetDemo'),
    },
  ],
}
