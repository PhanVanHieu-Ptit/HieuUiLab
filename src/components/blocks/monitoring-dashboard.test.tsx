import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  MonitoringDashboard,
  summarizeServices,
  type Incident,
  type MonitoredService,
  type MonitoringDashboardProps,
  type MonitoringDashboardState,
} from './monitoring-dashboard'

const api: MonitoredService = {
  id: 'api',
  name: 'API gateway',
  status: 'operational',
  readings: {
    '24h': { latencyMs: [90, 110, 100], uptimePct: 99.9 },
    '7d': { latencyMs: [95, 105], uptimePct: 99.9 },
  },
}
const search: MonitoredService = {
  id: 'search',
  name: 'Search',
  status: 'degraded',
  readings: {
    '24h': { latencyMs: [200, 260, 300], uptimePct: 98 },
    '7d': { latencyMs: [250, 310], uptimePct: 98.5 },
  },
}
const jobs: MonitoredService = {
  id: 'jobs',
  name: 'Background jobs',
  status: 'outage',
  readings: {},
}
const services = [api, search, jobs]

const openIncident: Incident = {
  id: 'i1',
  title: 'Jobs are not processing',
  serviceId: 'jobs',
  severity: 'critical',
  status: 'investigating',
  startedAt: '2026-10-12T16:20:00Z',
}
const resolvedIncident: Incident = {
  id: 'i2',
  title: 'Login errors',
  serviceId: 'api',
  severity: 'major',
  status: 'resolved',
  startedAt: '2026-10-12T17:00:00Z',
  resolvedAt: '2026-10-12T17:30:00Z',
}
const olderOpenIncident: Incident = {
  id: 'i3',
  title: 'Slow search',
  serviceId: 'search',
  severity: 'minor',
  status: 'monitoring',
  startedAt: '2026-10-12T09:00:00Z',
}
const incidents = [resolvedIncident, olderOpenIncident, openIncident]

const ready: MonitoringDashboardState = {
  status: 'ready',
  services,
  incidents,
  checkedAt: '2026-10-12T18:00:00Z',
}

function renderBoard(props: Partial<MonitoringDashboardProps> = {}) {
  return render(<MonitoringDashboard state={ready} {...props} />)
}

/** The summary card with this label, as a description list. */
function summaryCard(label: string) {
  const card = screen.getByText(label, { selector: 'dt' }).closest('dl')
  if (!card) throw new Error(`No summary card named ${label}`)
  return within(card)
}

/** A promise the test settles by hand, to observe the pending state. */
function deferred() {
  let settle: (() => void) | undefined
  const promise = new Promise<void>((resolve) => {
    settle = resolve
  })
  return { promise, resolve: () => settle?.() }
}

describe('summarizeServices', () => {
  it('counts services by health', () => {
    expect(summarizeServices(services, [], '24h')).toMatchObject({
      total: 3,
      operational: 1,
      withIssues: 2,
    })
  })

  it('averages uptime over the services that have readings for the range', () => {
    // The outage has no readings, so it is left out rather than counted as 0%.
    expect(summarizeServices(services, [], '24h').uptimePct).toBeCloseTo(98.95)
    expect(summarizeServices(services, [], '7d').uptimePct).toBeCloseTo(99.2)
  })

  it('takes the median of each service’s latest sample, averaging the middle two', () => {
    expect(summarizeServices(services, [], '24h').medianP95Ms).toBe(200)
    expect(summarizeServices([api, search, { ...api, id: 'x' }], [], '24h').medianP95Ms).toBe(100)
  })

  it('gives null when no service has readings for the range', () => {
    expect(summarizeServices(services, [], '30d')).toMatchObject({
      uptimePct: null,
      medianP95Ms: null,
    })
    expect(summarizeServices([], [], '24h')).toMatchObject({ total: 0, uptimePct: null })
  })

  it('ignores a reading with no samples when taking the median', () => {
    const empty: MonitoredService = {
      ...api,
      id: 'empty',
      readings: { '24h': { latencyMs: [], uptimePct: 100 } },
    }

    expect(summarizeServices([empty], [], '24h').medianP95Ms).toBeNull()
  })

  it('counts incidents that are not resolved', () => {
    expect(summarizeServices(services, incidents, '24h').openIncidents).toBe(2)
    expect(summarizeServices(services, [resolvedIncident], '24h').openIncidents).toBe(0)
  })
})

describe('MonitoringDashboard', () => {
  it('names the page and says when it was last checked, in UTC', () => {
    renderBoard({ title: 'Platform status' })

    expect(screen.getByRole('heading', { level: 2, name: 'Platform status' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/Checked at Oct 12, 6:00.PM UTC/)
  })

  it('summarises the services for the chosen range', () => {
    renderBoard()

    expect(summaryCard('Services operational').getByText('1 of 3')).toBeInTheDocument()
    expect(summaryCard('Services operational').getByText('2 with issues')).toBeInTheDocument()
    expect(summaryCard('Uptime').getByText('98.95%')).toBeInTheDocument()
    expect(summaryCard('Median p95 latency').getByText('200 ms')).toBeInTheDocument()
    expect(summaryCard('Open incidents').getByText('2')).toBeInTheDocument()
  })

  it('shows a dash instead of a made-up figure when there is nothing to average', () => {
    renderBoard({ state: { ...ready, services: [jobs] } })

    expect(summaryCard('Uptime').getByText('—')).toBeInTheDocument()
    expect(summaryCard('Median p95 latency').getByText('—')).toBeInTheDocument()
  })

  it('says everything is normal when nothing has issues', () => {
    renderBoard({ state: { ...ready, services: [api], incidents: [] } })

    expect(screen.getByText('Everything is running normally')).toBeInTheDocument()
    expect(screen.getByText('No open incidents')).toBeInTheDocument()
  })

  describe('services', () => {
    it('shows health in words, never colour alone', () => {
      renderBoard()

      const list = screen.getByRole('list', { name: 'Services' })
      const cards = within(list).getAllByRole('listitem')
      expect(cards).toHaveLength(3)
      expect(cards[0]).toHaveTextContent('API gateway')
      expect(cards[0]).toHaveTextContent('Operational')
      expect(cards[1]).toHaveTextContent('Degraded')
      expect(cards[2]).toHaveTextContent('Outage')
    })

    it('pairs each sparkline with the latest figure and a spoken summary', () => {
      renderBoard()

      expect(
        screen.getByRole('img', {
          name: 'API gateway p95 latency, last 24 hours: low 90 ms, high 110 ms, latest 100 ms',
        }),
      ).toBeInTheDocument()
      const card = screen
        .getByRole('heading', { name: 'API gateway' })
        .closest('div')?.parentElement
      expect(card).toHaveTextContent('100 ms')
      expect(card).toHaveTextContent('99.90% uptime')
    })

    it('says when a service has no readings for the range', () => {
      renderBoard()

      expect(screen.getByText('No readings for this range.')).toBeInTheDocument()
    })

    it('switches ranges and reports the change', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      renderBoard({ onRangeChange })

      await user.click(screen.getByRole('tab', { name: 'Last 7 days' }))

      expect(onRangeChange).toHaveBeenLastCalledWith('7d')
      expect(
        screen.getByRole('img', {
          name: 'API gateway p95 latency, last 7 days: low 95 ms, high 105 ms, latest 105 ms',
        }),
      ).toBeInTheDocument()
      expect(summaryCard('Uptime').getByText('99.20%')).toBeInTheDocument()
    })

    it('starts on defaultRange', () => {
      renderBoard({ defaultRange: '7d' })

      expect(screen.getByRole('tab', { name: 'Last 7 days' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })

    it('can be limited to services with issues, and keeps that across ranges', async () => {
      const user = userEvent.setup()
      renderBoard()

      await user.click(screen.getByRole('switch', { name: 'Only services with issues' }))
      const list = screen.getByRole('list', { name: 'Services' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(2)
      expect(within(list).queryByText('API gateway')).toBeNull()

      await user.click(screen.getByRole('tab', { name: 'Last 7 days' }))
      expect(screen.getByRole('switch', { name: 'Only services with issues' })).toBeChecked()
      expect(
        within(screen.getByRole('list', { name: 'Services' })).queryByText('API gateway'),
      ).toBeNull()
    })

    it('explains an empty filter instead of showing an empty grid', async () => {
      const user = userEvent.setup()
      renderBoard({ state: { ...ready, services: [api], incidents: [] } })

      await user.click(screen.getByRole('switch', { name: 'Only services with issues' }))

      expect(screen.getByRole('heading', { name: 'No services have issues' })).toBeInTheDocument()
      expect(screen.queryByRole('list', { name: 'Services' })).toBeNull()
    })
  })

  describe('incidents', () => {
    it('lists open incidents first, then resolved, each newest first', () => {
      renderBoard()

      const titles = within(screen.getByRole('list', { name: 'Incidents' }))
        .getAllByRole('listitem')
        .map((item) => within(item).getAllByText(/./)[0]?.textContent)
      expect(titles).toEqual(['Jobs are not processing', 'Slow search', 'Login errors'])
    })

    it('names the affected service, severity, status, and times', () => {
      renderBoard()

      const [first, , resolved] = within(
        screen.getByRole('list', { name: 'Incidents' }),
      ).getAllByRole('listitem')
      expect(first).toHaveTextContent('Critical')
      expect(first).toHaveTextContent('Investigating')
      expect(first).toHaveTextContent('Background jobs')
      expect(resolved).toHaveTextContent('Resolved')
      expect(resolved).toHaveTextContent('API gateway')
      expect(resolved).toHaveTextContent(
        /Started Oct 12, 5:00.PM UTC · Resolved Oct 12, 5:30.PM UTC/,
      )
    })

    it('says so when there are none', () => {
      renderBoard({ state: { ...ready, incidents: [] } })

      expect(screen.getByText('No incidents reported.')).toBeInTheDocument()
      expect(screen.queryByRole('list', { name: 'Incidents' })).toBeNull()
    })
  })

  describe('refresh', () => {
    it('has no refresh button unless asked for', () => {
      renderBoard()

      expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull()
    })

    it('shows a busy button while refreshing, then settles', async () => {
      const user = userEvent.setup()
      const pending = deferred()
      const onRefresh = vi.fn(() => pending.promise)
      renderBoard({ onRefresh })

      await user.click(screen.getByRole('button', { name: 'Refresh' }))

      const button = screen.getByRole('button', { name: 'Refresh' })
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toBeDisabled()
      await user.click(button)
      expect(onRefresh).toHaveBeenCalledOnce()

      pending.resolve()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
      })
      expect(screen.getByRole('button', { name: 'Refresh' })).not.toHaveAttribute('aria-busy')
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('works with a handler that returns nothing', async () => {
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      renderBoard({ onRefresh })

      await user.click(screen.getByRole('button', { name: 'Refresh' }))

      expect(onRefresh).toHaveBeenCalledOnce()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
      })
    })

    it('keeps the results and says so when refreshing fails, then clears it on the next try', async () => {
      const user = userEvent.setup()
      const onRefresh = vi
        .fn()
        .mockRejectedValueOnce(new Error('Mock: down'))
        .mockResolvedValue(undefined)
      renderBoard({ onRefresh })

      await user.click(screen.getByRole('button', { name: 'Refresh' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Couldn’t refresh. Showing the last results.',
      )
      expect(screen.getByRole('list', { name: 'Services' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Refresh' }))
      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeNull()
      })
    })
  })

  describe('loading, empty, and error', () => {
    it('announces loading, marks the page busy, and offers no range yet', () => {
      renderBoard({ state: { status: 'loading' } })

      expect(screen.getByText('Loading service status…')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'System status' })).toHaveAttribute(
        'aria-busy',
        'true',
      )
      expect(screen.queryByRole('tab')).toBeNull()
    })

    it('shows the empty state when no service is monitored', () => {
      renderBoard({ state: { ...ready, services: [], incidents: [] } })

      expect(
        screen.getByRole('heading', { name: 'No services are monitored yet' }),
      ).toBeInTheDocument()
    })

    it('shows the error as an alert and retries', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      renderBoard({
        state: { status: 'error', message: 'Mock: the status service did not respond.' },
        onRetry,
      })

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Mock: the status service did not respond.',
      )
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('offers no retry without a handler', () => {
      renderBoard({ state: { status: 'error' } })

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    })
  })

  it('offers the ranges it is given', () => {
    renderBoard({
      ranges: [
        { id: '24h', label: 'Today' },
        { id: '7d', label: 'This week' },
      ],
    })

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Today', 'This week'])
    expect(
      screen.getByRole('img', { name: /^API gateway p95 latency, today: / }),
    ).toBeInTheDocument()
  })
})
