import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldControl } from '@/components/ui/field'
import { FormField, useFormSubmit, type SubmitResult } from '@/components/ui/form'
import { FormFeedback } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const limits = {
  displayNameMin: 2,
  displayNameMax: 50,
  usernameMin: 3,
  usernameMax: 20,
  bioMax: 160,
} as const

const languages = ['en', 'vi', 'fr', 'ja'] as const

const languageLabels: Record<(typeof languages)[number], string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  fr: 'Français',
  ja: '日本語',
}

const isoDate = z.iso.date()
const httpsUrl = z.url({ protocol: /^https$/, hostname: z.regexes.domain })

/** Today as `YYYY-MM-DD` in the user's time zone, comparable with date input values. */
function today(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${String(now.getFullYear())}-${month}-${day}`
}

/** Every rule the profile form enforces. The UI only displays this schema's results. */
export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(limits.displayNameMin, `Enter at least ${String(limits.displayNameMin)} characters.`)
    .max(limits.displayNameMax, `Use ${String(limits.displayNameMax)} characters or fewer.`),
  username: z
    .string()
    .trim()
    .min(limits.usernameMin, `Use at least ${String(limits.usernameMin)} characters.`)
    .max(limits.usernameMax, `Use ${String(limits.usernameMax)} characters or fewer.`)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, and underscores only.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter an email address like name@example.com.')),
  website: z
    .string()
    .trim()
    .refine((value) => value === '' || httpsUrl.safeParse(value).success, {
      message: 'Enter a full address starting with https://, or leave it empty.',
    })
    .transform((value) => (value === '' ? null : value)),
  birthDate: z
    .string()
    .superRefine((value, ctx) => {
      if (value === '') return
      if (!isoDate.safeParse(value).success) {
        ctx.addIssue({ code: 'custom', message: 'Enter a complete date.' })
      } else if (value > today()) {
        ctx.addIssue({ code: 'custom', message: 'Your birth date can’t be in the future.' })
      }
    })
    .transform((value) => (value === '' ? null : value)),
  language: z.enum(languages, 'Choose a language from the list.'),
  bio: z
    .string()
    .trim()
    .max(limits.bioMax, `Use ${String(limits.bioMax)} characters or fewer.`),
  marketingEmails: z.boolean(),
  publicProfile: z.boolean(),
  currentPassword: z.string().min(1, 'Enter your current password to save these changes.'),
})

/** What the inputs hold while editing. */
export type ProfileFormInput = z.input<typeof profileSchema>
/** What a valid submission delivers: trimmed, with empty optional fields as `null`. */
export type ProfileFormValues = z.output<typeof profileSchema>

const blankProfile: ProfileFormInput = {
  displayName: '',
  username: '',
  email: '',
  website: '',
  birthDate: '',
  language: 'en',
  bio: '',
  marketingEmails: false,
  publicProfile: true,
  currentPassword: '',
}

// A field is marked required when the schema rejects it left blank, so the
// markers can never disagree with the rules.
const requiredFields = new Set(
  profileSchema.safeParse(blankProfile).error?.issues.map((issue) => issue.path[0]) ?? [],
)

export interface ProfileFormProps {
  /**
   * Saves valid values and reports the outcome. Return field errors the server
   * found, such as a taken username; a rejected promise shows a generic error.
   */
  onSubmit: (values: ProfileFormValues) => Promise<SubmitResult<ProfileFormInput>>
  defaultValues?: Partial<ProfileFormInput>
  /** Show the form but block editing and submitting. */
  disabled?: boolean
}

/**
 * A profile editor on React Hook Form and Zod. Errors appear after the first
 * submit and update as the user types; an invalid submit focuses the first
 * invalid field. While saving, every control is disabled and the outcome is
 * announced and focused when it settles.
 */
export function ProfileForm({ onSubmit, defaultValues, disabled = false }: ProfileFormProps) {
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { ...blankProfile, ...defaultValues },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { control } = form
  const { submit, pending, feedback } = useFormSubmit(form, onSubmit, {
    successMessage: 'Your profile has been saved.',
  })
  const bio = useWatch({ control, name: 'bio' })

  return (
    <form noValidate onSubmit={submit} aria-label="Edit profile" className="grid w-full gap-6">
      <fieldset disabled={disabled || pending} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <FormField
          control={control}
          name="displayName"
          label="Display name"
          required={requiredFields.has('displayName')}
          render={({ field }) => (
            <FieldControl>
              <Input autoComplete="name" {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="username"
          label="Username"
          description="Lowercase letters, numbers, and underscores."
          required={requiredFields.has('username')}
          render={({ field }) => (
            <FieldControl>
              <Input autoComplete="username" spellCheck={false} autoCapitalize="none" {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="email"
          label="Email"
          required={requiredFields.has('email')}
          render={({ field }) => (
            <FieldControl>
              <Input type="email" autoComplete="email" spellCheck={false} {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="website"
          label="Website"
          required={requiredFields.has('website')}
          render={({ field }) => (
            <FieldControl>
              <Input type="url" autoComplete="url" placeholder="https://" {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="birthDate"
          label="Birth date"
          required={requiredFields.has('birthDate')}
          render={({ field }) => (
            <FieldControl>
              <Input type="date" autoComplete="bday" {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="language"
          label="Language"
          required={requiredFields.has('language')}
          render={({ field }) => (
            <Select name={field.name} value={field.value} onValueChange={field.onChange}>
              <FieldControl>
                <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
              </FieldControl>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {languageLabels[language]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FormField
          control={control}
          name="bio"
          label="Bio"
          description={`${String(bio.length)} of ${String(limits.bioMax)} characters.`}
          required={requiredFields.has('bio')}
          className="sm:col-span-2"
          render={({ field }) => (
            <FieldControl>
              <Textarea {...field} />
            </FieldControl>
          )}
        />
        <div className="grid gap-3 sm:col-span-2">
          <FormField
            control={control}
            name="marketingEmails"
            label="Email me about new components"
            orientation="horizontal"
            render={({ field }) => (
              <FieldControl>
                <Checkbox
                  ref={field.ref}
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true)
                  }}
                  onBlur={field.onBlur}
                />
              </FieldControl>
            )}
          />
          <FormField
            control={control}
            name="publicProfile"
            label="Show my profile publicly"
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
        </div>
        <FormField
          control={control}
          name="currentPassword"
          label="Current password"
          description="Needed to confirm changes to your profile."
          required={requiredFields.has('currentPassword')}
          className="sm:col-span-2 sm:max-w-[calc(50%-0.625rem)]"
          render={({ field }) => (
            <FieldControl>
              <PasswordInput autoComplete="current-password" {...field} />
            </FieldControl>
          )}
        />
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" loading={pending}>
            {pending ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </fieldset>
      {feedback ? (
        <FormFeedback
          key={feedback.id}
          status={feedback.status}
          title={feedback.status === 'success' ? 'Profile saved' : 'Profile not saved'}
          focusOnMount={feedback.focus}
        >
          {feedback.message}
        </FormFeedback>
      ) : null}
    </form>
  )
}
