import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button', () => {
  it('renders a native button with an accessible name and type="button" by default', () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('respects an explicit type', () => {
    render(<Button type="submit">Send</Button>)
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit')
  })

  it('applies variant and size classes and merges className', () => {
    render(
      <Button variant="destructive" size="lg" className="w-full">
        Delete
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveClass('bg-destructive', 'h-10', 'w-full')
  })

  it('calls onClick when clicked and when activated with the keyboard', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Run</Button>)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Run' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    await user.click(screen.getByRole('button', { name: 'Run' }))

    expect(onClick).toHaveBeenCalledTimes(3)
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Run
      </Button>,
    )
    await user.click(screen.getByRole('button', { name: 'Run' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('marks itself busy and disabled while loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Saving' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders its child element when asChild is set', () => {
    render(
      <Button asChild variant="outline">
        <a href="/docs">Docs</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link).toHaveAttribute('href', '/docs')
    expect(link).toHaveClass('border-input')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('marks the child busy and disabled, and does not follow it, when asChild is loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button asChild loading onClick={onClick}>
        <a href="#next">Go</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).toHaveAttribute('aria-busy', 'true')
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).toHaveAttribute('data-disabled')
    // The keyboard still reaches the link, so the click has to be cancelled, as a disabled button
    // would not receive it.
    link.focus()
    await user.keyboard('{Enter}')
    expect(onClick).not.toHaveBeenCalled()
    expect(window.location.hash).not.toBe('#next')
  })

  it('does the same for a disabled asChild button, without claiming it is busy', () => {
    render(
      <Button asChild disabled>
        <a href="#next">Go</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).not.toHaveAttribute('aria-busy')
  })

  it('leaves an enabled asChild button alone', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button asChild onClick={onClick}>
        <a href="#open">Go</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).not.toHaveAttribute('aria-disabled')
    expect(link).not.toHaveAttribute('data-disabled')
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('forwards ref to the underlying element', () => {
    let element: HTMLButtonElement | null = null
    render(
      <Button
        ref={(node) => {
          element = node
        }}
      >
        Ref
      </Button>,
    )
    expect(element).toBe(screen.getByRole('button', { name: 'Ref' }))
  })
})
