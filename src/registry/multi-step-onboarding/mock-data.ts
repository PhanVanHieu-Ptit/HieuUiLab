import type { OnboardingInput, OnboardingValues } from '@/components/blocks/multi-step-onboarding'
import type { SubmitResult } from '@/components/ui/form'

import { mockDelay } from '../mock-delay'

/**
 * Example data and handler for the Multi-step onboarding demos. The person, the workspace, and the
 * outcomes are invented and held in memory. Nothing is created, sent, or stored: the handler
 * returns whatever outcome the demo picked.
 */
export type OnboardingOutcome = 'success' | 'slug-taken' | 'unavailable'

export const onboardingOutcomes: readonly { value: OnboardingOutcome; label: string }[] = [
  { value: 'success', label: 'Creates it' },
  { value: 'slug-taken', label: 'Address taken' },
  { value: 'unavailable', label: 'Service unavailable' },
]

/** A complete set of answers, so a demo can open straight on the review step. */
export const sampleAnswers: Partial<OnboardingInput> = {
  fullName: 'Alex Nguyen',
  jobRole: 'designer',
  workspaceName: 'Atlas Studio',
  workspaceSlug: 'atlas-studio',
  teamSize: 'small',
  goal: 'ship',
  productTips: true,
  shareUsage: false,
}

export async function mockCreateWorkspace(
  values: OnboardingValues,
  outcome: OnboardingOutcome,
): Promise<SubmitResult<OnboardingInput>> {
  await mockDelay(700)
  if (outcome === 'unavailable') throw new Error('Mock: the workspace service is unavailable.')
  if (outcome === 'slug-taken') {
    return {
      ok: false,
      message: 'Some details need your attention.',
      fieldErrors: [
        {
          name: 'workspaceSlug',
          message: `“${values.workspaceSlug}” is already taken. Try another address.`,
        },
      ],
    }
  }
  return {
    ok: true,
    message: `${values.workspaceName} was set up for ${values.fullName}. This is an example: nothing was created.`,
  }
}
