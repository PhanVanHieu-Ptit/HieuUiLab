import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from './badge'

describe('Badge', () => {
  it('renders a span with neutral defaults', () => {
    render(<Badge>New</Badge>)
    const badge = screen.getByText('New')
    expect(badge.tagName).toBe('SPAN')
    expect(badge).toHaveClass('bg-muted', 'text-muted-foreground', 'h-6')
  })

  it('maps status variants to status tokens and merges className', () => {
    render(
      <Badge variant="success" size="sm" className="ml-auto">
        Stable
      </Badge>,
    )
    expect(screen.getByText('Stable')).toHaveClass(
      'text-success',
      'border-success/40',
      'h-5',
      'ml-auto',
    )
  })

  it('forwards native attributes and ref', () => {
    let node: HTMLSpanElement | null = null
    render(
      <Badge
        title="Count"
        ref={(element) => {
          node = element
        }}
      >
        3
      </Badge>,
    )
    expect(node).toBe(screen.getByTitle('Count'))
  })
})
