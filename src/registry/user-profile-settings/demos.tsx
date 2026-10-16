import { useState } from 'react'

import {
  UserProfileSettings,
  type UserProfileSettingsState,
} from '@/components/blocks/user-profile-settings'

import { ExampleOnlyNotice, MockPicker } from '../demo-controls'
import {
  mockChangePassword,
  mockDeleteAccount,
  mockSavePreferences,
  mockSaveProfile,
  samplePreferences,
  sampleProfile,
  settingsOutcomes,
  type SettingsOutcome,
} from './mock-data'

export function UserProfileSettingsDemo() {
  return (
    <UserProfileSettings
      state={{ status: 'ready', profile: sampleProfile, notifications: samplePreferences }}
      onSaveProfile={(values) => mockSaveProfile(values, 'success')}
      onSaveNotifications={(values) => mockSavePreferences(values, 'success')}
      onChangePassword={(values) => mockChangePassword(values, 'success')}
    />
  )
}

export function UserProfileSettingsOutcomesDemo() {
  const [outcome, setOutcome] = useState<SettingsOutcome>('rejected')
  const [deleted, setDeleted] = useState(false)

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>
        Nothing is saved or deleted. Pick what the mock service answers, then try each tab.
      </ExampleOnlyNotice>
      <MockPicker options={settingsOutcomes} value={outcome} onChange={setOutcome} />
      <UserProfileSettings
        defaultTab="security"
        state={{ status: 'ready', profile: sampleProfile, notifications: samplePreferences }}
        onSaveProfile={(values) => mockSaveProfile(values, outcome)}
        onSaveNotifications={(values) => mockSavePreferences(values, outcome)}
        onChangePassword={(values) => mockChangePassword(values, outcome)}
        onDeleteAccount={async () => {
          await mockDeleteAccount(outcome)
          setDeleted(true)
        }}
      />
      <p role="status" className="text-sm text-muted-foreground">
        {deleted ? 'Account deleted (example only: nothing was deleted).' : ''}
      </p>
    </div>
  )
}

type MockState = 'ready' | 'loading' | 'error'

const mockStates: readonly { value: MockState; label: string }[] = [
  { value: 'ready', label: 'Loaded' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Error' },
]

export function UserProfileSettingsStatesDemo() {
  const [mock, setMock] = useState<MockState>('loading')

  const state: UserProfileSettingsState =
    mock === 'loading'
      ? { status: 'loading' }
      : mock === 'error'
        ? { status: 'error', message: 'Mock: the settings service did not respond.' }
        : { status: 'ready', profile: sampleProfile, notifications: samplePreferences }

  return (
    <div className="grid w-full gap-4">
      <ExampleOnlyNotice>The profile and preferences are invented.</ExampleOnlyNotice>
      <MockPicker legend="Mock state" options={mockStates} value={mock} onChange={setMock} />
      <UserProfileSettings
        state={state}
        onRetry={() => {
          setMock('ready')
        }}
        onSaveProfile={(values) => mockSaveProfile(values, 'success')}
        onSaveNotifications={(values) => mockSavePreferences(values, 'success')}
        onChangePassword={(values) => mockChangePassword(values, 'success')}
      />
    </div>
  )
}
