import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getTemplate } from '@/content/templates'
import { incidents } from '@/registry/monitoring-dashboard/mock-data'

import { OperationsMonitoringTemplate } from './template'

const manifest = getTemplate('operations-monitoring')
const open = incidents.filter((incident) => incident.status !== 'resolved')
// One event when an incident opened, and another when it resolved.
const events = incidents.length + incidents.filter((incident) => incident.resolvedAt).length

function nav() {
  return screen.getByRole('navigation', { name: 'Operations console sections' })
}

function goTo(user: ReturnType<typeof userEvent.setup>, name: string | RegExp) {
  return user.click(within(nav()).getByRole('button', { name }))
}

describe('OperationsMonitoringTemplate', () => {
  it('has a sidebar button for each view in the manifest, and one is current', () => {
    render(<OperationsMonitoringTemplate />)
    const buttons = within(nav()).getAllByRole('button')
    expect(buttons).toHaveLength(manifest?.views.length ?? 0)
    manifest?.views.forEach((view, index) => {
      expect(buttons[index]).toHaveAccessibleName(new RegExp(`^${view.label}`))
    })
    expect(within(nav()).getAllByRole('button', { current: 'page' })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2, name: 'System status' })).toBeVisible()
  })

  it('keeps the time of the last refresh when moving between views', async () => {
    const user = userEvent.setup()
    render(<OperationsMonitoringTemplate />)
    expect(screen.getByText(/Checked at .*6:00 PM UTC/)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => {
      expect(screen.getByText(/Checked at .*6:01 PM UTC/)).toBeVisible()
    })

    await goTo(user, /^Alerts/)
    await goTo(user, /^Service status/)
    expect(screen.getByText(/Checked at .*6:01 PM UTC/)).toBeVisible()
  })

  it('turns every incident into an alert and counts the open ones as unread', async () => {
    const user = userEvent.setup()
    render(<OperationsMonitoringTemplate />)
    const button = () => within(nav()).getByRole('button', { name: /^Alerts/ })
    expect(button()).toHaveAccessibleName(`Alerts, ${String(open.length)} unread`)

    await goTo(user, /^Alerts/)
    expect(screen.getByRole('heading', { level: 2, name: 'Alerts' })).toBeVisible()
    for (const incident of incidents) {
      expect(screen.getByText(incident.title)).toBeVisible()
    }

    const first = open[0]
    if (!first) throw new Error('The example data has no open incident.')
    await user.click(screen.getByRole('button', { name: `Mark as read: ${first.title}` }))
    expect(button()).toHaveAccessibleName(`Alerts, ${String(open.length - 1)} unread`)

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(button()).toHaveAccessibleName('Alerts')
  })

  it('relabels the notification types it uses', async () => {
    const user = userEvent.setup()
    render(<OperationsMonitoringTemplate />)
    await goTo(user, /^Alerts/)
    await user.click(screen.getByRole('combobox', { name: /type/i }))
    expect(await screen.findByRole('option', { name: 'Needs a response' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Updates' })).toBeVisible()
  })

  describe('incident log', () => {
    async function openLog() {
      const user = userEvent.setup()
      render(<OperationsMonitoringTemplate />)
      await goTo(user, 'Incident log')
      return user
    }

    it('lists when each incident opened and resolved', async () => {
      await openLog()
      expect(screen.getByRole('heading', { level: 2, name: 'Incident log' })).toBeVisible()
      const list = screen.getByRole('list', { name: 'Incident log' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(events)
      expect(screen.getByText(`${String(events)} events`)).toBeVisible()
    })

    it('narrows to open or resolved incidents with the saved views', async () => {
      const user = await openLog()
      const resolved = incidents.filter((incident) => incident.resolvedAt).length * 2

      await user.click(screen.getByRole('button', { name: 'Open' }))
      expect(screen.getByText(`${String(open.length)} events`)).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Resolved' }))
      expect(screen.getByText(`${String(resolved)} events`)).toBeVisible()
    })

    it('searches by title or service, and recovers from no match', async () => {
      const user = await openLog()
      await user.type(screen.getByRole('searchbox', { name: 'Search incidents' }), 'slow search')
      expect(screen.getByText('1 event')).toBeVisible()

      await user.clear(screen.getByRole('searchbox', { name: 'Search incidents' }))
      await user.type(screen.getByRole('searchbox', { name: 'Search incidents' }), 'zzz')
      expect(screen.getByRole('heading', { name: 'No incidents match' })).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Clear everything' }))
      expect(screen.getByText(`${String(events)} events`)).toBeVisible()
    })
  })

  it('shows an empty inbox and log when every service is operational', async () => {
    const user = userEvent.setup()
    render(<OperationsMonitoringTemplate />)
    await user.click(screen.getByRole('radio', { name: 'All operational' }))
    expect(within(nav()).getByRole('button', { name: 'Alerts' })).toBeVisible()

    await goTo(user, 'Alerts')
    expect(screen.getByRole('heading', { name: 'No notifications yet' })).toBeVisible()

    await goTo(user, 'Incident log')
    expect(screen.getByRole('heading', { name: 'No incidents' })).toBeVisible()
  })

  it('can show the log loading and failing, then recover', async () => {
    const user = userEvent.setup()
    render(<OperationsMonitoringTemplate />)
    await goTo(user, 'Incident log')

    await user.click(screen.getByRole('radio', { name: 'Loading' }))
    expect(screen.getByText('Loading the incident log…')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Error' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load the incident log')

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('list', { name: 'Incident log' })).toBeVisible()
  })

  it('says the app and its data are invented', () => {
    render(<OperationsMonitoringTemplate />)
    expect(screen.getByText('Example app · invented data')).toBeVisible()
    expect(screen.getByText(/Nothing is being monitored/)).toBeVisible()
  })
})
