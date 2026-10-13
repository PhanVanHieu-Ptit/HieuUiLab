import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './sheet'

describe('Dialog', () => {
  it('opens a labelled modal, traps focus, and closes with the close button', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Confirm</DialogTitle>
          <DialogDescription>Are you sure?</DialogDescription>
          <button type="button">Inside</button>
        </DialogContent>
      </Dialog>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Confirm' })
    expect(dialog).toHaveAccessibleDescription('Are you sure?')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })

  it('can hide the close button', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showClose={false} aria-describedby={undefined}>
          <DialogTitle>Search</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })
})

describe('Sheet', () => {
  it('slides in from the chosen side and closes on Escape', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Filters</SheetTrigger>
        <SheetContent side="right">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the list.</SheetDescription>
        </SheetContent>
      </Sheet>,
    )
    const trigger = screen.getByRole('button', { name: 'Filters' })
    await user.click(trigger)

    const sheet = await screen.findByRole('dialog', { name: 'Filters' })
    expect(sheet).toHaveClass('right-0', 'bg-popover')

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })
})
