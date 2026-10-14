import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Label } from './label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select'

function Fruit(props: Partial<Parameters<typeof Select>[0]>) {
  return (
    <>
      <Label htmlFor="fruit">Fruit</Label>
      <Select {...props}>
        <SelectTrigger id="fruit">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruit</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana" disabled>
              Banana
            </SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}

describe('Select', () => {
  it('is a combobox named by its label that shows the placeholder', () => {
    render(<Fruit />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger).toHaveTextContent('Pick one')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens with the keyboard, skips disabled options, and selects with Enter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Fruit onValueChange={onValueChange} />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })

    await user.tab()
    expect(trigger).toHaveFocus()
    await user.keyboard('{Enter}')

    const listbox = await screen.findByRole('listbox')
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-disabled', 'true')
    expect(listbox).toBeInTheDocument()

    // Apple is focused on open; ArrowDown skips the disabled Banana.
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveFocus()
    })
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: 'Cherry' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(onValueChange).toHaveBeenCalledWith('cherry')
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveTextContent('Cherry')
    expect(trigger).toHaveFocus()
  })

  it('closes on Escape without changing the value and returns focus', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Fruit defaultValue="apple" onValueChange={onValueChange} />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })

    await user.tab()
    await user.keyboard('{ArrowDown}')
    await screen.findByRole('listbox')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(trigger).toHaveTextContent('Apple')
    expect(trigger).toHaveFocus()
  })

  it('shows the controlled value', () => {
    render(<Fruit value="cherry" />)
    expect(screen.getByRole('combobox', { name: 'Fruit' })).toHaveTextContent('Cherry')
  })

  it('cannot be opened when disabled', async () => {
    const user = userEvent.setup()
    render(<Fruit disabled />)
    const trigger = screen.getByRole('combobox', { name: 'Fruit' })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('applies trigger size classes', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Size" size="sm">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
      </Select>,
    )
    expect(screen.getByRole('combobox', { name: 'Size' })).toHaveClass('h-8')
  })
})
