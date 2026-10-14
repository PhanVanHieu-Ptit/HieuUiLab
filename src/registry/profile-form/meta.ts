import profileFormSource from '@/components/blocks/profile-form.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { ProfileFormDemo, ProfileFormDisabledDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const profileFormEntry: ImplementedEntry = {
  id: 'profile-form',
  slug: 'profile-form',
  name: 'Profile form',
  description:
    'A user profile editor on React Hook Form and Zod with text, date, select, textarea, checkbox, switch, and password fields, server field errors, and submission feedback.',
  kind: 'block',
  category: 'inputs',
  tags: ['async', 'composition', 'form', 'validation'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/profile-form.tsx',
    packages: ['@hookform/resolvers', 'react-hook-form', 'zod'],
    registryDependencies: [
      'button',
      'checkbox',
      'field',
      'form',
      'form-feedback',
      'input',
      'password-input',
      'select',
      'switch',
      'textarea',
    ],
    requirements: ['design-tokens'],
  },
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
  guidelines: [
    '`profileSchema` holds every rule; the markup sets no native constraints, and required markers are derived from the schema.',
    '`onSubmit` receives parsed values (trimmed, empty optional fields as `null`) and returns a `SubmitResult`. Connect it to your own API; this block makes no requests.',
    'Errors appear after the first submit and update as the user types. An invalid submit focuses the first invalid field.',
  ],
  api: {
    parts: [
      {
        name: 'ProfileForm',
        props: [
          {
            name: 'onSubmit',
            type: '(values: ProfileFormValues) => Promise<SubmitResult<ProfileFormInput>>',
            required: true,
            description:
              'Saves valid values and reports the outcome, including server field errors.',
          },
          {
            name: 'defaultValues',
            type: 'Partial<ProfileFormInput>',
            description: 'Initial values merged over blank ones.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            default: 'false',
            description: 'Show the form but block editing and submitting.',
          },
        ],
      },
    ],
  },
}
