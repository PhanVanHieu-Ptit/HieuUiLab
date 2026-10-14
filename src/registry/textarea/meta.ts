import textareaSource from '@/components/ui/textarea.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor, nativeProps } from '../utils'
import { TextareaDemo, TextareaStatesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const textareaEntry: ImplementedEntry = {
  id: 'textarea',
  slug: 'textarea',
  name: 'Textarea',
  description:
    'A native multi-line text field styled like Input that grows with its content and can be resized vertically.',
  kind: 'component',
  category: 'inputs',
  tags: ['a11y', 'form', 'variants'],
  status: 'stable',
  installation: {
    targetPath: 'components/ui/textarea.tsx',
    packages: ['class-variance-authority'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
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
  guidelines: [
    'Give it a visible Label, or put it in a Field.',
    'Auto-growth uses CSS `field-sizing: content`; browsers without it keep the minimum height and a resize handle.',
  ],
  api: {
    parts: [
      {
        name: 'Textarea',
        props: [
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg'",
            default: "'md'",
            description: 'Padding, text size, and minimum height.',
          },
          nativeProps('textarea'),
        ],
      },
    ],
  },
}
