import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mockMatchMedia } from '@/test/media'

import type { ActivityEntry } from './activity-list'
import {
  filterOrders,
  OrdersDashboard,
  summarizeOrders,
  type DashboardNotification,
  type Order,
} from './orders-dashboard'

const asOf = '2026-10-12T18:00:00Z'

function order(overrides: Partial<Order> & Pick<Order, 'id'>): Order {
  return {
    number: `#${overrides.id}`,
    customer: { name: 'Mai Tran', email: 'mai@example.com' },
    city: 'Hà Nội',
    status: 'pending',
    channel: 'web',
    itemCount: 1,
    totalCents: 1000,
    placedAt: '2026-10-12T10:00:00Z',
    ...overrides,
  }
}

const orders: readonly Order[] = [
  order({
    id: '1001',
    customer: { name: 'Nguyễn Thị Lan', email: 'lan.nguyen@example.com' },
    status: 'pending',
    totalCents: 5000,
    placedAt: '2026-10-12T09:00:00Z',
  }),
  order({
    id: '1002',
    customer: { name: 'Trần Minh Đức', email: 'duc.tran@example.com' },
    status: 'processing',
    channel: 'mobile',
    totalCents: 12000,
    placedAt: '2026-10-11T09:00:00Z',
  }),
  order({
    id: '1003',
    customer: { name: 'Zoë Müller', email: 'zoe.mueller@example.com' },
    status: 'delivered',
    channel: 'marketplace',
    totalCents: 3000,
    placedAt: '2026-10-03T09:00:00Z',
  }),
  order({
    id: '1004',
    customer: { name: 'José Álvarez', email: 'jose.alvarez@example.com' },
    status: 'cancelled',
    totalCents: 8000,
    placedAt: '2026-10-10T09:00:00Z',
  }),
  order({
    id: '1005',
    customer: { name: 'Amara Okafor', email: 'amara@example.com' },
    status: 'shipped',
    channel: 'mobile',
    totalCents: 2000,
    placedAt: '2026-10-01T09:00:00Z',
  }),
]

const all = { query: '', status: 'all', channel: 'all' } as const

describe('filterOrders', () => {
  const ids = (list: readonly Order[]) => list.map((item) => item.id)

  it('returns everything without filters', () => {
    expect(ids(filterOrders(orders, all))).toEqual(['1001', '1002', '1003', '1004', '1005'])
  })

  it('ignores case, accents, and surrounding spaces', () => {
    expect(ids(filterOrders(orders, { ...all, query: '  NGUYEN ' }))).toEqual(['1001'])
    expect(ids(filterOrders(orders, { ...all, query: 'duc' }))).toEqual(['1002'])
    expect(ids(filterOrders(orders, { ...all, query: 'zoe muller' }))).toEqual(['1003'])
    expect(ids(filterOrders(orders, { ...all, query: 'Álvarez' }))).toEqual(['1004'])
  })

  it('matches order numbers and emails', () => {
    expect(ids(filterOrders(orders, { ...all, query: '#1005' }))).toEqual(['1005'])
    expect(ids(filterOrders(orders, { ...all, query: 'example.com' }))).toHaveLength(5)
    expect(ids(filterOrders(orders, { ...all, query: 'mueller@' }))).toEqual(['1003'])
  })

  it('requires every filter to match', () => {
    expect(ids(filterOrders(orders, { ...all, channel: 'mobile' }))).toEqual(['1002', '1005'])
    expect(ids(filterOrders(orders, { ...all, channel: 'mobile', status: 'shipped' }))).toEqual([
      '1005',
    ])
    expect(filterOrders(orders, { query: 'lan', status: 'shipped', channel: 'all' })).toEqual([])
  })
})

describe('summarizeOrders', () => {
  it('splits orders into the last 7 days and the 7 before, excluding cancelled revenue', () => {
    const summary = summarizeOrders(orders, asOf)
    expect(summary.openOrders).toBe(2)
    // 1001, 1002, and the cancelled 1004 fall in Oct 5 18:00 – Oct 12 18:00.
    expect(summary.current).toEqual({
      revenueCents: 17000,
      orderCount: 3,
      keptCount: 2,
      cancelledCount: 1,
    })
    expect(summary.previous).toEqual({
      revenueCents: 5000,
      orderCount: 2,
      keptCount: 2,
      cancelledCount: 0,
    })
  })

  it('ignores orders outside both windows, including ones after asOf', () => {
    const summary = summarizeOrders(
      [
        order({ id: 'old', placedAt: '2026-09-01T00:00:00Z' }),
        order({ id: 'future', placedAt: '2026-10-13T00:00:00Z' }),
      ],
      asOf,
    )
    expect(summary.current.orderCount).toBe(0)
    expect(summary.previous.orderCount).toBe(0)
    expect(summary.openOrders).toBe(2)
  })
})

const activity: readonly ActivityEntry[] = [
  {
    id: 'a1',
    actor: 'Diego Ruiz',
    action: 'cancelled',
    target: 'order #1004',
    timestamp: '2026-10-10T19:00:00Z',
  },
]

const notifications: readonly DashboardNotification[] = [
  {
    id: 'n2',
    title: 'Low stock: Linen tote',
    description: '4 left.',
    timestamp: '2026-10-12T09:10:00Z',
    read: false,
  },
  {
    id: 'n1',
    title: 'Weekly export is ready',
    description: 'As CSV.',
    timestamp: '2026-10-06T07:00:00Z',
    read: true,
  },
]

function renderDashboard(data: readonly Order[] = orders) {
  return render(
    <OrdersDashboard orders={data} activity={activity} notifications={notifications} asOf={asOf} />,
  )
}

const table = () => screen.getByRole('table', { name: 'Orders' })
const orderNumbers = () =>
  within(table())
    .queryAllByRole('rowheader')
    .map((cell) => cell.textContent)
const searchBox = () => screen.getByRole('searchbox', { name: 'Search orders' })
const resultCount = () => screen.getByText(/^\d+ orders?$/)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OrdersDashboard', () => {
  it('derives every metric from the orders it is given', () => {
    renderDashboard()
    const metric = (label: string) => screen.getByText(label).closest('dl')
    expect(metric('Open orders')).toHaveTextContent('Open orders2Pending or processing')
    expect(metric('Revenue, last 7 days')).toHaveTextContent('$170')
    expect(metric('Revenue, last 7 days')).toHaveTextContent(
      'Up 240% compared with the previous 7 days',
    )
    expect(metric('Average order value')).toHaveTextContent('$85.00')
    expect(metric('Cancellation rate')).toHaveTextContent('33.3%')
    expect(metric('Cancellation rate')).toHaveTextContent(
      'Up 33.3 pts compared with the previous 7 days',
    )
  })

  it('lists orders newest first by default', () => {
    renderDashboard()
    expect(orderNumbers()).toEqual(['#1001', '#1002', '#1004', '#1003', '#1005'])
    expect(within(table()).getByRole('columnheader', { name: 'Placed' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
  })

  it('narrows rows with search and status filters and announces the count', async () => {
    const user = userEvent.setup()
    renderDashboard()
    expect(resultCount()).toHaveTextContent('5 orders')

    await user.type(searchBox(), 'example')
    expect(resultCount()).toHaveTextContent('5 orders')

    screen.getByRole('combobox', { name: 'Status' }).focus()
    await user.keyboard('{Enter}')
    await user.click(await screen.findByRole('option', { name: 'Processing' }))
    expect(orderNumbers()).toEqual(['#1002'])
    expect(resultCount()).toHaveTextContent('1 order')
    expect(resultCount()).toHaveAttribute('role', 'status')
  })

  it('shows a filtered empty state whose action clears the filters', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.type(searchBox(), 'nobody by this name')

    expect(orderNumbers()).toEqual([])
    expect(
      within(table()).getByRole('heading', { name: 'No orders match these filters' }),
    ).toBeInTheDocument()
    await user.click(within(table()).getByRole('button', { name: 'Clear filters' }))
    expect(searchBox()).toHaveValue('')
    expect(orderNumbers()).toHaveLength(5)
  })

  it('sorts by total from the keyboard', async () => {
    const user = userEvent.setup()
    renderDashboard()
    screen.getByRole('button', { name: 'Total' }).focus()
    await user.keyboard('{Enter}')
    expect(orderNumbers()).toEqual(['#1005', '#1003', '#1001', '#1004', '#1002'])
    await user.keyboard('{Enter}')
    expect(orderNumbers()).toEqual(['#1002', '#1004', '#1001', '#1003', '#1005'])
  })

  it('returns to page 1 when the filters change', async () => {
    const user = userEvent.setup()
    const many = Array.from({ length: 25 }, (_, index) =>
      order({
        id: String(2000 + index),
        placedAt: `2026-10-${String(10 + (index % 3))}T09:00:00Z`,
      }),
    )
    renderDashboard(many)
    await user.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(screen.getByText('21–25 of 25 orders')).toBeInTheDocument()

    await user.type(searchBox(), '20')
    expect(screen.getByText('1–10 of 25 orders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks selected open orders as shipped and records the activity', async () => {
    const user = userEvent.setup()
    renderDashboard()
    const ship = screen.getByRole('button', { name: 'Mark as shipped' })
    expect(ship).toHaveAttribute('aria-disabled', 'true')
    expect(ship).toHaveAccessibleDescription(
      'Select pending or processing orders to ship or cancel them.',
    )

    await user.click(screen.getByRole('checkbox', { name: 'Select order #1001' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select order #1003' }))
    // #1003 is delivered, so only one of the two can be shipped.
    const shipOne = screen.getByRole('button', { name: 'Mark 1 as shipped' })
    expect(shipOne).toHaveAccessibleDescription('1 of 2 selected can be updated.')
    await user.click(shipOne)

    const row = screen.getByRole('rowheader', { name: '#1001' }).closest('tr')
    expect(row && within(row).getByText('Shipped')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Select order #1001' })).not.toBeChecked()
    const feed = screen.getByRole('list', { name: 'Recent activity' })
    expect(within(feed).getAllByRole('listitem')[0]).toHaveTextContent(
      'You marked as shipped order #1001',
    )
    expect(screen.getByText('Open orders').closest('dl')).toHaveTextContent(
      'Open orders1Pending or processing',
    )
  })

  it('drops selected rows that a new filter hides', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('checkbox', { name: 'Select order #1001' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select order #1002' }))
    expect(screen.getByRole('button', { name: 'Mark 2 as shipped' })).toBeInTheDocument()

    await user.type(searchBox(), 'duc')
    expect(screen.getByRole('button', { name: 'Mark 1 as shipped' })).toBeInTheDocument()
    await user.clear(searchBox())
    expect(screen.getByRole('checkbox', { name: 'Select order #1001' })).not.toBeChecked()
  })

  it('cancels only after confirmation, and keeps orders when dismissed', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('checkbox', { name: 'Select order #1002' }))

    await user.click(screen.getByRole('button', { name: 'Cancel 1…' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancel 1 order?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keep orders' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    const row = () => screen.getByRole('rowheader', { name: '#1002' }).closest('tr')
    expect(row()).toHaveTextContent('Processing')

    await user.click(screen.getByRole('button', { name: 'Cancel 1…' }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel orders' }),
    )
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(row()).toHaveTextContent('Cancelled')
  })

  it('opens order details from the row and closes back to it', async () => {
    mockMatchMedia((query) => query === '(min-width: 80rem)')
    const user = userEvent.setup()
    renderDashboard()
    const open = screen.getByRole('button', { name: '#1002' })
    expect(open).toHaveAccessibleDescription('Opens order details')

    await user.click(open)
    const panel = screen.getByRole('complementary', { name: 'Order #1002' })
    expect(within(panel).getByText('duc.tran@example.com')).toBeInTheDocument()
    expect(open.closest('tr')).toHaveAttribute('data-active')

    await user.click(within(panel).getByRole('button', { name: 'Mark as shipped' }))
    expect(within(panel).getByText('Shipped orders can no longer be changed.')).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Mark as shipped' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    await user.click(within(panel).getByRole('button', { name: 'Close details' }))
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(open).toHaveFocus()
  })

  it('marks notifications as read one at a time or all together', async () => {
    const user = userEvent.setup()
    renderDashboard()
    expect(screen.getByText('(1 unread)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mark as read: Low stock: Linen tote' }))
    expect(screen.queryByText('(1 unread)')).toBeNull()
    expect(screen.getByRole('button', { name: 'Mark all read' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('shows an empty state in every section without data', () => {
    render(<OrdersDashboard orders={[]} activity={[]} notifications={[]} asOf={asOf} />)
    expect(within(table()).getByRole('heading', { name: 'No orders yet' })).toBeInTheDocument()
    expect(screen.getByText('You’re all caught up.')).toBeInTheDocument()
    expect(screen.getByText('No activity yet.')).toBeInTheDocument()
    expect(screen.getByText('Open orders').closest('dl')).toHaveTextContent(
      'Open orders0Pending or processing',
    )
  })
})
