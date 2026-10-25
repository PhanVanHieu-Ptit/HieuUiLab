import type { ImplementedEntry } from '../types'
import { nativeProps } from '../utils'

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
  content: () => import('./content'),
}
