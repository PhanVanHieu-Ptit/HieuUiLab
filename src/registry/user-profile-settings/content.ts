import userProfileSettingsSource from '@/components/blocks/user-profile-settings.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import {
  UserProfileSettingsDemo,
  UserProfileSettingsOutcomesDemo,
  UserProfileSettingsStatesDemo,
} from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: userProfileSettingsSource,
  examples: [
    {
      id: 'settings',
      title: 'Account settings',
      description:
        'Example only: the mock handlers always succeed and nothing is saved. The person and their preferences are invented.',
      component: UserProfileSettingsDemo,
      code: demoCode('UserProfileSettingsDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'outcomes',
      title: 'Failures and account deletion',
      description:
        'Example only: pick what the mock service answers to see rejected and unavailable saves, a failed password change, and deleting an account.',
      component: UserProfileSettingsOutcomesDemo,
      code: demoCode('UserProfileSettingsOutcomesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'states',
      title: 'Loading and error',
      description: 'Example only: pick a mock state. Retry in the error state loads the settings.',
      component: UserProfileSettingsStatesDemo,
      code: demoCode('UserProfileSettingsStatesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
}
