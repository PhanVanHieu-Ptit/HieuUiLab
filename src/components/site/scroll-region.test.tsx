import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ScrollRegion } from './scroll-region'

function sizes(size: {
  scrollWidth: number
  clientWidth: number
  scrollHeight: number
  clientHeight: number
}) {
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(size.scrollWidth)
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(size.clientWidth)
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(size.scrollHeight)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(size.clientHeight)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ScrollRegion', () => {
  it('adds no tab stop and no landmark while the content fits', () => {
    sizes({ scrollWidth: 100, clientWidth: 100, scrollHeight: 50, clientHeight: 50 })
    render(
      <ScrollRegion label="Wide table, scrollable">
        <p>Content</p>
      </ScrollRegion>,
    )
    expect(screen.queryByRole('region')).toBeNull()
    expect(screen.getByText('Content').parentElement).not.toHaveAttribute('tabindex')
  })

  it('becomes a focusable, named region when the content is wider', () => {
    sizes({ scrollWidth: 400, clientWidth: 100, scrollHeight: 50, clientHeight: 50 })
    render(
      <ScrollRegion label="Wide table, scrollable">
        <p>Content</p>
      </ScrollRegion>,
    )
    const region = screen.getByRole('region', { name: 'Wide table, scrollable' })
    expect(region).toHaveAttribute('tabindex', '0')
  })

  it('becomes a focusable region when the content is taller too', () => {
    sizes({ scrollWidth: 100, clientWidth: 100, scrollHeight: 900, clientHeight: 300 })
    render(
      <ScrollRegion label="Long code, scrollable">
        <p>Content</p>
      </ScrollRegion>,
    )
    expect(screen.getByRole('region', { name: 'Long code, scrollable' })).toHaveAttribute(
      'tabindex',
      '0',
    )
  })

  it('applies the overflow classes it is given', () => {
    sizes({ scrollWidth: 100, clientWidth: 100, scrollHeight: 50, clientHeight: 50 })
    render(
      <ScrollRegion label="x" className="max-h-128 overflow-auto">
        <p>Content</p>
      </ScrollRegion>,
    )
    expect(screen.getByText('Content').parentElement).toHaveClass('max-h-128', 'overflow-auto')
  })
})
