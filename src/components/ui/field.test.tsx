import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Checkbox } from './checkbox'
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from './field'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Switch } from './switch'
import { Textarea } from './textarea'

describe('Field', () => {
  it('names each kind of control by its label', () => {
    render(
      <>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <FieldControl>
            <Input />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel>Bio</FieldLabel>
          <FieldControl>
            <Textarea />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel>Plan</FieldLabel>
          <Select defaultValue="team">
            <FieldControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FieldControl>
            <SelectContent>
              <SelectItem value="team">Team</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="horizontal">
          <FieldControl>
            <Checkbox />
          </FieldControl>
          <FieldLabel>Terms</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <FieldControl>
            <Switch />
          </FieldControl>
          <FieldLabel>Alerts</FieldLabel>
        </Field>
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Bio' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Plan' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Terms' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Alerts' })).toBeInTheDocument()
  })

  it('describes the control with its helper text and error, and marks it invalid', () => {
    render(
      <Field>
        <FieldLabel>Slug</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldDescription>Shown in the URL.</FieldDescription>
        <FieldError>Use lowercase letters only.</FieldError>
      </Field>,
    )

    const input = screen.getByRole('textbox', { name: 'Slug' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Shown in the URL. Use lowercase letters only.')
  })

  it('drops the error from the description when the error clears', async () => {
    const user = userEvent.setup()
    function Slug() {
      const [value, setValue] = useState('A')
      return (
        <Field>
          <FieldLabel>Slug</FieldLabel>
          <FieldControl>
            <Input
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
              }}
            />
          </FieldControl>
          <FieldError>{/^[a-z]*$/.test(value) ? null : 'Lowercase only.'}</FieldError>
        </Field>
      )
    }
    render(<Slug />)

    const input = screen.getByRole('textbox', { name: 'Slug' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Lowercase only.')

    await user.clear(input)
    await user.type(input, 'abc')
    expect(input).toBeValid()
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('lets an explicit invalid override the error check', () => {
    render(
      <Field invalid={false}>
        <FieldLabel>Name</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeValid()
  })

  it('passes required as aria-required, not as a native constraint, and shows a marker', () => {
    render(
      <Field required>
        <FieldLabel>Email</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    )

    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).not.toHaveAttribute('required')
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('disables the control', () => {
    render(
      <Field disabled>
        <FieldLabel>Name</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    )
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled()
  })

  it('throws a clear error when a part is used outside a Field', () => {
    // React logs the thrown error; keep the output readable.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<FieldLabel>Orphan</FieldLabel>)).toThrow(
      '<FieldLabel> must be used inside <Field> or <FieldSet>.',
    )
    spy.mockRestore()
  })
})

describe('FieldSet', () => {
  it('names the group with its legend and links the group error to it', () => {
    render(
      <FieldSet required>
        <FieldLegend>Channels</FieldLegend>
        <Field orientation="horizontal">
          <FieldControl>
            <Checkbox />
          </FieldControl>
          <FieldLabel>Email</FieldLabel>
        </Field>
        <FieldError>Choose at least one channel.</FieldError>
      </FieldSet>,
    )

    const group = screen.getByRole('group', { name: 'Channels' })
    expect(group).toHaveAccessibleDescription('Choose at least one channel.')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    // The checkbox has its own Field, so the group error does not describe it.
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toHaveAttribute('aria-describedby')
  })

  it('disables every control inside', () => {
    render(
      <FieldSet disabled>
        <FieldLegend>Channels</FieldLegend>
        <Field orientation="horizontal">
          <FieldControl>
            <Checkbox />
          </FieldControl>
          <FieldLabel>Email</FieldLabel>
        </Field>
      </FieldSet>,
    )
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeDisabled()
  })
})
