import profileFormSource from '@/components/blocks/profile-form.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { ProfileFormDemo, ProfileFormDisabledDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: profileFormSource,
  examples: [
    {
      id: 'editable',
      title: 'Edit and save',
      description:
        'Example only: the mock handler sends nothing. Pick a mock response, then submit.',
      component: ProfileFormDemo,
      code: demoCode('ProfileFormDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
    {
      id: 'disabled',
      title: 'Locked',
      description: 'Every control and the submit button are disabled.',
      component: ProfileFormDisabledDemo,
      code: demoCode('ProfileFormDisabledDemo'),
      preview: { layout: 'fill', height: 'lg' },
    },
  ],
}
