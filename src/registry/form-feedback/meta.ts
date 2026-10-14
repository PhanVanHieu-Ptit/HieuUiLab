import formFeedbackSource from '@/components/ui/form-feedback.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { FormFeedbackDemo, FormFeedbackPlainFormDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const formFeedbackEntry: ImplementedEntry = {
  id: 'form-feedback',
  slug: 'form-feedback',
  name: 'Form feedback',
  description:
    'The outcome of a submission: an announced success or error message that takes focus when it appears.',
  kind: 'component',
  category: 'feedback',
  tags: ['a11y', 'async', 'form', 'status'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/form-feedback.tsx',
    packages: ['lucide-react'],
    registryDependencies: ['alert'],
    requirements: ['cn-helper', 'design-tokens'],
  },
  source: formFeedbackSource,
  examples: [
    {
      id: 'variants',
      title: 'Success and error',
      description: 'Static examples use role="none" so they are not announced on load.',
      component: FormFeedbackDemo,
      code: demoCode('FormFeedbackDemo'),
    },
    {
      id: 'plain-form',
      title: 'Without a form library',
      description:
        'A plain form with a mock request: disabled while pending, then focused feedback.',
      component: FormFeedbackPlainFormDemo,
      code: demoCode('FormFeedbackPlainFormDemo'),
    },
  ],
  guidelines: [
    'Render it when a submission settles and remove it when the next one starts.',
    'Change its `key` on every submission so a repeated result is focused and announced again.',
    'Say what happened and what to do next; keep the user’s input on failure.',
  ],
  api: {
    parts: [
      {
        name: 'FormFeedback',
        props: [
          {
            name: 'status',
            type: "'success' | 'error'",
            required: true,
            description: 'Success is role="status"; error is role="alert".',
          },
          {
            name: 'title',
            type: 'ReactNode',
            required: true,
            description: 'Names the outcome in words.',
          },
          {
            name: 'focusOnMount',
            type: 'boolean',
            default: 'true',
            description: 'Move focus to the message when it appears.',
          },
          {
            name: '...props',
            type: "Omit<ComponentProps<'div'>, 'title'>",
            description: 'Native div attributes, including role and ref.',
          },
        ],
      },
    ],
  },
}
