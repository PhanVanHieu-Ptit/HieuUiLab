import type { ImplementedEntry } from '../types'

export const userProfileSettingsEntry: ImplementedEntry = {
  id: 'user-profile-settings',
  slug: 'user-profile-settings',
  name: 'User profile settings',
  description:
    'An account settings page in three tabs: the profile form, notification preferences, and security with a password change and an optional delete-account section.',
  kind: 'block',
  category: 'pages',
  tags: ['async', 'composition', 'form', 'validation'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/user-profile-settings.tsx',
    packages: ['react-hook-form', 'zod', '@hookform/resolvers'],
    registryDependencies: [
      'confirm-action',
      'error-state',
      'profile-form',
      'button',
      'card',
      'field',
      'form',
      'form-feedback',
      'password-input',
      'skeleton',
      'switch',
      'tabs',
    ],
    requirements: ['cn-helper', 'design-tokens'],
    notes: [
      'This is the screen only. Account storage, password hashing, session handling, and deletion belong to your backend: connect them in the four handlers.',
      'The profile form needs a current password to save (see Profile form); your onSaveProfile decides whether it is right.',
    ],
  },
  guidelines: [
    'It composes Profile form unchanged, so its validation, required markers, and error handling apply here too. Only the notification preferences and the password form are specific to this block.',
    'All three panels stay mounted, so edits in one tab survive visiting another. The values in state only seed the forms once; to load different data, give the block a new key.',
    'Every save goes through a handler that returns a result: field errors land on their fields, a message becomes a status or an alert, and a rejected promise shows a generic error. Nothing is stored here.',
    'The password form clears itself after a successful change, so a password is never left in the page. The new password must differ from the current one and be confirmed.',
    'The delete-account section only exists when you pass onDeleteAccount, and always asks for confirmation first. A failure is shown inside the dialog so the user can retry.',
    'Loading is announced with a status message and aria-busy. The error state is announced as an alert and offers retry when you pass onRetry.',
  ],
  api: {
    parts: [
      {
        name: 'UserProfileSettings',
        props: [
          {
            name: 'state',
            type: 'UserProfileSettingsState',
            required: true,
            description: 'What to show: loading, an error, or the starting values.',
          },
          {
            name: 'onSaveProfile',
            type: '(values: ProfileFormValues) => Promise<SubmitResult<ProfileFormInput>>',
            required: true,
            description: 'Saves the profile. See Profile form for the contract.',
          },
          {
            name: 'onSaveNotifications',
            type: '(values: NotificationPreferences) => Promise<SubmitResult<NotificationPreferences>>',
            required: true,
            description: 'Saves the preference switches.',
          },
          {
            name: 'onChangePassword',
            type: '(values: PasswordChangeValues) => Promise<SubmitResult<PasswordChangeInput>>',
            required: true,
            description: 'Changes the password. Return a field error for a wrong current password.',
          },
          {
            name: 'onDeleteAccount',
            type: '() => void | Promise<void>',
            description:
              'Shows the delete-account section when given. Runs after the user confirms.',
          },
          {
            name: 'defaultTab',
            type: "'profile' | 'notifications' | 'security'",
            default: "'profile'",
            description: 'The tab shown first.',
          },
          {
            name: 'onRetry',
            type: '() => void',
            description: 'Shows a retry button in the error state.',
          },
          {
            name: 'title',
            type: 'string',
            default: "'Settings'",
            description: 'Heading of the page.',
          },
          {
            name: 'description',
            type: 'string',
            default: "'Manage your profile, notifications, and security.'",
            description: 'Text under the heading.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer section.' },
        ],
      },
      {
        name: 'UserProfileSettingsState',
        description: 'One of three shapes, told apart by status.',
        props: [
          {
            name: 'status',
            type: "'loading' | 'error' | 'ready'",
            required: true,
            description: 'Which shape this is.',
          },
          {
            name: 'message',
            type: 'string',
            description: 'With status "error": what went wrong. Replaces the default text.',
          },
          {
            name: 'profile',
            type: 'Partial<ProfileFormInput>',
            description: 'With status "ready": starting values of the profile form.',
          },
          {
            name: 'notifications',
            type: 'NotificationPreferences',
            description: 'With status "ready": starting values of the preference switches.',
          },
        ],
      },
      {
        name: 'NotificationPreferences',
        description: 'The four preference switches.',
        props: [
          {
            name: 'mentions',
            type: 'boolean',
            required: true,
            description: 'Mentions and replies.',
          },
          {
            name: 'productUpdates',
            type: 'boolean',
            required: true,
            description: 'Product updates.',
          },
          {
            name: 'securityAlerts',
            type: 'boolean',
            required: true,
            description: 'Security alerts.',
          },
          { name: 'weeklyDigest', type: 'boolean', required: true, description: 'Weekly digest.' },
        ],
      },
      {
        name: 'passwordChangeSchema',
        description: 'The Zod schema behind the password form; exported for server-side reuse.',
        props: [
          {
            name: 'currentPassword',
            type: 'string',
            required: true,
            description: 'Must not be empty.',
          },
          {
            name: 'newPassword',
            type: 'string',
            required: true,
            description: 'At least 12 characters and different from the current password.',
          },
          {
            name: 'confirmPassword',
            type: 'string',
            required: true,
            description: 'Must equal the new password.',
          },
        ],
      },
      {
        name: 'PasswordChangeInput / PasswordChangeValues',
        description: 'What the inputs hold while editing, and what a valid submission delivers.',
        props: [
          {
            name: 'PasswordChangeInput',
            type: 'z.input<typeof passwordChangeSchema>',
            description: 'Values as typed.',
          },
          {
            name: 'PasswordChangeValues',
            type: 'z.output<typeof passwordChangeSchema>',
            description: 'Values passed to onChangePassword.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}
