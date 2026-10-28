import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DemoErrorBoundary } from './demo-error-boundary'

function Broken(): never {
  throw new Error('Chunk missing')
}

describe('DemoErrorBoundary', () => {
  it('shows what it holds while nothing fails', () => {
    render(
      <DemoErrorBoundary>
        <p>A demo</p>
      </DemoErrorBoundary>,
    )
    expect(screen.getByText('A demo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('contains a failing child and offers a reload', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <DemoErrorBoundary>
        <Broken />
      </DemoErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('This demo couldn’t load')
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
    error.mockRestore()
  })

  it('shows its children again once it is given a new key', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { rerender } = render(
      <DemoErrorBoundary key="first">
        <Broken />
      </DemoErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // A boundary keeps its failed state for as long as it is the same element; callers key it by
    // what it shows, so moving to another demo starts over.
    rerender(
      <DemoErrorBoundary key="second">
        <p>Another demo</p>
      </DemoErrorBoundary>,
    )
    expect(screen.getByText('Another demo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    error.mockRestore()
  })
})
