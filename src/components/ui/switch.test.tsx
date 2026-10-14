import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Label } from './label'
import { Switch } from './switch'

describe('Switch', () => {
  it('is a switch named by its label and toggles with Space and Enter', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Switch id="wifi" />
        <Label htmlFor="wifi">Wi-Fi</Label>
      </>,
    )
    const control = screen.getByRole('switch', { name: 'Wi-Fi' })
    expect(control).not.toBeChecked()

    await user.tab()
    await user.keyboard(' ')
    expect(control).toBeChecked()
    await user.keyboard('{Enter}')
    expect(control).not.toBeChecked()
  })

  it('starts from defaultChecked when uncontrolled', () => {
    render(<Switch aria-label="Autosave" defaultChecked />)
    expect(screen.getByRole('switch', { name: 'Autosave' })).toBeChecked()
  })

  it('follows the checked prop when controlled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    function Controlled() {
      const [checked, setChecked] = useState(true)
      return (
        <>
          <Switch
            aria-label="Sync"
            checked={checked}
            onCheckedChange={(next) => {
              onCheckedChange(next)
              setChecked(next)
            }}
          />
          <output>{checked ? 'on' : 'off'}</output>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole('switch', { name: 'Sync' }))
    expect(onCheckedChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('status')).toHaveTextContent('off')
  })

  it('cannot be toggled when disabled', async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="Locked" disabled />)
    const control = screen.getByRole('switch', { name: 'Locked' })
    await user.click(control)
    expect(control).toBeDisabled()
    expect(control).not.toBeChecked()
  })

  it('applies size classes', () => {
    render(<Switch aria-label="Small" size="sm" />)
    expect(screen.getByRole('switch', { name: 'Small' })).toHaveClass('h-4', 'w-7')
  })
})
