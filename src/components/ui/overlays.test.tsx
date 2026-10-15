import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type SyntheticEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'
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

  it('portals into a given container, without passing it on to the DOM', async () => {
    const user = userEvent.setup()
    const host = document.createElement('div')
    host.dataset.testid = 'host'
    document.body.append(host)
    try {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent container={host} aria-describedby={undefined}>
            <DialogTitle>Contained</DialogTitle>
          </DialogContent>
        </Dialog>,
      )
      await user.click(screen.getByRole('button', { name: 'Open' }))
      const dialog = await screen.findByRole('dialog', { name: 'Contained' })
      expect(host).toContainElement(dialog)
      expect(dialog).not.toHaveAttribute('container')
    } finally {
      host.remove()
    }
  })

  it('portals into document.body without a container', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Loose</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = await screen.findByRole('dialog', { name: 'Loose' })
    expect(container).not.toContainElement(dialog)
    expect(document.body).toContainElement(dialog)
  })

  it('can be controlled and closed from outside', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    function Controlled() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(true)
            }}
          >
            Rename
          </button>
          <Dialog
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next)
              setOpen(next)
            }}
          >
            <DialogContent aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Rename</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    expect(await screen.findByRole('dialog', { name: 'Rename' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('submits a form from the footer and keeps Tab inside the dialog', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()
      return new FormData(event.currentTarget).get('name')
    })
    render(
      <Dialog defaultOpen>
        <DialogContent aria-describedby={undefined}>
          <form onSubmit={onSubmit} className="contents">
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <input aria-label="Name" name="name" defaultValue="Lab" />
            </DialogBody>
            <DialogFooter>
              <DialogClose type="button">Cancel</DialogClose>
              <button type="submit">Create</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>,
    )
    const dialog = await screen.findByRole('dialog', { name: 'New project' })
    // Tab cycles through the fields and the close button without leaving the dialog.
    for (let step = 0; step < 6; step += 1) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(onSubmit).toHaveReturnedWith('Lab')
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
