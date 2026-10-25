import multiStepOnboardingSource from '@/components/blocks/multi-step-onboarding.tsx?raw'

import type { ImplementedEntryContent } from '../types'
import { demoExtractor } from '../utils'
import { MultiStepOnboardingDemo, MultiStepOnboardingOutcomesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const content: ImplementedEntryContent = {
  source: multiStepOnboardingSource,
  examples: [
    {
      id: 'onboarding',
      title: 'Onboarding',
      description:
        'Example only: the mock handler always succeeds and nothing is created. Try leaving a step empty, going back, and the review step.',
      component: MultiStepOnboardingDemo,
      code: demoCode('MultiStepOnboardingDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
    {
      id: 'outcomes',
      title: 'Server errors',
      description:
        'Example only: the answers are filled in. Pick what the mock service answers; “Address taken” sends you back to the Workspace step with the field focused.',
      component: MultiStepOnboardingOutcomesDemo,
      code: demoCode('MultiStepOnboardingOutcomesDemo'),
      preview: { layout: 'fill', height: 'lg', responsive: true },
    },
  ],
}
