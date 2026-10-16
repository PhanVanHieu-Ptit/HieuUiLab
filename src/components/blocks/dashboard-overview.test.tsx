import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ActivityEntry } from './activity-list'
import {
  DashboardOverview,
  type DashboardOverviewProps,
  type DashboardOverviewState,
  type DashboardPeriod,
} from './dashboard-overview'

const asOf = '2026-10-12T18:00:00Z'

function period(name: string, value: string): DashboardPeriod {
  return {
    metrics: [
      {
        id: 'members',
        label: 'Members',
        value,
        change: {
          value: '5%',
          direction: 'up',
          sentiment: 'positive',
          period: `the previous ${name}`,
        },
        trend: [1, 2, 3],
        trendLabel: `Members, ${name}: up from 1 to 3`,
      },
      {
        id: 'time',
        label: 'Response time',
        value: '4 h',
        trend: [5, 4, 3],
        trendLabel: `Response time, ${name}: down from 5 to 3`,
        tone: 'success',
      },
    ],
    trend: {
      name: 'Tasks completed',
      summary: `Tasks completed, ${name}: up from 10 to 1,200`,
      points: [
        { label: 'Oct 1', value: 10 },
        { label: 'Oct 2', value: 1200 },
      ],
    },
    highlights: [
      {
        id: 'a',
        name: 'Atlas redesign',
        figure: '212 tasks',
        status: { label: 'On track', tone: 'success' },
      },
      {
        id: 'b',
        name: 'Billing cleanup',
        figure: '168 tasks',
        status: { label: 'At risk', tone: 'warning' },
      },
    ],
  }
}

const activity: readonly ActivityEntry[] = [
  {
    id: 'x',
    actor: 'Lan Anh',
    action: 'completed',
    target: '“Launch email”',
    timestamp: '2026-10-12T17:12:00Z',
  },
]

const ready: DashboardOverviewState = {
  status: 'ready',
  periods: { '7d': period('7 days', '148'), '30d': period('30 days', '151') },
  activity,
}

function renderOverview(props: Partial<DashboardOverviewProps> = {}) {
  return render(<DashboardOverview state={ready} asOf={asOf} {...props} />)
}

describe('DashboardOverview', () => {
  it('names the page and says when the data ends, in UTC', () => {
    renderOverview({ description: 'Workspace usage.' })

    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Overview' })).toHaveTextContent(
      /Workspace usage\. Data as of Oct 12, 2026, 6:00.PM UTC\./,
    )
  })

  it('shows a card per metric with its figure and a sentence for the change', () => {
    renderOverview()

    const members = screen.getByText('Members').closest('dl')
    expect(members).not.toBeNull()
    expect(within(members as HTMLElement).getByText('148')).toBeInTheDocument()
    expect(
      within(members as HTMLElement).getByText('Up 5% compared with the previous 7 days'),
    ).toBeInTheDocument()
    expect(screen.getByText('4 h')).toBeInTheDocument()
  })

  it('describes every chart in words', () => {
    renderOverview()

    expect(screen.getByRole('img', { name: 'Members, 7 days: up from 1 to 3' })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Response time, 7 days: down from 5 to 3' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Tasks completed, 7 days: up from 10 to 1,200' }),
    ).toBeInTheDocument()
  })

  it('offers the main trend as a table', () => {
    renderOverview()

    const table = screen.getByRole('table', { name: 'Tasks completed' })
    expect(within(table).getByRole('rowheader', { name: 'Oct 2' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '1,200' })).toBeInTheDocument()
    expect(screen.getByText('View data as table').closest('details')).toContainElement(table)
  })

  it('captions the chart with its first and last labels', () => {
    renderOverview()

    const caption = screen.getByText('Oct 1', { selector: 'span' }).parentElement
    expect(caption).toHaveTextContent('Oct 1')
    expect(caption).toHaveTextContent('Oct 2')
  })

  it('ranks the highlights with a status in words', () => {
    renderOverview({ highlightsTitle: 'Top projects' })

    const list = screen.getByRole('list', { name: 'Top projects' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Atlas redesign')
    expect(rows[0]).toHaveTextContent('On track')
    expect(rows[1]).toHaveTextContent('At risk')
  })

  it('lists recent activity with a time', () => {
    renderOverview({ activityTitle: 'Latest' })

    const feed = screen.getByRole('list', { name: 'Latest' })
    expect(feed).toHaveTextContent('Lan Anh completed “Launch email”')
    expect(within(feed).getByText(/Oct 12, 2026, 5:12.PM UTC/)).toBeInTheDocument()
  })

  it('says so when there is no activity, without hiding the rest', () => {
    renderOverview({ state: { ...ready, activity: [] } })

    expect(screen.getByText('No recent activity.')).toBeInTheDocument()
    expect(screen.getByText('148')).toBeInTheDocument()
  })

  describe('time range', () => {
    it('starts on the first range', () => {
      renderOverview()

      expect(screen.getByRole('tab', { name: 'Last 7 days' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      expect(screen.getByRole('tabpanel')).toHaveTextContent('148')
    })

    it('switches the figures and the charts', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      renderOverview({ onRangeChange })

      await user.click(screen.getByRole('tab', { name: 'Last 30 days' }))

      // Radix Tabs activates on mouse down and on focus, which user-event fires before React
      // re-renders in between, so the same request can arrive twice here.
      expect(onRangeChange).toHaveBeenLastCalledWith('30d')
      expect(onRangeChange).not.toHaveBeenCalledWith('7d')
      expect(screen.getByText('151')).toBeInTheDocument()
      expect(screen.queryByText('148')).toBeNull()
      expect(
        screen.getByRole('img', { name: 'Tasks completed, 30 days: up from 10 to 1,200' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('tabpanel')).toHaveAttribute(
        'aria-labelledby',
        screen.getByRole('tab', { name: 'Last 30 days' }).id,
      )
    })

    it('starts on defaultRange', () => {
      renderOverview({ defaultRange: '30d' })

      expect(screen.getByText('151')).toBeInTheDocument()
    })

    it('follows a controlled range and only reports the request', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      renderOverview({ range: '7d', onRangeChange })

      await user.click(screen.getByRole('tab', { name: 'Last 30 days' }))

      expect(onRangeChange).toHaveBeenCalledWith('30d')
      expect(screen.getByText('148')).toBeInTheDocument()
    })

    it('offers the ranges it is given', async () => {
      const user = userEvent.setup()
      renderOverview({
        ranges: [
          { id: 'week', label: 'This week' },
          { id: 'month', label: 'This month' },
        ],
        state: {
          status: 'ready',
          periods: { week: period('week', '10'), month: period('month', '20') },
          activity,
        },
      })

      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
        'This week',
        'This month',
      ])
      await user.click(screen.getByRole('tab', { name: 'This month' }))
      expect(screen.getByText('20')).toBeInTheDocument()
    })

    it('shows the empty state for a range with no data', async () => {
      const user = userEvent.setup()
      renderOverview({
        state: { status: 'ready', periods: { '7d': period('7 days', '148') }, activity },
      })

      await user.click(screen.getByRole('tab', { name: 'Last 30 days' }))

      expect(
        screen.getByRole('heading', { name: 'No data for this range yet' }),
      ).toBeInTheDocument()
      expect(screen.queryByText('148')).toBeNull()
    })
  })

  describe('empty, loading, and error', () => {
    it('shows the empty state when every range is empty', () => {
      renderOverview({ state: { status: 'ready', periods: {}, activity: [] } })

      expect(
        screen.getByRole('heading', { name: 'No data for this range yet' }),
      ).toBeInTheDocument()
    })

    it('shows the empty state for a period with nothing in it', () => {
      renderOverview({
        state: {
          status: 'ready',
          periods: {
            '7d': {
              metrics: [],
              trend: { name: 'Tasks', summary: '', points: [] },
              highlights: [],
            },
          },
          activity,
        },
      })

      expect(
        screen.getByRole('heading', { name: 'No data for this range yet' }),
      ).toBeInTheDocument()
    })

    it('announces loading, marks the page busy, and offers no range yet', () => {
      renderOverview({ state: { status: 'loading' } })

      expect(screen.getByText('Loading overview…')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Overview' })).toHaveAttribute('aria-busy', 'true')
      expect(screen.queryByRole('tab')).toBeNull()
    })

    it('shows the error as an alert and retries', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      renderOverview({
        state: { status: 'error', message: 'Mock: the reporting service did not respond.' },
        onRetry,
      })

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Mock: the reporting service did not respond.',
      )
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('offers no retry without a handler', () => {
      renderOverview({ state: { status: 'error' } })

      expect(screen.getByRole('alert')).toHaveTextContent('Check your connection')
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    })
  })

  it('renders actions in the header', () => {
    renderOverview({ actions: <button type="button">Export</button>, title: 'Workspace' })

    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
  })
})
