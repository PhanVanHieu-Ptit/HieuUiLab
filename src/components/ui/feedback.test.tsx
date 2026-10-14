import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Kbd } from './kbd'
import { Skeleton } from './skeleton'
import { Spinner } from './spinner'

describe('Kbd', () => {
  it('renders a semantic kbd element', () => {
    render(<Kbd>Esc</Kbd>)
    expect(screen.getByText('Esc').tagName).toBe('KBD')
  })
})

describe('Skeleton', () => {
  it('is hidden from assistive tech', () => {
    const { container } = render(<Skeleton className="h-4" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstElementChild).toHaveClass('animate-pulse', 'h-4')
  })

  it('leaves the loading announcement to the region around it', () => {
    render(
      <div aria-busy="true" aria-label="Loading posts" role="region">
        <Skeleton className="h-4" />
        <span className="sr-only">Loading…</span>
      </div>,
    )
    const region = screen.getByRole('region', { name: 'Loading posts' })
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(region).toHaveTextContent('Loading…')
  })
})

describe('Spinner', () => {
  it('announces a status with a default label', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
  })

  it('accepts a custom label', () => {
    render(<Spinner label="Saving" />)
    expect(screen.getByRole('status')).toHaveTextContent('Saving')
  })
})
