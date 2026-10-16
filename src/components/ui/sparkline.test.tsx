import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sparkline, sparklinePath } from './sparkline'

describe('sparklinePath', () => {
  it('scales the series to its own range, oldest value first', () => {
    // 0 → bottom, 10 → top, with the default 2 unit inset in a 100×32 box.
    const { line } = sparklinePath([0, 5, 10], 100, 32)
    expect(line).toBe('M0,30 L50,16 L100,2')
  })

  it('draws a constant series as a level line in the middle', () => {
    expect(sparklinePath([4, 4, 4], 100, 32).line).toBe('M0,16 L50,16 L100,16')
  })

  it('draws a single value as a level line across the width', () => {
    expect(sparklinePath([7], 100, 32).line).toBe('M0,16 L100,16')
  })

  it('returns empty paths for no usable values', () => {
    expect(sparklinePath([], 100, 32)).toEqual({ line: '', area: '' })
    expect(sparklinePath([Number.NaN, Number.POSITIVE_INFINITY], 100, 32)).toEqual({
      line: '',
      area: '',
    })
  })

  it('ignores non-finite values and spaces the rest evenly', () => {
    expect(sparklinePath([0, Number.NaN, 10], 100, 32).line).toBe('M0,30 L100,2')
  })

  it('handles negative values', () => {
    expect(sparklinePath([-10, 0, 10], 100, 32).line).toBe('M0,30 L50,16 L100,2')
  })

  it('closes the area along the bottom edge', () => {
    expect(sparklinePath([0, 10], 100, 32).area).toBe('M0,30 L100,2 L100,32 L0,32 Z')
  })
})

describe('Sparkline', () => {
  it('is an image with a name when a label is given', () => {
    render(<Sparkline values={[1, 3, 2]} label="Signups, last 3 days: up from 1 to 2" />)

    expect(
      screen.getByRole('img', { name: 'Signups, last 3 days: up from 1 to 2' }),
    ).toBeInTheDocument()
  })

  it('is hidden from assistive technology without a label', () => {
    const { container } = render(<Sparkline values={[1, 3, 2]} />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws the line in the current color of its tone', () => {
    const { container } = render(<Sparkline values={[1, 2]} tone="destructive" />)

    expect(container.querySelector('svg')).toHaveClass('text-destructive')
    expect(container.querySelector('path')).toHaveAttribute('stroke', 'currentColor')
  })

  it('uses the primary tone by default', () => {
    const { container } = render(<Sparkline values={[1, 2]} />)

    expect(container.querySelector('svg')).toHaveClass('text-primary')
  })

  it('adds a fill under the line only when asked', () => {
    const plain = render(<Sparkline values={[1, 2, 3]} />)
    expect(plain.container.querySelectorAll('path')).toHaveLength(1)
    plain.unmount()

    const filled = render(<Sparkline values={[1, 2, 3]} area />)
    expect(filled.container.querySelectorAll('path')).toHaveLength(2)
  })

  it('renders nothing visible for an empty series', () => {
    const { container } = render(<Sparkline values={[]} label="No data" />)

    expect(container.querySelectorAll('path')).toHaveLength(0)
    expect(screen.getByRole('img', { name: 'No data' })).toBeInTheDocument()
  })

  it('merges className', () => {
    const { container } = render(<Sparkline values={[1, 2]} className="h-12" />)

    expect(container.querySelector('svg')).toHaveClass('h-12')
  })
})
