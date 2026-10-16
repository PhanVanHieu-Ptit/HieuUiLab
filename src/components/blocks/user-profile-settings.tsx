import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ConfirmAction } from '@/components/blocks/confirm-action'
import { ErrorState } from '@/components/blocks/error-state'
import {
  ProfileForm,
  type ProfileFormInput,
  type ProfileFormValues,
} from '@/components/blocks/profile-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldControl } from '@/components/ui/field'
import { FormField, useFormSubmit, type SubmitResult } from '@/components/ui/form'
import { FormFeedback } from '@/components/ui/form-feedback'
import { PasswordInput } from '@/components/ui/password-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'

export interface NotificationPreferences {
  mentions: boolean
  productUpdates: boolean
  securityAlerts: boolean
  weeklyDigest: boolean
}

const passwordRules = { min: 12 } as const

/** Every rule the change-password form enforces. The UI only displays this schema's results. */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z
      .string()
      .min(passwordRules.min, `Use at least ${String(passwordRules.min)} characters.`),
    confirmPassword: z.string().min(1, 'Enter the new password again.'),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword !== '' && values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Choose a password that is different from your current one.',
      })
    }
    if (values.confirmPassword !== '' && values.confirmPassword !== values.newPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'The passwords don’t match.',
      })
    }
  })

/** What the inputs hold while editing. */
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>
/** What a valid submission delivers. */
export type PasswordChangeValues = z.output<typeof passwordChangeSchema>

export type SettingsTab = 'profile' | 'notifications' | 'security'

/** What the block shows. */
export type UserProfileSettingsState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | {
      status: 'ready'
      /** Starting values for the profile form. They seed it once; later changes are ignored. */
      profile: Partial<ProfileFormInput>
      /** Starting values for the preference switches. They seed them once. */
      notifications: NotificationPreferences
    }

export interface UserProfileSettingsProps {
  state: UserProfileSettingsState
  /** Saves the profile. See ProfileForm for the contract. */
  onSaveProfile: (values: ProfileFormValues) => Promise<SubmitResult<ProfileFormInput>>
  onSaveNotifications: (
    values: NotificationPreferences,
  ) => Promise<SubmitResult<NotificationPreferences>>
  onChangePassword: (values: PasswordChangeValues) => Promise<SubmitResult<PasswordChangeInput>>
  /** Shows the delete-account section when given. Runs after the user confirms; may be async. */
  onDeleteAccount?: () => void | Promise<void>
  defaultTab?: SettingsTab
  /** Shows a retry button in the error state. */
  onRetry?: () => void
  title?: string
  description?: string
  className?: string
}

const preferenceRows: readonly {
  name: keyof NotificationPreferences
  label: string
  description: string
}[] = [
  {
    name: 'mentions',
    label: 'Mentions and replies',
    description: 'When someone mentions you or replies to your comment.',
  },
  {
    name: 'productUpdates',
    label: 'Product updates',
    description: 'New features and changes, about once a month.',
  },
  {
    name: 'securityAlerts',
    label: 'Security alerts',
    description: 'New sign-ins and changes to your password.',
  },
  {
    name: 'weeklyDigest',
    label: 'Weekly digest',
    description: 'A summary of what happened in your workspace.',
  },
]

function NotificationsForm({
  initial,
  onSubmit,
}: {
  initial: NotificationPreferences
  onSubmit: UserProfileSettingsProps['onSaveNotifications']
}) {
  const form = useForm<NotificationPreferences>({ defaultValues: initial })
  const { submit, pending, feedback } = useFormSubmit(form, onSubmit, {
    successMessage: 'Your notification preferences have been saved.',
  })

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label="Notification preferences"
      className="grid w-full gap-5"
    >
      <fieldset disabled={pending} className="grid min-w-0 gap-4">
        {preferenceRows.map((row) => (
          <FormField
            key={row.name}
            control={form.control}
            name={row.name}
            label={row.label}
            description={row.description}
            orientation="horizontal"
            render={({ field }) => (
              <FieldControl>
                <Switch
                  ref={field.ref}
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FieldControl>
            )}
          />
        ))}
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            {pending ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </fieldset>
      {feedback ? (
        <FormFeedback
          key={feedback.id}
          status={feedback.status}
          title={feedback.status === 'success' ? 'Preferences saved' : 'Preferences not saved'}
          focusOnMount={feedback.focus}
        >
          {feedback.message}
        </FormFeedback>
      ) : null}
    </form>
  )
}

function PasswordChangeForm({
  onSubmit,
}: {
  onSubmit: UserProfileSettingsProps['onChangePassword']
}) {
  const form = useForm<PasswordChangeInput, unknown, PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { control, reset } = form
  const { submit, pending, feedback } = useFormSubmit(
    form,
    async (values) => {
      const result = await onSubmit(values)
      // Never keep a password in the form once it has been changed.
      if (result.ok) reset()
      return result
    },
    { successMessage: 'Your password has been changed.' },
  )

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label="Change password"
      className="grid w-full max-w-md gap-5"
    >
      <fieldset disabled={pending} className="grid min-w-0 gap-4">
        <FormField
          control={control}
          name="currentPassword"
          label="Current password"
          required
          render={({ field }) => (
            <FieldControl>
              <PasswordInput autoComplete="current-password" {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="newPassword"
          label="New password"
          description={`At least ${String(passwordRules.min)} characters.`}
          required
          deps="confirmPassword"
          render={({ field }) => (
            <FieldControl>
              <PasswordInput autoComplete="new-password" {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm new password"
          required
          render={({ field }) => (
            <FieldControl>
              <PasswordInput autoComplete="new-password" {...field} />
            </FieldControl>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            {pending ? 'Changing…' : 'Change password'}
          </Button>
        </div>
      </fieldset>
      {feedback ? (
        <FormFeedback
          key={feedback.id}
          status={feedback.status}
          title={feedback.status === 'success' ? 'Password changed' : 'Password not changed'}
          focusOnMount={feedback.focus}
        >
          {feedback.message}
        </FormFeedback>
      ) : null}
    </form>
  )
}

function SettingsSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Loading settings…</span>
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-80" />
    </div>
  )
}

/**
 * An account settings page in three tabs: the profile form, notification preferences, and security
 * (change password, and an optional delete-account section behind a confirmation). It composes the
 * Profile form block and holds no account data or session: every save goes through a handler you
 * provide. Panels stay mounted, so unsaved edits survive switching tabs. Loading and error states
 * are built in.
 */
export function UserProfileSettings({
  state,
  onSaveProfile,
  onSaveNotifications,
  onChangePassword,
  onDeleteAccount,
  defaultTab = 'profile',
  onRetry,
  title = 'Settings',
  description = 'Manage your profile, notifications, and security.',
  className,
}: UserProfileSettingsProps) {
  const headingId = useId()
  // Panels are force-mounted so edits survive tab changes; Radix does not hide those itself.
  const panelClass = 'data-[state=inactive]:hidden'

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={state.status === 'loading'}
      className={cn('@container w-full min-w-0', className)}
    >
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-1">
          <h2 id={headingId} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>
        {state.status === 'loading' ? <SettingsSkeleton /> : null}
        {state.status === 'error' ? (
          <ErrorState
            headingLevel="h3"
            title="Couldn’t load your settings"
            {...(state.message ? { description: state.message } : {})}
            {...(onRetry ? { onRetry } : {})}
          />
        ) : null}
        {state.status === 'ready' ? (
          <Tabs defaultValue={defaultTab} className="gap-5">
            <TabsList aria-label="Settings sections" className="w-fit max-w-full">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" forceMount className={panelClass}>
              <Card>
                <CardHeader>
                  <CardTitle as="h3">Profile</CardTitle>
                  <CardDescription>How you appear to other people.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm defaultValues={state.profile} onSubmit={onSaveProfile} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notifications" forceMount className={panelClass}>
              <Card>
                <CardHeader>
                  <CardTitle as="h3">Notifications</CardTitle>
                  <CardDescription>Choose what we email you about.</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationsForm initial={state.notifications} onSubmit={onSaveNotifications} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="security" forceMount className={cn(panelClass, 'grid gap-5')}>
              <Card>
                <CardHeader>
                  <CardTitle as="h3">Change password</CardTitle>
                  <CardDescription>Use a password you don’t use anywhere else.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordChangeForm onSubmit={onChangePassword} />
                </CardContent>
              </Card>
              {onDeleteAccount ? (
                <Card className="border-destructive/40">
                  <CardHeader>
                    <CardTitle as="h3">Delete account</CardTitle>
                    <CardDescription>
                      Permanently remove your account and its data. This can’t be undone.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConfirmAction
                      trigger={<Button variant="destructive">Delete account</Button>}
                      title="Delete your account?"
                      description="Your profile, settings, and data will be permanently deleted. This can’t be undone."
                      confirmLabel="Delete account"
                      onConfirm={onDeleteAccount}
                    />
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </section>
  )
}
