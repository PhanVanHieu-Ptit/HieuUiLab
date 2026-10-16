import { useState } from 'react'

import { MultiStepOnboarding } from '@/components/blocks/multi-step-onboarding'

import { ExampleOnlyNotice, MockPicker } from '../demo-controls'
import {
  mockCreateWorkspace,
  onboardingOutcomes,
  sampleAnswers,
  type OnboardingOutcome,
} from './mock-data'

export function MultiStepOnboardingDemo() {
  return <MultiStepOnboarding onComplete={(values) => mockCreateWorkspace(values, 'success')} />
}

export function MultiStepOnboardingOutcomesDemo() {
  const [outcome, setOutcome] = useState<OnboardingOutcome>('slug-taken')

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>
        The answers are filled in and the wizard starts on the review step. Nothing is created: pick
        what the mock service answers, then press Create workspace.
      </ExampleOnlyNotice>
      <MockPicker options={onboardingOutcomes} value={outcome} onChange={setOutcome} />
      <MultiStepOnboarding
        key={outcome}
        initialStep="review"
        defaultValues={sampleAnswers}
        onComplete={(values) => mockCreateWorkspace(values, outcome)}
      />
    </div>
  )
}
