import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Checkbox } from './checkbox'
import { Input } from './input'
import { Label } from './label'

describe('Label', () => {
  it('focuses its control when clicked', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Label htmlFor="title">Title</Label>
        <Input id="title" />
      </>,
    )
    await user.click(screen.getByText('Title'))
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus()
  })

  it('shows a required marker that is hidden from the accessible name', () => {
    render(
      <>
        <Label htmlFor="project" required>
          Project
        </Label>
        <Input id="project" required />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Project' })
    expect(input).toBeRequired()
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('toggles a wrapped checkbox and dims when a peer control is disabled', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Checkbox id="beta" disabled />
        <Label htmlFor="beta">Beta features</Label>
      </>,
    )
    const checkbox = screen.getByRole('checkbox', { name: 'Beta features' })
    await user.click(screen.getByText('Beta features'))
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText('Beta features')).toHaveClass('peer-disabled:opacity-50')
  })
})
