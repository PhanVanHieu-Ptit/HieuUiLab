import formFeedbackSource from '@/components/ui/form-feedback.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { FormFeedbackDemo, FormFeedbackPlainFormDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
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
}
