import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SubmitResult } from '@/components/ui/form'

import { SignInPage, signInSchema, type SignInInput, type SignInValues } from './sign-in-page'

type Handler = (values: SignInValues) => Promise<SubmitResult<SignInInput>>

/** A promise the test settles by hand, to observe the pending state. */
function deferred<T>() {
  let settle: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    settle = resolve
  })
  return { promise, resolve: (value: T) => settle?.(value) }
}

/** Password inputs have no role, so find it by its label, whose text includes the marker. */
function password() {
  return screen.getByLabelText(/^Password/)
}

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: 'Email' }), ' alex@example.com ')
  await user.type(password(), 'example-secret')
}

describe('signInSchema', () => {
  it('trims the email and keeps the password as typed', () => {
    expect(
      signInSchema.parse({ email: '  alex@example.com ', password: ' pw ', remember: true }),
    ).toEqual({ email: 'alex@example.com', password: ' pw ', remember: true })
  })

  it.each<[string, Partial<SignInInput>, string]>([
    ['an empty email', { email: ' ' }, 'email: Enter your email address.'],
    [
      'a malformed email',
      { email: 'alex@' },
      'email: Enter an email address like name@example.com.',
    ],
    ['an empty password', { password: '' }, 'password: Enter your password.'],
  ])('rejects %s', (_case, input, message) => {
    const result = signInSchema.safeParse({
      email: 'alex@example.com',
      password: 'pw',
      remember: false,
      ...input,
    })
    expect(
      result.error?.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    ).toEqual([message])
  })
})

describe('SignInPage', () => {
  it('names the form with its heading', () => {
    render(<SignInPage onSubmit={vi.fn<Handler>()} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Enter your email and password to continue.')).toBeInTheDocument()
  })

  it('uses a custom title, description, and brand', () => {
    render(
      <SignInPage
        onSubmit={vi.fn<Handler>()}
        title="Welcome back"
        description="Pick up where you left off."
        brand={<span>Example Studio</span>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Pick up where you left off.')).toBeInTheDocument()
    expect(screen.getByText('Example Studio')).toBeInTheDocument()
  })

  it('marks email and password as required and lets password managers fill them', () => {
    render(<SignInPage onSubmit={vi.fn<Handler>()} />)

    const email = screen.getByRole('textbox', { name: 'Email' })
    expect(email).toHaveAttribute('aria-required', 'true')
    expect(email).toHaveAttribute('autocomplete', 'username')
    expect(password()).toHaveAttribute('aria-required', 'true')
    expect(password()).toHaveAttribute('autocomplete', 'current-password')
    expect(email).not.toHaveFocus()
  })

  it('starts with the given email', () => {
    render(<SignInPage onSubmit={vi.fn<Handler>()} defaultEmail="alex@example.com" />)

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('alex@example.com')
  })

  it('blocks an empty submission, describes each error, and focuses the first', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>()
    render(<SignInPage onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const email = screen.getByRole('textbox', { name: 'Email' })
    expect(email).toHaveFocus()
    expect(email).toBeInvalid()
    expect(email).toHaveAccessibleDescription('Enter your email address.')
    expect(password()).toBeInvalid()
    expect(password()).toHaveAccessibleDescription('Enter your password.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('revalidates as the user corrects a field', async () => {
    const user = userEvent.setup()
    render(<SignInPage onSubmit={vi.fn<Handler>()} />)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'alex@example.com')

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeValid()
  })

  it('submits trimmed values and announces success', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>(() => Promise.resolve({ ok: true, message: 'Welcome back.' }))
    render(<SignInPage onSubmit={onSubmit} />)

    await fillIn(user)
    await user.click(screen.getByRole('checkbox', { name: 'Remember me' }))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      email: 'alex@example.com',
      password: 'example-secret',
      remember: true,
    })
    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('Signed in')
    expect(status).toHaveTextContent('Welcome back.')
    expect(status).toHaveFocus()
  })

  it('disables every control while signing in, then enables them again', async () => {
    const user = userEvent.setup()
    const pending = deferred<SubmitResult<SignInInput>>()
    render(<SignInPage onSubmit={() => pending.promise} onSsoClick={vi.fn()} />)
    await fillIn(user)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const button = screen.getByRole('button', { name: 'Signing in…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled()
    expect(password()).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Continue with single sign-on' })).toBeDisabled()

    pending.resolve({ ok: true })

    expect(await screen.findByRole('status')).toHaveTextContent('You are signed in.')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeEnabled()
  })

  it('shows a server field error on the password and focuses it', async () => {
    const user = userEvent.setup()
    render(
      <SignInPage
        onSubmit={() =>
          Promise.resolve({
            ok: false,
            message: 'Check your details and try again.',
            fieldErrors: [{ name: 'password', message: 'That email and password don’t match.' }],
          })
        }
      />,
    )
    await fillIn(user)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Couldn’t sign in')
    expect(alert).toHaveTextContent('Check your details and try again.')
    expect(password()).toBeInvalid()
    expect(password()).toHaveAccessibleDescription('That email and password don’t match.')
    expect(password()).toHaveFocus()
  })

  it('focuses the alert when the failure is not about a field', async () => {
    const user = userEvent.setup()
    render(
      <SignInPage
        onSubmit={() => Promise.resolve({ ok: false, message: 'This account is locked.' })}
      />,
    )
    await fillIn(user)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('This account is locked.')
    expect(alert).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('alex@example.com')
  })

  it('keeps the values and reports a generic error when the handler rejects', async () => {
    const user = userEvent.setup()
    render(<SignInPage onSubmit={() => Promise.reject(new Error('Mock: unavailable'))} />)
    await fillIn(user)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('We couldn’t sign you in right now. Try again in a moment.')
    expect(alert).not.toHaveTextContent('unavailable')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('alex@example.com')
  })

  it('shows and hides the password with the toggle', async () => {
    const user = userEvent.setup()
    render(<SignInPage onSubmit={vi.fn<Handler>()} />)
    await user.type(password(), 'example-secret')

    expect(password()).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password()).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  describe('optional parts', () => {
    it('offers single sign-on only with a handler, and calls it', async () => {
      const user = userEvent.setup()
      const onSsoClick = vi.fn()
      const { rerender } = render(<SignInPage onSubmit={vi.fn<Handler>()} />)
      expect(screen.queryByRole('button', { name: /single sign-on/ })).toBeNull()

      rerender(
        <SignInPage onSubmit={vi.fn<Handler>()} onSsoClick={onSsoClick} ssoLabel="Use SSO" />,
      )
      await user.click(screen.getByRole('button', { name: 'Use SSO' }))

      expect(onSsoClick).toHaveBeenCalledOnce()
    })

    it('shows the links only when their addresses are given', () => {
      const { rerender } = render(<SignInPage onSubmit={vi.fn<Handler>()} />)
      expect(screen.queryByRole('link')).toBeNull()

      rerender(
        <SignInPage
          onSubmit={vi.fn<Handler>()}
          forgotPasswordHref="/forgot"
          createAccountHref="/signup"
        />,
      )

      expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
        'href',
        '/forgot',
      )
      expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
        'href',
        '/signup',
      )
    })

    it('renders the side panel when given', () => {
      render(<SignInPage onSubmit={vi.fn<Handler>()} aside={<p>Decorative panel</p>} />)

      expect(screen.getByText('Decorative panel')).toBeInTheDocument()
    })
  })

  it('disables everything and never submits when disabled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<Handler>()
    render(<SignInPage disabled onSubmit={onSubmit} onSsoClick={vi.fn()} />)

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled()
    expect(password()).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Continue with single sign-on' })).toBeDisabled()
    const button = screen.getByRole('button', { name: 'Sign in' })
    expect(button).toBeDisabled()

    await user.click(button)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
