import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SubmitResult } from '@/components/ui/form'

import type { ProfileFormInput } from './profile-form'
import {
  passwordChangeSchema,
  UserProfileSettings,
  type NotificationPreferences,
  type PasswordChangeInput,
  type UserProfileSettingsProps,
} from './user-profile-settings'

const profile: Partial<ProfileFormInput> = {
  displayName: 'Alex Nguyen',
  username: 'alex_ng',
  email: 'alex@example.com',
}

const preferences: NotificationPreferences = {
  mentions: true,
  productUpdates: false,
  securityAlerts: true,
  weeklyDigest: false,
}

function renderSettings(props: Partial<UserProfileSettingsProps> = {}) {
  const handlers = {
    onSaveProfile: vi.fn(() => Promise.resolve({ ok: true } as const)),
    onSaveNotifications: vi.fn(() => Promise.resolve({ ok: true } as const)),
    onChangePassword: vi.fn(() => Promise.resolve({ ok: true } as const)),
  }
  render(
    <UserProfileSettings
      state={{ status: 'ready', profile, notifications: preferences }}
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

/** The panel a tab controls. All panels stay mounted, so tests must say which one they mean. */
function panel(name: string) {
  const id = screen.getByRole('tab', { name }).getAttribute('aria-controls')
  const element = id === null ? null : document.getElementById(id)
  if (!element) throw new Error(`No panel for ${name}`)
  return within(element)
}

/** A promise the test settles by hand, to observe the pending state. */
function deferred<T>() {
  let settle: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    settle = resolve
  })
  return { promise, resolve: (value: T) => settle?.(value) }
}

const validPassword: PasswordChangeInput = {
  currentPassword: 'old password',
  newPassword: 'a much longer secret',
  confirmPassword: 'a much longer secret',
}

describe('passwordChangeSchema', () => {
  it('accepts a long new password that is confirmed', () => {
    expect(passwordChangeSchema.parse(validPassword)).toEqual(validPassword)
  })

  it.each<[string, Partial<PasswordChangeInput>, string]>([
    [
      'a missing current password',
      { currentPassword: '' },
      'currentPassword: Enter your current password.',
    ],
    [
      'a short new password',
      { newPassword: 'short', confirmPassword: 'short' },
      'newPassword: Use at least 12 characters.',
    ],
    [
      'a new password equal to the current one',
      { currentPassword: 'a much longer secret' },
      'newPassword: Choose a password that is different from your current one.',
    ],
    [
      'a confirmation that differs',
      { confirmPassword: 'something else' },
      'confirmPassword: The passwords don’t match.',
    ],
    [
      'an empty confirmation',
      { confirmPassword: '' },
      'confirmPassword: Enter the new password again.',
    ],
  ])('rejects %s', (_case, input, message) => {
    const result = passwordChangeSchema.safeParse({ ...validPassword, ...input })
    expect(
      result.error?.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    ).toEqual([message])
  })
})

describe('UserProfileSettings', () => {
  it('names the page and offers three sections, starting on the profile', () => {
    renderSettings({ title: 'Account', description: 'Your details.' })

    expect(screen.getByRole('heading', { level: 2, name: 'Account' })).toBeInTheDocument()
    expect(screen.getByText('Your details.')).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Profile',
      'Notifications',
      'Security',
    ])
    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true')
    expect(panel('Profile').getByRole('textbox', { name: 'Display name' })).toHaveValue(
      'Alex Nguyen',
    )
  })

  it('starts on defaultTab', () => {
    renderSettings({ defaultTab: 'security' })

    expect(screen.getByRole('tab', { name: 'Security' })).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps unsaved edits when another tab is visited', async () => {
    const user = userEvent.setup()
    renderSettings()

    const displayName = panel('Profile').getByRole('textbox', { name: 'Display name' })
    await user.clear(displayName)
    await user.type(displayName, 'Alexandra')
    await user.click(screen.getByRole('tab', { name: 'Security' }))
    await user.click(screen.getByRole('tab', { name: 'Profile' }))

    expect(panel('Profile').getByRole('textbox', { name: 'Display name' })).toHaveValue('Alexandra')
    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true')
  })

  it('hides the panels that are not showing', async () => {
    const user = userEvent.setup()
    renderSettings()

    const state = (name: string) =>
      document.getElementById(screen.getByRole('tab', { name }).getAttribute('aria-controls') ?? '')
        ?.dataset.state

    expect([state('Profile'), state('Notifications'), state('Security')]).toEqual([
      'active',
      'inactive',
      'inactive',
    ])
    await user.click(screen.getByRole('tab', { name: 'Notifications' }))
    expect([state('Profile'), state('Notifications'), state('Security')]).toEqual([
      'inactive',
      'active',
      'inactive',
    ])
  })

  describe('profile', () => {
    it('saves through onSaveProfile with the typed values', async () => {
      const user = userEvent.setup()
      const { onSaveProfile } = renderSettings()
      const profilePanel = panel('Profile')

      await user.type(profilePanel.getByLabelText(/^Current password/), 'correct horse')
      await user.click(profilePanel.getByRole('button', { name: 'Save profile' }))

      expect(onSaveProfile).toHaveBeenCalledOnce()
      expect(onSaveProfile).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'Alex Nguyen', currentPassword: 'correct horse' }),
      )
      expect(await screen.findByText('Profile saved')).toBeInTheDocument()
    })
  })

  describe('notifications', () => {
    it('shows each preference as a switch in its saved state', () => {
      renderSettings()
      const notifications = panel('Notifications')

      expect(notifications.getByRole('switch', { name: 'Mentions and replies' })).toBeChecked()
      expect(notifications.getByRole('switch', { name: 'Product updates' })).not.toBeChecked()
      expect(notifications.getByRole('switch', { name: 'Security alerts' })).toBeChecked()
      expect(notifications.getByRole('switch', { name: 'Weekly digest' })).not.toBeChecked()
      expect(
        notifications.getByRole('switch', { name: 'Product updates' }),
      ).toHaveAccessibleDescription('New features and changes, about once a month.')
    })

    it('saves the changed switches and announces success', async () => {
      const user = userEvent.setup()
      const { onSaveNotifications } = renderSettings()
      await user.click(screen.getByRole('tab', { name: 'Notifications' }))
      const notifications = panel('Notifications')

      await user.click(notifications.getByRole('switch', { name: 'Weekly digest' }))
      await user.click(notifications.getByRole('switch', { name: 'Mentions and replies' }))
      await user.click(notifications.getByRole('button', { name: 'Save preferences' }))

      expect(onSaveNotifications).toHaveBeenCalledExactlyOnceWith({
        mentions: false,
        productUpdates: false,
        securityAlerts: true,
        weeklyDigest: true,
      })
      const status = await notifications.findByRole('status')
      expect(status).toHaveTextContent('Preferences saved')
      expect(status).toHaveTextContent('Your notification preferences have been saved.')
      expect(status).toHaveFocus()
    })

    it('disables the switches while saving', async () => {
      const user = userEvent.setup()
      const save = deferred<SubmitResult<NotificationPreferences>>()
      renderSettings({ onSaveNotifications: () => save.promise })
      await user.click(screen.getByRole('tab', { name: 'Notifications' }))
      const notifications = panel('Notifications')

      await user.click(notifications.getByRole('button', { name: 'Save preferences' }))

      expect(notifications.getByRole('button', { name: 'Saving…' })).toHaveAttribute(
        'aria-busy',
        'true',
      )
      expect(notifications.getByRole('switch', { name: 'Weekly digest' })).toBeDisabled()

      save.resolve({ ok: true })
      expect(await notifications.findByRole('status')).toBeInTheDocument()
      expect(notifications.getByRole('switch', { name: 'Weekly digest' })).toBeEnabled()
    })

    it('reports a failure and keeps the choices', async () => {
      const user = userEvent.setup()
      renderSettings({
        onSaveNotifications: () =>
          Promise.resolve({ ok: false, message: 'Your preferences could not be saved.' }),
      })
      await user.click(screen.getByRole('tab', { name: 'Notifications' }))
      const notifications = panel('Notifications')

      await user.click(notifications.getByRole('switch', { name: 'Weekly digest' }))
      await user.click(notifications.getByRole('button', { name: 'Save preferences' }))

      const alert = await notifications.findByRole('alert')
      expect(alert).toHaveTextContent('Preferences not saved')
      expect(alert).toHaveTextContent('Your preferences could not be saved.')
      expect(notifications.getByRole('switch', { name: 'Weekly digest' })).toBeChecked()
    })
  })

  describe('security', () => {
    async function openSecurity(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('tab', { name: 'Security' }))
      return panel('Security')
    }

    it('blocks an empty submission and focuses the first problem', async () => {
      const user = userEvent.setup()
      const { onChangePassword } = renderSettings()
      const security = await openSecurity(user)

      await user.click(security.getByRole('button', { name: 'Change password' }))

      const current = security.getByLabelText(/^Current password/)
      expect(current).toHaveFocus()
      expect(current).toBeInvalid()
      expect(current).toHaveAccessibleDescription('Enter your current password.')
      expect(security.getByLabelText(/^New password/)).toBeInvalid()
      expect(onChangePassword).not.toHaveBeenCalled()
    })

    it('explains a confirmation that does not match', async () => {
      const user = userEvent.setup()
      renderSettings()
      const security = await openSecurity(user)

      await user.type(security.getByLabelText(/^Current password/), 'old password')
      await user.type(security.getByLabelText(/^New password/), 'a much longer secret')
      await user.type(security.getByLabelText(/^Confirm new password/), 'a much longer secrex')
      await user.click(security.getByRole('button', { name: 'Change password' }))

      expect(security.getByLabelText(/^Confirm new password/)).toHaveAccessibleDescription(
        'The passwords don’t match.',
      )
    })

    it('submits the three passwords, announces success, and clears the form', async () => {
      const user = userEvent.setup()
      const { onChangePassword } = renderSettings()
      const security = await openSecurity(user)

      await user.type(security.getByLabelText(/^Current password/), validPassword.currentPassword)
      await user.type(security.getByLabelText(/^New password/), validPassword.newPassword)
      await user.type(
        security.getByLabelText(/^Confirm new password/),
        validPassword.confirmPassword,
      )
      await user.click(security.getByRole('button', { name: 'Change password' }))

      expect(onChangePassword).toHaveBeenCalledExactlyOnceWith(validPassword)
      expect(await security.findByRole('status')).toHaveTextContent(
        'Your password has been changed.',
      )
      expect(security.getByLabelText(/^Current password/)).toHaveValue('')
      expect(security.getByLabelText(/^New password/)).toHaveValue('')
      expect(security.getByLabelText(/^Confirm new password/)).toHaveValue('')
    })

    it('puts a server field error on the field and keeps what was typed', async () => {
      const user = userEvent.setup()
      renderSettings({
        onChangePassword: () =>
          Promise.resolve({
            ok: false,
            message: 'Your password was not changed.',
            fieldErrors: [
              { name: 'currentPassword', message: 'That isn’t your current password.' },
            ],
          }),
      })
      const security = await openSecurity(user)

      await user.type(security.getByLabelText(/^Current password/), validPassword.currentPassword)
      await user.type(security.getByLabelText(/^New password/), validPassword.newPassword)
      await user.type(
        security.getByLabelText(/^Confirm new password/),
        validPassword.confirmPassword,
      )
      await user.click(security.getByRole('button', { name: 'Change password' }))

      const current = security.getByLabelText(/^Current password/)
      expect(await security.findByRole('alert')).toHaveTextContent('Your password was not changed.')
      expect(current).toBeInvalid()
      expect(current).toHaveAccessibleDescription('That isn’t your current password.')
      expect(current).toHaveFocus()
      expect(current).toHaveValue(validPassword.currentPassword)
    })
  })

  describe('delete account', () => {
    it('is absent unless a handler is given', async () => {
      const user = userEvent.setup()
      renderSettings()
      await user.click(screen.getByRole('tab', { name: 'Security' }))

      expect(screen.queryByRole('button', { name: 'Delete account' })).toBeNull()
    })

    it('asks first, and deletes only after the user confirms', async () => {
      const user = userEvent.setup()
      const onDeleteAccount = vi.fn()
      renderSettings({ onDeleteAccount })
      await user.click(screen.getByRole('tab', { name: 'Security' }))

      await user.click(panel('Security').getByRole('button', { name: 'Delete account' }))
      const dialog = await screen.findByRole('dialog', { name: 'Delete your account?' })
      expect(onDeleteAccount).not.toHaveBeenCalled()

      await user.click(within(dialog).getByRole('button', { name: 'Delete account' }))

      expect(onDeleteAccount).toHaveBeenCalledOnce()
    })

    it('does nothing when the user cancels', async () => {
      const user = userEvent.setup()
      const onDeleteAccount = vi.fn()
      renderSettings({ onDeleteAccount })
      await user.click(screen.getByRole('tab', { name: 'Security' }))

      await user.click(panel('Security').getByRole('button', { name: 'Delete account' }))
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
      )

      expect(onDeleteAccount).not.toHaveBeenCalled()
    })

    it('shows a failure inside the dialog', async () => {
      const user = userEvent.setup()
      renderSettings({
        onDeleteAccount: () => Promise.reject(new Error('This account owns a workspace.')),
      })
      await user.click(screen.getByRole('tab', { name: 'Security' }))

      await user.click(panel('Security').getByRole('button', { name: 'Delete account' }))
      const dialog = await screen.findByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: 'Delete account' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'This account owns a workspace.',
      )
    })
  })

  describe('loading and error', () => {
    it('announces loading and shows no tabs', () => {
      renderSettings({ state: { status: 'loading' } })

      expect(screen.getByText('Loading settings…')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Settings' })).toHaveAttribute('aria-busy', 'true')
      expect(screen.queryByRole('tab')).toBeNull()
    })

    it('shows the error as an alert and retries', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      renderSettings({
        state: { status: 'error', message: 'Mock: the settings service did not respond.' },
        onRetry,
      })

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Mock: the settings service did not respond.',
      )
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('offers no retry without a handler', () => {
      renderSettings({ state: { status: 'error' } })

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    })
  })
})
