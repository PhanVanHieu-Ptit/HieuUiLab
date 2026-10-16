import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  NotificationCenter,
  type NotificationCenterProps,
  type NotificationEntry,
} from './notification-center'

const asOf = '2026-10-12T18:00:00Z'

function entry(overrides: Partial<NotificationEntry> & Pick<NotificationEntry, 'id'>) {
  return {
    type: 'system',
    title: `Notification ${overrides.id}`,
    timestamp: '2026-10-12T17:00:00Z',
    read: false,
    ...overrides,
  } satisfies NotificationEntry
}

const lan = entry({
  id: 'a',
  type: 'mention',
  title: 'Lan mentioned you',
  timestamp: '2026-10-12T17:42:00Z',
})
const signIn = entry({
  id: 'b',
  type: 'security',
  title: 'New sign-in',
  timestamp: '2026-10-12T15:00:00Z',
})
const maintenance = entry({
  id: 'c',
  type: 'system',
  title: 'Maintenance planned',
  timestamp: '2026-10-11T09:00:00Z',
  read: true,
})
const amara = entry({
  id: 'd',
  type: 'mention',
  title: 'Amara replied',
  timestamp: '2026-10-09T13:20:00Z',
  description: 'Agreed.',
})

const items: readonly NotificationEntry[] = [lan, signIn, maintenance, amara]

type Rendered = Omit<NotificationCenterProps, 'state' | 'asOf' | 'onMarkRead' | 'onMarkAllRead'> &
  Partial<Pick<NotificationCenterProps, 'onMarkRead' | 'onMarkAllRead'>> & {
    initial?: readonly NotificationEntry[]
  }

/** Keeps the items in state the way a consumer would. */
function Harness({ initial = items, onMarkRead, onMarkAllRead, ...props }: Rendered) {
  const [current, setCurrent] = useState(initial)
  return (
    <NotificationCenter
      {...props}
      asOf={asOf}
      state={{ status: 'ready', items: current }}
      onMarkRead={(id) => {
        onMarkRead?.(id)
        setCurrent((all) => all.map((item) => (item.id === id ? { ...item, read: true } : item)))
      }}
      onMarkAllRead={() => {
        onMarkAllRead?.()
        setCurrent((all) => all.map((item) => ({ ...item, read: true })))
      }}
    />
  )
}

function list() {
  return screen.getByRole('list', { name: 'Notifications' })
}

describe('NotificationCenter', () => {
  it('lists the notifications with their time relative to asOf', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toBeInTheDocument()
    expect(within(list()).getAllByRole('article')).toHaveLength(4)
    const timeOf = (title: RegExp) =>
      within(screen.getByRole('article', { name: title })).getByRole('time')
    expect(timeOf(/Lan mentioned you/)).toHaveTextContent('18 minutes ago')
    expect(timeOf(/New sign-in/)).toHaveTextContent('3 hours ago')
    expect(timeOf(/Maintenance planned/)).toHaveTextContent('Yesterday')
    expect(timeOf(/Amara replied/)).toHaveTextContent('3 days ago')
  })

  it('switches to a short date after a week', () => {
    render(<Harness initial={[entry({ id: 'old', timestamp: '2026-10-02T09:00:00Z' })]} />)

    expect(screen.getByText('Oct 2')).toBeInTheDocument()
  })

  it('announces how many are unread from a status region', () => {
    render(<Harness />)

    expect(screen.getByRole('status')).toHaveTextContent('3 unread')
    expect(screen.getByRole('tab', { name: 'Unread (3)' })).toBeInTheDocument()
  })

  it('shows only unread notifications on the Unread tab', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('tab', { name: 'Unread (3)' }))

    const titles = within(list())
      .getAllByRole('article')
      .map((article) => article.textContent)
    expect(titles).toHaveLength(3)
    expect(titles.join(' ')).not.toContain('Maintenance planned')
    expect(screen.getByRole('tab', { name: 'Unread (3)' })).toHaveAttribute('aria-selected', 'true')
  })

  it('filters by type', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    screen.getByRole('combobox', { name: 'Filter by type' }).focus()
    await user.keyboard('{Enter}')
    await user.click(await screen.findByRole('option', { name: 'Security' }))

    expect(within(list()).getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('New sign-in')).toBeInTheDocument()
  })

  it('uses translated type labels', async () => {
    const user = userEvent.setup()
    render(<Harness typeLabels={{ security: 'Sicherheit' }} />)

    screen.getByRole('combobox', { name: 'Filter by type' }).focus()
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('option', { name: 'Sicherheit' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Mentions' })).toBeInTheDocument()
  })

  it('reports which notification was marked read and updates the count', async () => {
    const user = userEvent.setup()
    const onMarkRead = vi.fn()
    render(<Harness onMarkRead={onMarkRead} />)

    await user.click(screen.getByRole('button', { name: 'Mark as read: Lan mentioned you' }))

    expect(onMarkRead).toHaveBeenCalledExactlyOnceWith('a')
    expect(screen.getByRole('status')).toHaveTextContent('2 unread')
    expect(screen.queryByRole('button', { name: 'Mark as read: Lan mentioned you' })).toBeNull()
  })

  it('marks everything read', async () => {
    const user = userEvent.setup()
    const onMarkAllRead = vi.fn()
    render(<Harness onMarkAllRead={onMarkAllRead} />)

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))

    expect(onMarkAllRead).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('You’re all caught up.')
  })

  it('keeps Mark all as read focusable but inert, with a reason, when nothing is unread', async () => {
    const user = userEvent.setup()
    const onMarkAllRead = vi.fn()
    render(
      <Harness
        initial={items.map((item) => ({ ...item, read: true }))}
        onMarkAllRead={onMarkAllRead}
      />,
    )
    const button = screen.getByRole('button', { name: 'Mark all as read' })

    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAccessibleDescription('There are no unread notifications to mark.')
    await user.click(button)
    expect(onMarkAllRead).not.toHaveBeenCalled()
    button.focus()
    expect(button).toHaveFocus()
  })

  it('moves focus to the next unread item after one is marked read', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('tab', { name: 'Unread (3)' }))

    await user.click(screen.getByRole('button', { name: 'Mark as read: Lan mentioned you' }))

    expect(screen.getByRole('button', { name: 'Mark as read: New sign-in' })).toHaveFocus()
  })

  it('moves focus to the panel when the last unread item is marked read', async () => {
    const user = userEvent.setup()
    render(<Harness initial={[amara]} />)

    await user.click(screen.getByRole('button', { name: 'Mark as read: Amara replied' }))

    expect(screen.getByRole('status')).toHaveTextContent('You’re all caught up.')
    expect(screen.getByRole('region', { name: 'Notifications' }).firstElementChild).toHaveFocus()
  })

  describe('empty states', () => {
    it('explains an empty inbox', () => {
      render(<Harness initial={[]} />)

      expect(screen.getByRole('heading', { name: 'No notifications yet' })).toBeInTheDocument()
    })

    it('says everything is read on the Unread tab and offers a way back', async () => {
      const user = userEvent.setup()
      render(<Harness initial={items.map((item) => ({ ...item, read: true }))} />)

      await user.click(screen.getByRole('tab', { name: 'Unread' }))
      expect(screen.getByRole('heading', { name: 'You’re all caught up' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Show all notifications' }))
      expect(within(list()).getAllByRole('article')).toHaveLength(4)
      expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true')
    })

    it('says when the type filter matches nothing', async () => {
      const user = userEvent.setup()
      render(<Harness initial={[lan]} />)

      screen.getByRole('combobox', { name: 'Filter by type' }).focus()
      await user.keyboard('{Enter}')
      await user.click(await screen.findByRole('option', { name: 'Security' }))

      expect(
        screen.getByRole('heading', { name: 'Nothing matches this filter' }),
      ).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Show all notifications' }))
      expect(within(list()).getAllByRole('article')).toHaveLength(1)
    })
  })

  describe('loading and error', () => {
    it('announces loading and marks the panel busy', () => {
      render(
        <NotificationCenter
          state={{ status: 'loading' }}
          asOf={asOf}
          onMarkRead={vi.fn()}
          onMarkAllRead={vi.fn()}
        />,
      )

      expect(
        screen.getByRole('region', { name: 'Notifications' }).firstElementChild,
      ).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByText('Loading notifications…')).toBeInTheDocument()
      expect(screen.queryByRole('tab')).toBeNull()
      expect(screen.getByRole('button', { name: 'Mark all as read' })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    })

    it('shows the error as an alert and retries', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(
        <NotificationCenter
          state={{ status: 'error', message: 'Mock: the service did not respond.' }}
          asOf={asOf}
          onMarkRead={vi.fn()}
          onMarkAllRead={vi.fn()}
          onRetry={onRetry}
        />,
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Mock: the service did not respond.')
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('offers no retry without a handler', () => {
      render(
        <NotificationCenter
          state={{ status: 'error' }}
          asOf={asOf}
          onMarkRead={vi.fn()}
          onMarkAllRead={vi.fn()}
        />,
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    })
  })

  it('uses a custom title for the heading and the list', () => {
    render(<Harness title="Inbox" />)

    expect(screen.getByRole('heading', { level: 2, name: 'Inbox' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Inbox' })).toBeInTheDocument()
  })
})
