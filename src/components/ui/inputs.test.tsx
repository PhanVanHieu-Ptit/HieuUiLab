import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Label } from './label'
import { PasswordInput } from './password-input'
import { SearchInput } from './search-input'
import { Textarea } from './textarea'

describe('Textarea', () => {
  it('is a native multi-line text field named by its label', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" />
      </>,
    )

    const textarea = screen.getByRole('textbox', { name: 'Notes' })
    expect(textarea.tagName).toBe('TEXTAREA')
    await user.type(textarea, 'one{Enter}two')
    expect(textarea).toHaveValue('one\ntwo')
  })

  it('passes invalid, disabled, and size through', () => {
    render(<Textarea aria-label="Bio" aria-invalid disabled size="sm" />)
    const textarea = screen.getByRole('textbox', { name: 'Bio' })
    expect(textarea).toBeInvalid()
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass('text-xs')
  })
})

describe('PasswordInput', () => {
  it('hides the value until the toggle is pressed, keeping what was typed', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Label htmlFor="pw">Password</Label>
        <PasswordInput id="pw" autoComplete="current-password" />
      </>,
    )

    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('autocomplete', 'current-password')
    await user.type(input, 'hunter22')

    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'pw')
    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('hunter22')
  })

  it('reaches the toggle with Tab after the input and never submits a form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault()
    })
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput aria-label="Password" />
      </form>,
    )

    await user.tab()
    expect(screen.getByLabelText('Password')).toHaveFocus()
    await user.tab()
    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(toggle).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables the toggle with the input', () => {
    render(<PasswordInput aria-label="Password" disabled />)
    expect(screen.getByLabelText('Password')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled()
  })
})

describe('SearchInput', () => {
  function ControlledSearch({ onClear }: { onClear?: () => void }) {
    const [query, setQuery] = useState('')
    return (
      <SearchInput
        aria-label="Search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
        }}
        onClear={() => {
          onClear?.()
          setQuery('')
        }}
      />
    )
  }

  it('is a searchbox with a clear button only while it has a value', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<ControlledSearch onClear={onClear} />)

    const input = screen.getByRole('searchbox', { name: 'Search' })
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    await user.type(input, 'tabs')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(onClear).toHaveBeenCalledOnce()
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('clears on Escape', async () => {
    const user = userEvent.setup()
    render(<ControlledSearch />)

    const input = screen.getByRole('searchbox', { name: 'Search' })
    await user.type(input, 'dialog{Escape}')
    expect(input).toHaveValue('')
  })

  it('forwards its ref to the input', () => {
    let node: HTMLInputElement | null = null
    render(
      <SearchInput
        aria-label="Search"
        ref={(element) => {
          node = element
        }}
      />,
    )
    expect(node).toBe(screen.getByRole('searchbox', { name: 'Search' }))
  })
})
