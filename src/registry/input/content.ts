import { Input } from '@/components/ui/input'
import inputSource from '@/components/ui/input.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { InputFieldDemo, InputSizesDemo, InputStatesDemo, InputValidationDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: inputSource,
  examples: [
    {
      id: 'field',
      title: 'Labelled field',
      description: 'The hint is linked with aria-describedby, so it is read after the label.',
      component: InputFieldDemo,
      code: demoCode('InputFieldDemo'),
    },
    {
      id: 'validation',
      title: 'Controlled with validation',
      description:
        'aria-invalid drives the error style; the message changes in place so it stays linked.',
      component: InputValidationDemo,
      code: demoCode('InputValidationDemo'),
    },
    { id: 'sizes', title: 'Sizes', component: InputSizesDemo, code: demoCode('InputSizesDemo') },
    {
      id: 'states',
      title: 'Disabled, read-only, and file',
      component: InputStatesDemo,
      code: demoCode('InputStatesDemo'),
    },
  ],
  playground: definePlayground(Input, {
    part: 'Input',
    controls: [
      { kind: 'text', prop: 'placeholder', default: 'you@example.com' },
      { kind: 'select', prop: 'size', options: ['sm', 'md', 'lg'], default: 'md' },
      { kind: 'boolean', prop: 'aria-invalid', label: 'Invalid', default: false },
      { kind: 'boolean', prop: 'disabled', default: false },
    ],
    // A bare input has no visible label; real forms should use Field instead.
    staticProps: { 'aria-label': 'Email' },
  }),
}
