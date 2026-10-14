import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Checkbox } from './checkbox'
import { Label } from './label'

describe('Checkbox', () => {
  it('is a checkbox named by its label and toggles with Space and click', async () => {
    const user = userEvent.setup()
    render(
      <div className="flex items-center gap-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms</Label>
      </div>,
    )
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' })
    expect(checkbox).not.toBeChecked()

    await user.tab()
    expect(checkbox).toHaveFocus()
    await user.keyboard(' ')
    expect(checkbox).toBeChecked()

    await user.click(screen.getByText('Accept terms'))
    expect(checkbox).not.toBeChecked()
  })

  it('reports an indeterminate state as mixed', () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" />)
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' })
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed')
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate')
  })

  it('stays put when controlled and only reports the requested change', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Notify" checked={false} onCheckedChange={onCheckedChange} />)
    await user.click(screen.getByRole('checkbox', { name: 'Notify' }))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('checkbox', { name: 'Notify' })).not.toBeChecked()
  })

  it('cannot be toggled when disabled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Locked" disabled onCheckedChange={onCheckedChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Locked' })
    expect(checkbox).toBeDisabled()
    await user.click(checkbox)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('submits its value with the surrounding form', async () => {
    const user = userEvent.setup()
    let submitted: FormData | undefined
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitted = new FormData(event.currentTarget)
        }}
      >
        <Checkbox aria-label="Newsletter" name="newsletter" value="yes" defaultChecked />
        <button type="submit">Save</button>
      </form>,
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(submitted?.get('newsletter')).toBe('yes')
  })

  it('applies size classes', () => {
    render(<Checkbox aria-label="Small" size="sm" />)
    expect(screen.getByRole('checkbox', { name: 'Small' })).toHaveClass('size-3.5')
  })
})
