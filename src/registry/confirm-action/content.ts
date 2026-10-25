import confirmActionSource from '@/components/blocks/confirm-action.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { ConfirmActionDefaultDemo, ConfirmActionDemo, ConfirmActionFailureDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: confirmActionSource,
  examples: [
    {
      id: 'async',
      title: 'Async confirmation',
      description: 'The confirm button shows a busy state until the work finishes.',
      component: ConfirmActionDemo,
      code: demoCode('ConfirmActionDemo'),
    },
    {
      id: 'failure',
      title: 'Failure and retry',
      description: 'A rejected promise keeps the dialog open and announces the error.',
      component: ConfirmActionFailureDemo,
      code: demoCode('ConfirmActionFailureDemo'),
    },
    {
      id: 'non-destructive',
      title: 'Non-destructive',
      description: 'confirmVariant="default" for consequential actions that do not destroy data.',
      component: ConfirmActionDefaultDemo,
      code: demoCode('ConfirmActionDefaultDemo'),
    },
  ],
}
