import type { ProfileFormInput, ProfileFormValues } from '@/components/blocks/profile-form'
import type {
  NotificationPreferences,
  PasswordChangeInput,
  PasswordChangeValues,
} from '@/components/blocks/user-profile-settings'
import type { SubmitResult } from '@/components/ui/form'

import { mockDelay } from '../mock-delay'

/**
 * Example data and handlers for the User profile settings demos. The person, their preferences,
 * and every outcome are invented and held in memory. Nothing is sent, stored, or authenticated:
 * the handlers return whatever outcome the demo picked, whatever was typed.
 */
export const sampleProfile: Partial<ProfileFormInput> = {
  displayName: 'Alex Nguyen',
  username: 'alex_ng',
  email: 'alex@example.com',
  bio: 'Builds accessible interfaces.',
}

export const samplePreferences: NotificationPreferences = {
  mentions: true,
  productUpdates: false,
  securityAlerts: true,
  weeklyDigest: false,
}

export type SettingsOutcome = 'success' | 'rejected' | 'unavailable'

export const settingsOutcomes: readonly { value: SettingsOutcome; label: string }[] = [
  { value: 'success', label: 'Saves' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'unavailable', label: 'Service unavailable' },
]

const unavailable = () => new Error('Mock: the settings service is unavailable.')

export async function mockSaveProfile(
  values: ProfileFormValues,
  outcome: SettingsOutcome,
): Promise<SubmitResult<ProfileFormInput>> {
  await mockDelay(600)
  if (outcome === 'unavailable') throw unavailable()
  if (outcome === 'rejected') {
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

export async function mockSavePreferences(
  _values: NotificationPreferences,
  outcome: SettingsOutcome,
): Promise<SubmitResult<NotificationPreferences>> {
  await mockDelay(500)
  if (outcome === 'unavailable') throw unavailable()
  if (outcome === 'rejected') {
    return { ok: false, message: 'Your preferences could not be saved. Try again later.' }
  }
  return { ok: true }
}

export async function mockChangePassword(
  _values: PasswordChangeValues,
  outcome: SettingsOutcome,
): Promise<SubmitResult<PasswordChangeInput>> {
  await mockDelay(600)
  if (outcome === 'unavailable') throw unavailable()
  if (outcome === 'rejected') {
    return {
      ok: false,
      message: 'Your password was not changed.',
      fieldErrors: [{ name: 'currentPassword', message: 'That isn’t your current password.' }],
    }
  }
  return { ok: true }
}

export async function mockDeleteAccount(outcome: SettingsOutcome): Promise<void> {
  await mockDelay(600)
  if (outcome === 'unavailable') throw unavailable()
  if (outcome === 'rejected')
    throw new Error('Mock: this account owns a workspace and can’t be deleted.')
}
