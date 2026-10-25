import { Textarea } from '@/components/ui/textarea'
import textareaSource from '@/components/ui/textarea.tsx?raw'

import { definePlayground } from '../playground'
import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { TextareaDemo, TextareaStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: textareaSource,
  examples: [
    {
      id: 'basic',
      title: 'Labelled textarea',
      component: TextareaDemo,
      code: demoCode('TextareaDemo'),
    },
    {
      id: 'states',
      title: 'Sizes and states',
      component: TextareaStatesDemo,
      code: demoCode('TextareaStatesDemo'),
    },
  ],
  playground: definePlayground(Textarea, {
    part: 'Textarea',
    controls: [
      { kind: 'text', prop: 'placeholder', default: 'Describe the change' },
      { kind: 'select', prop: 'size', options: ['sm', 'md', 'lg'], default: 'md' },
      { kind: 'boolean', prop: 'disabled', default: false },
    ],
    staticProps: { 'aria-label': 'Summary' },
  }),
}
