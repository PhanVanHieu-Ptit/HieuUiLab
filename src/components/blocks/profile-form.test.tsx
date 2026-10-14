import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SubmitResult } from '@/components/ui/form'

import {
  ProfileForm,
  profileSchema,
  type ProfileFormInput,
  type ProfileFormValues,
} from './profile-form'

type Handler = (values: ProfileFormValues) => Promise<SubmitResult<ProfileFormInput>>

const validInput: ProfileFormInput = {
  displayName: '  Alex Nguyen ',
  username: 'alex_ng',
  email: ' alex@example.com ',
  website: '',
  birthDate: '1990-04-12',
  language: 'vi',
  bio: 'Builds accessible interfaces.',
  marketingEmails: true,
  publicProfile: false,
  currentPassword: 'correct horse',
}

/** A promise the test settles by hand, to observe the pending state. */
function deferred<T>() {
  let settle: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    settle = resolve
  })
  return { promise, resolve: (value: T) => settle?.(value) }
}

/** Password inputs have no role, so find it by its label, whose text includes the marker. */
function currentPassword() {
  return screen.getByLabelText(/^Current password/)
}

function messagesFor(input: Partial<ProfileFormInput>) {
  const result = profileSchema.safeParse({ ...validInput, ...input })
  return result.error?.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) ?? []
}

describe('profileSchema', () => {
  it('parses valid input into trimmed values with empty optional fields as null', () => {
    expect(profileSchema.parse(validInput)).toEqual({
      ...validInput,
      displayName: 'Alex Nguyen',
      email: 'alex@example.com',
      website: null,
    })
    expect(profileSchema.parse({ ...validInput, birthDate: '' }).birthDate).toBeNull()
    expect(profileSchema.parse({ ...validInput, website: 'https://alex.dev' }).website).toBe(
      'https://alex.dev',
    )
  })

  it.each<[string, Partial<ProfileFormInput>, string]>([
    ['a short display name', { displayName: ' A ' }, 'displayName: Enter at least 2 characters.'],
    [
      'a long display name',
      { displayName: 'x'.repeat(51) },
      'displayName: Use 50 characters or fewer.',
    ],
    [
      'a username with capitals',
      { username: 'Alex' },
      'username: Use lowercase letters, numbers, and underscores only.',
    ],
    ['a short username', { username: 'al' }, 'username: Use at least 3 characters.'],
    ['an empty email', { email: '  ' }, 'email: Enter your email address.'],
    [
      'a malformed email',
      { email: 'alex@' },
      'email: Enter an email address like name@example.com.',
    ],
    [
      'a plain http website',
      { website: 'http://alex.dev' },
      'website: Enter a full address starting with https://, or leave it empty.',
    ],
    ['a partial date', { birthDate: '1990-02-30' }, 'birthDate: Enter a complete date.'],
    [
      'a future birth date',
      { birthDate: '2999-01-01' },
      'birthDate: Your birth date can’t be in the future.',
    ],
    ['a long bio', { bio: 'x'.repeat(161) }, 'bio: Use 160 characters or fewer.'],
    [
      'a missing password',
      { currentPassword: '' },
      'currentPassword: Enter your current password to save these changes.',
    ],
  ])('rejects %s', (_case, input, message) => {
    expect(messagesFor(input)).toEqual([message])
  })
})

describe('ProfileForm', () => {
  it('marks exactly the fields the schema requires', () => {
    render(<ProfileForm onSubmit={vi.fn<Handler>()} />)

    // The visual marker is aria-hidden, so accessible names have no asterisk.
    for (const name of ['Display name', 'Username', 'Email']) {
      expect(screen.getByRole('textbox', { name })).toHaveAttribute('aria-required', 'true')
    }
    expect(currentPassword()).toHaveAttribute('aria-required', 'true')
    for (const name of ['Website', 'Bio']) {
      expect(screen.getByRole('textbox', { name })).not.toHaveAttribute('aria-required')
    }
    expect(screen.getByLabelText('Birth date')).not.toHaveAttribute('aria-required')
  })

  it('blocks an invalid submission, describes each error, and focuses the first', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>()
    render(<ProfileForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    const displayName = screen.getByRole('textbox', { name: 'Display name' })
    expect(displayName).toHaveFocus()
    expect(displayName).toBeInvalid()
    expect(displayName).toHaveAccessibleDescription('Enter at least 2 characters.')
    expect(screen.getByRole('textbox', { name: 'Username' })).toHaveAccessibleDescription(
      'Lowercase letters, numbers, and underscores. Use at least 3 characters.',
    )
    expect(currentPassword()).toBeInvalid()
    expect(screen.getByRole('textbox', { name: 'Website' })).toBeValid()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('revalidates as the user corrects a field after the first submit', async () => {
    const user = userEvent.setup()
    render(<ProfileForm onSubmit={vi.fn<Handler>()} />)

    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    const displayName = screen.getByRole('textbox', { name: 'Display name' })
    await user.type(displayName, 'Al')

    expect(displayName).toBeValid()
    expect(displayName).not.toHaveAttribute('aria-describedby')
  })

  it('submits typed, parsed values and announces success', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>(() => Promise.resolve({ ok: true }))
    render(
      <ProfileForm onSubmit={onSubmit} defaultValues={{ ...validInput, currentPassword: '' }} />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Email me about new components' }))
    await user.click(screen.getByRole('switch', { name: 'Show my profile publicly' }))
    await user.type(currentPassword(), 'correct horse')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({
      displayName: 'Alex Nguyen',
      username: 'alex_ng',
      email: 'alex@example.com',
      website: null,
      birthDate: '1990-04-12',
      language: 'vi',
      bio: 'Builds accessible interfaces.',
      marketingEmails: false,
      publicProfile: true,
      currentPassword: 'correct horse',
    })
    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('Profile saved')
    expect(status).toHaveTextContent('Your profile has been saved.')
    expect(status).toHaveFocus()
  })

  it('disables every control while saving, then re-enables them', async () => {
    const user = userEvent.setup()
    const save = deferred<SubmitResult<ProfileFormInput>>()
    render(<ProfileForm onSubmit={() => save.promise} defaultValues={validInput} />)

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    const button = screen.getByRole('button', { name: 'Saving…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('textbox', { name: 'Display name' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeDisabled()
    expect(screen.getByRole('switch', { name: 'Show my profile publicly' })).toBeDisabled()

    save.resolve({ ok: true, message: 'Saved changes for @alex_ng.' })

    expect(await screen.findByRole('status')).toHaveTextContent('Saved changes for @alex_ng.')
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
    expect(screen.getByRole('textbox', { name: 'Display name' })).toBeEnabled()
  })

  it('shows a server field error on its field and focuses it', async () => {
    const user = userEvent.setup()
    render(
      <ProfileForm
        defaultValues={validInput}
        onSubmit={() =>
          Promise.resolve({
            ok: false,
            message: 'Some details need your attention.',
            fieldErrors: [{ name: 'username', message: '@alex_ng is already taken.' }],
          })
        }
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('Profile not saved')).toBeInTheDocument()
    expect(alert).toHaveTextContent('Some details need your attention.')
    const username = screen.getByRole('textbox', { name: 'Username' })
    expect(username).toBeInvalid()
    expect(username).toHaveAccessibleDescription(
      'Lowercase letters, numbers, and underscores. @alex_ng is already taken.',
    )
    expect(username).toHaveFocus()
  })

  it('keeps the values and reports a generic error when saving fails', async () => {
    const user = userEvent.setup()
    render(
      <ProfileForm
        defaultValues={validInput}
        onSubmit={() => Promise.reject(new Error('Service unavailable'))}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong, and nothing was saved. Try again.')
    expect(alert).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Username' })).toHaveValue('alex_ng')
  })

  it('disables everything and never submits when disabled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>()
    render(<ProfileForm disabled onSubmit={onSubmit} defaultValues={validInput} />)

    for (const textbox of screen.getAllByRole('textbox')) expect(textbox).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Email me about new components' })).toBeDisabled()
    const button = screen.getByRole('button', { name: 'Save profile' })
    expect(button).toBeDisabled()

    await user.click(button)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
