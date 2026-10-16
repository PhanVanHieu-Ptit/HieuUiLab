import multiStepOnboardingSource from '@/components/blocks/multi-step-onboarding.tsx?raw'

import type { ImplementedEntry } from '../types'
import { demoExtractor } from '../utils'
import { MultiStepOnboardingDemo, MultiStepOnboardingOutcomesDemo } from './demos'
import demosSource from './demos.tsx?raw'

const demoCode = demoExtractor(demosSource)

export const multiStepOnboardingEntry: ImplementedEntry = {
  id: 'multi-step-onboarding',
  slug: 'multi-step-onboarding',
  name: 'Multi-step onboarding',
  description:
    'A four-step setup wizard with a progress indicator, per-step validation, a review step with a way back to each part, and server errors that return to the right step.',
  kind: 'block',
  category: 'pages',
  tags: ['a11y', 'async', 'form', 'validation', 'wizard'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/multi-step-onboarding.tsx',
    packages: ['lucide-react', 'react-hook-form', 'zod', '@hookform/resolvers'],
    registryDependencies: [
      'button',
      'card',
      'field',
      'form',
      'form-feedback',
      'input',
      'select',
      'switch',
    ],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
    notes: [
      'The wizard collects answers and hands them to onComplete; it creates nothing. Account, workspace, and billing logic belong to your backend.',
      'The steps, fields, and wording are in the source. Edit the schema and the step list together: each step names the fields it validates.',
    ],
  },
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
  guidelines: [
    'Next checks only the fields of the current step and focuses the first invalid one. Answers are kept when the user goes back, so nothing typed is lost.',
    'The progress list marks the current step with aria-current="step" and says “completed” for finished ones in words, not only with a tick. Steps already reached can be revisited; later steps cannot be skipped to.',
    'When the step changes, focus moves to the step heading so keyboard and screen reader users start at the top of the new content.',
    'The review step lists every answer with an Edit link back to its step. If an earlier answer is invalid when the user submits, the block says which steps to revisit.',
    'A server error for a field on an earlier step (for example a taken address) opens that step with the error shown and the field focused. A rejected promise shows a generic message and keeps all answers.',
    'Below 32rem wide the progress list becomes “Step 2 of 4: Workspace”, so it fits phones and narrow columns. Two-column fields start at 36rem.',
  ],
  api: {
    parts: [
      {
        name: 'MultiStepOnboarding',
        props: [
          {
            name: 'onComplete',
            type: '(values: OnboardingValues) => Promise<SubmitResult<OnboardingInput>>',
            required: true,
            description:
              'Creates the workspace and reports the outcome. Return field errors the server found; a rejected promise shows a generic error.',
          },
          {
            name: 'defaultValues',
            type: 'Partial<OnboardingInput>',
            description: 'Answers to start with, for example to resume a saved draft.',
          },
          {
            name: 'initialStep',
            type: "'profile' | 'workspace' | 'preferences' | 'review'",
            default: "'profile'",
            description: 'The step to open on. Earlier steps are treated as done.',
          },
          {
            name: 'onStepChange',
            type: '(step: OnboardingStepId) => void',
            description: 'Called with the new step after every change of step.',
          },
          {
            name: 'title',
            type: 'string',
            default: "'Set up your workspace'",
            description: 'Heading of the wizard; also names the form.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer section.' },
        ],
      },
      {
        name: 'onboardingSchema',
        description: 'The Zod schema behind all four steps; exported for server-side reuse.',
        props: [
          {
            name: 'fullName / jobRole',
            type: 'string',
            required: true,
            description: 'Profile step. The role must be one of the offered choices.',
          },
          {
            name: 'workspaceName / workspaceSlug / teamSize',
            type: 'string',
            required: true,
            description:
              'Workspace step. The address is 3–30 lowercase letters, numbers, and single hyphens.',
          },
          {
            name: 'goal / productTips / shareUsage',
            type: 'string / boolean / boolean',
            required: true,
            description: 'Preferences step.',
          },
        ],
      },
      {
        name: 'OnboardingInput / OnboardingValues / OnboardingStepId',
        description: 'What the inputs hold, what a valid submission delivers, and the step ids.',
        props: [
          {
            name: 'OnboardingInput',
            type: 'z.input<typeof onboardingSchema>',
            description: 'Answers as typed; choices are strings, empty until chosen.',
          },
          {
            name: 'OnboardingValues',
            type: 'z.output<typeof onboardingSchema>',
            description: 'Values passed to onComplete: trimmed text, and choices as typed values.',
          },
          {
            name: 'OnboardingStepId',
            type: "'profile' | 'workspace' | 'preferences' | 'review'",
            description: 'Identifies a step.',
          },
        ],
      },
    ],
  },
}
