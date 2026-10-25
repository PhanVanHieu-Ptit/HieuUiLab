import formSource from '@/components/ui/form.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { FormFieldDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: formSource,
  examples: [
    {
      id: 'invite',
      title: 'Schema-validated form',
      description:
        'Zod holds every rule. Submit empty to see errors; use an @example.org address for a mock server error.',
      component: FormFieldDemo,
      code: demoCode('FormFieldDemo'),
    },
  ],
}
