import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { Button } from './button'
import { FieldControl } from './field'
import { FormField, useFormSubmit, type SubmitResult } from './form'
import { FormFeedback } from './form-feedback'
import { Input } from './input'

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name.'),
  email: z.string().trim().pipe(z.email('Enter a valid email.')),
})
type TestInput = z.input<typeof schema>
type Values = z.output<typeof schema>

function TestForm({
  onSubmit,
}: {
  onSubmit: (values: Values) => Promise<SubmitResult<TestInput>>
}) {
  const form = useForm<TestInput, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
  })
  const { submit, pending, feedback } = useFormSubmit(form, onSubmit, {
    successMessage: 'Saved it.',
  })
  return (
    <form noValidate onSubmit={submit}>
      <fieldset disabled={pending}>
        <FormField
          control={form.control}
          name="name"
          label="Name"
          description="Shown to others."
          render={({ field }) => (
            <FieldControl>
              <Input {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          label="Email"
          render={({ field }) => (
            <FieldControl>
              <Input {...field} />
            </FieldControl>
          )}
        />
        <Button type="submit" loading={pending}>
          Save
        </Button>
      </fieldset>
      {feedback ? (
        <FormFeedback
          key={feedback.id}
          status={feedback.status}
          title={feedback.message}
          focusOnMount={feedback.focus}
        />
      ) : null}
    </form>
  )
}

describe('FormField and useFormSubmit', () => {
  it('shows schema errors on the fields and focuses the first invalid one', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(values: Values) => Promise<SubmitResult<TestInput>>>()
    render(<TestForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    const name = screen.getByRole('textbox', { name: 'Name' })
    expect(name).toBeInvalid()
    expect(name).toHaveAccessibleDescription('Shown to others. Enter a name.')
    expect(name).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Enter a valid email.',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits parsed values and reports success', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => Promise.resolve<SubmitResult<TestInput>>({ ok: true }))
    render(<TestForm onSubmit={onSubmit} />)

    await user.type(screen.getByRole('textbox', { name: 'Name' }), '  Ada  ')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com' })
    expect(await screen.findByRole('status')).toHaveTextContent('Saved it.')
    expect(screen.getByRole('status')).toHaveFocus()
  })

  it('sets server field errors, announces the failure, and focuses the rejected field', async () => {
    const user = userEvent.setup()
    render(
      <TestForm
        onSubmit={() =>
          Promise.resolve({
            ok: false,
            message: 'Fix the highlighted field.',
            fieldErrors: [{ name: 'email', message: 'That email is already registered.' }],
          })
        }
      />,
    )

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Fix the highlighted field.')
    const email = screen.getByRole('textbox', { name: 'Email' })
    expect(email).toBeInvalid()
    expect(email).toHaveAccessibleDescription('That email is already registered.')
    expect(email).toHaveFocus()

    // Editing replaces the server's message with the schema's verdict.
    await user.type(email, 'x')
    expect(email).toBeValid()
  })

  it('turns a rejected handler into a generic failure', async () => {
    const user = userEvent.setup()
    render(<TestForm onSubmit={() => Promise.reject(new Error('Network down'))} />)

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong, and nothing was saved. Try again.')
    expect(alert).toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada')
  })
})
