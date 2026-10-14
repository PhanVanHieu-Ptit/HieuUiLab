import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

function CopyTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" aria-label="Copy">
          C
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy to clipboard</TooltipContent>
    </Tooltip>
  )
}

describe('Tooltip', () => {
  it('works without an explicit provider and opens on keyboard focus', async () => {
    const user = userEvent.setup()
    render(<CopyTooltip />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.tab()
    const trigger = screen.getByRole('button', { name: 'Copy' })
    expect(trigger).toHaveFocus()

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Copy to clipboard')
    expect(trigger).toHaveAccessibleDescription('Copy to clipboard')
  })

  it('closes on Escape and keeps focus on the trigger', async () => {
    const user = userEvent.setup()
    render(<CopyTooltip />)
    await user.tab()
    await screen.findByRole('tooltip')

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus()
  })

  it('shares one provider between tooltips', async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider delayDuration={0}>
        <CopyTooltip />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Paste">P</Button>
          </TooltipTrigger>
          <TooltipContent>Paste from clipboard</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Copy to clipboard')
    await user.tab()
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Paste from clipboard')
    })
  })

  it('can be controlled', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Tooltip open={false} onOpenChange={onOpenChange}>
        <TooltipTrigger>Info</TooltipTrigger>
        <TooltipContent>Details</TooltipContent>
      </Tooltip>,
    )
    await user.tab()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    rerender(
      <Tooltip open onOpenChange={onOpenChange}>
        <TooltipTrigger>Info</TooltipTrigger>
        <TooltipContent>Details</TooltipContent>
      </Tooltip>,
    )
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Details')
  })

  it('stays open for keyboard focus when the page scrolls, and closes on blur', async () => {
    const user = userEvent.setup()
    render(
      <>
        <CopyTooltip />
        <button type="button">Next</button>
      </>,
    )
    await user.tab()
    await screen.findByRole('tooltip')

    // Focusing a trigger below the fold scrolls the page; Radix closes tooltips on scroll.
    fireEvent.scroll(document)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.tab()
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

  it('closes when the focused trigger is activated', async () => {
    const user = userEvent.setup()
    render(<CopyTooltip />)
    await user.tab()
    await screen.findByRole('tooltip')
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })
})
