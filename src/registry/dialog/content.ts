import dialogSource from '@/components/ui/dialog.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { DialogDemo, DialogFormDemo, DialogScrollDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: dialogSource,
  examples: [
    {
      id: 'confirm',
      title: 'Confirmation',
      description: 'Uncontrolled. Focus moves into the dialog and returns to the trigger on close.',
      component: DialogDemo,
      code: demoCode('DialogDemo'),
    },
    {
      id: 'form',
      title: 'Controlled form',
      description:
        'The form wraps header, body, and footer; submitting saves and closes through open state.',
      component: DialogFormDemo,
      code: demoCode('DialogFormDemo'),
    },
    {
      id: 'scroll',
      title: 'Long content',
      description:
        'DialogBody scrolls while the header and footer stay in view, even on small screens.',
      component: DialogScrollDemo,
      code: demoCode('DialogScrollDemo'),
    },
  ],
}
