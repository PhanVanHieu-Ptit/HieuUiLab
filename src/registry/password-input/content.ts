import passwordInputSource from '@/components/ui/password-input.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { PasswordInputDemo, PasswordInputFieldDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: passwordInputSource,
  examples: [
    {
      id: 'basic',
      title: 'Show and hide',
      description: 'The toggle is a real button in the tab order, after the input.',
      component: PasswordInputDemo,
      code: demoCode('PasswordInputDemo'),
    },
    {
      id: 'field',
      title: 'In a Field with an error',
      component: PasswordInputFieldDemo,
      code: demoCode('PasswordInputFieldDemo'),
    },
  ],
}
