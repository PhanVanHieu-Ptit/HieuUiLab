import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Input } from './input'
import { Label } from './label'

describe('Input', () => {
  it('is a native text input named by its label', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" defaultValue="hi" />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('type', 'text')

    await user.type(input, '@lab')
    expect(input).toHaveValue('hi@lab')
  })

  it('works controlled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Controlled() {
      const [value, setValue] = useState('')
      return (
        <Input
          aria-label="Name"
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setValue(event.target.value.toUpperCase())
          }}
        />
      )
    }
    render(<Controlled />)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'ab')
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('AB')
    expect(onChange).toHaveBeenLastCalledWith('Ab')
  })

  it('applies size classes, merges className, and passes native attributes', () => {
    render(<Input aria-label="Search" type="search" size="lg" className="max-w-xs" required />)
    const input = screen.getByRole('searchbox', { name: 'Search' })
    expect(input).toHaveClass('h-10', 'max-w-xs')
    expect(input).toBeRequired()
  })

  it('exposes an invalid state with a described error', () => {
    render(
      <>
        <Input aria-label="Slug" aria-invalid aria-describedby="slug-error" />
        <p id="slug-error">Use lowercase letters only.</p>
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Slug' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Use lowercase letters only.')
    expect(input).toHaveClass('aria-invalid:border-destructive')
  })

  it('cannot be edited or focused when disabled', async () => {
    const user = userEvent.setup()
    render(<Input aria-label="Locked" disabled />)
    const input = screen.getByRole('textbox', { name: 'Locked' })
    await user.tab()
    expect(input).not.toHaveFocus()
    await user.type(input, 'x')
    expect(input).toHaveValue('')
  })

  it('forwards ref to the input element', () => {
    let node: HTMLInputElement | null = null
    render(
      <Input
        aria-label="Ref"
        ref={(element) => {
          node = element
        }}
      />,
    )
    expect(node).toBe(screen.getByRole('textbox', { name: 'Ref' }))
  })
})
