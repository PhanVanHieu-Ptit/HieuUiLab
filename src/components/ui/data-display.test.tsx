import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MetricCard } from './metric-card'
import { NotificationItem } from './notification-item'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('writes the status out and hides the decorative dot', () => {
    const { container } = render(<StatusBadge tone="destructive">Failed</StatusBadge>)
    expect(screen.getByText('Failed')).toHaveClass('text-destructive')
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('names its failing tone like Button, Badge, and Alert do', () => {
    // `danger` was renamed to `destructive` before 0.1.0, so that one word means one thing.
    // @ts-expect-error `danger` is not a tone.
    const { container } = render(<StatusBadge tone="danger">Failed</StatusBadge>)
    expect(container).toHaveTextContent('Failed')
  })
})

describe('MetricCard', () => {
  it('pairs the label and value as a description list', () => {
    render(<MetricCard label="Open orders" value="13" footnote="Pending or processing" />)
    const term = screen.getByRole('term')
    expect(term).toHaveTextContent('Open orders')
    const values = screen.getAllByRole('definition')
    expect(values[0]).toHaveTextContent('13')
    expect(values[1]).toHaveTextContent('Pending or processing')
  })

  it('gives screen readers the change as one sentence', () => {
    render(
      <MetricCard
        label="Cancellation rate"
        value="4.2%"
        change={{ value: '1.5 pts', direction: 'down', sentiment: 'positive', period: 'last week' }}
      />,
    )
    expect(screen.getByText('Down 1.5 pts compared with last week')).toHaveClass('sr-only')
    // The visual version is hidden from assistive tech, so it is not read twice.
    expect(screen.getByText('vs last week')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('NotificationItem', () => {
  const props = {
    title: 'Payment failed for order #1064',
    description: 'The card was declined.',
    timestamp: '2026-10-12T16:30:00Z',
    timeLabel: 'Oct 12, 4:30 PM UTC',
  }

  it('announces unread state in words and marks it read', async () => {
    const user = userEvent.setup()
    const onMarkRead = vi.fn()
    render(<NotificationItem {...props} read={false} onMarkRead={onMarkRead} />)

    const article = screen.getByRole('article', { name: 'Unread: Payment failed for order #1064' })
    expect(within(article).getByText('Oct 12, 4:30 PM UTC')).toHaveAttribute(
      'datetime',
      '2026-10-12T16:30:00Z',
    )
    await user.click(
      screen.getByRole('button', { name: 'Mark as read: Payment failed for order #1064' }),
    )
    expect(onMarkRead).toHaveBeenCalledOnce()
  })

  it('has no unread text or button once read', () => {
    render(<NotificationItem {...props} read onMarkRead={vi.fn()} />)
    expect(
      screen.getByRole('article', { name: 'Payment failed for order #1064' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
