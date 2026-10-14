import { useState } from 'react'

import {
  ProfileForm,
  type ProfileFormInput,
  type ProfileFormValues,
} from '@/components/blocks/profile-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { SubmitResult } from '@/components/ui/form'

type MockOutcome = 'success' | 'username-taken' | 'unavailable'

const mockOutcomes: readonly { value: MockOutcome; label: string }[] = [
  { value: 'success', label: 'Saves' },
  { value: 'username-taken', label: 'Username taken' },
  { value: 'unavailable', label: 'Service unavailable' },
]

/**
 * Example only, not a backend integration. Waits in memory and returns the
 * outcome picked in the demo, so every state can be tried. Nothing is sent.
 */
async function mockSaveProfile(
  values: ProfileFormValues,
  outcome: MockOutcome,
): Promise<SubmitResult<ProfileFormInput>> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  if (outcome === 'unavailable') throw new Error('Mock: the profile service is unavailable.')
  if (outcome === 'username-taken') {
    return {
      ok: false,
      message: 'Some details need your attention.',
      fieldErrors: [
        { name: 'username', message: `@${values.username} is already taken. Try another.` },
      ],
    }
  }
  return { ok: true, message: `Saved changes for @${values.username}.` }
}

/** Demo chrome: picks what the mock handler returns. */
function MockOutcomePicker({
  value,
  onChange,
}: {
  value: MockOutcome
  onChange: (outcome: MockOutcome) => void
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-dashed p-3 text-sm">
      <legend className="px-1 text-xs font-medium text-muted-foreground">
        Mock response (example only)
      </legend>
      {mockOutcomes.map((option) => (
        <label key={option.value} className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="profile-mock-outcome"
            className="accent-primary"
            checked={value === option.value}
            onChange={() => {
              onChange(option.value)
            }}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}

const sampleProfile: Partial<ProfileFormInput> = {
  displayName: 'Alex Nguyen',
  username: 'alex_ng',
  email: 'alex@example.com',
  bio: 'Builds accessible interfaces.',
}

export function ProfileFormDemo() {
  const [outcome, setOutcome] = useState<MockOutcome>('success')

  return (
    <div className="grid w-full max-w-2xl gap-5">
      <Alert variant="info" role="none">
        <AlertTitle>Example only</AlertTitle>
        <AlertDescription>
          Submissions go to an in-memory mock handler; nothing is sent anywhere.
        </AlertDescription>
      </Alert>
      <MockOutcomePicker value={outcome} onChange={setOutcome} />
      <ProfileForm
        defaultValues={sampleProfile}
        onSubmit={(values) => mockSaveProfile(values, outcome)}
      />
    </div>
  )
}

export function ProfileFormDisabledDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-5">
      <Alert variant="warning" role="none">
        <AlertTitle>Profile locked</AlertTitle>
        <AlertDescription>An administrator manages this profile.</AlertDescription>
      </Alert>
      <ProfileForm
        disabled
        defaultValues={sampleProfile}
        onSubmit={(values) => mockSaveProfile(values, 'success')}
      />
    </div>
  )
}
