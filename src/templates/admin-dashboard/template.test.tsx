import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getTemplate } from '@/content/templates'
import { notifications } from '@/registry/notification-center/mock-data'

import { AdminDashboardTemplate } from './template'

const manifest = getTemplate('admin-dashboard')
const unread = notifications.filter((item) => !item.read).length

function nav() {
  return screen.getByRole('navigation', { name: 'Workspace admin sections' })
}

describe('AdminDashboardTemplate', () => {
  it('has a sidebar button for each view in the manifest, and one is current', () => {
    render(<AdminDashboardTemplate />)
    const buttons = within(nav()).getAllByRole('button')
    expect(buttons).toHaveLength(manifest?.views.length ?? 0)
    manifest?.views.forEach((view, index) => {
      expect(buttons[index]).toHaveAccessibleName(new RegExp(`^${view.label}`))
    })
    expect(within(nav()).getAllByRole('button', { current: 'page' })).toHaveLength(1)
    expect(within(nav()).getByRole('button', { name: /^Overview/, current: 'page' })).toBeVisible()
  })

  it('shows the overview first, then each view when chosen', async () => {
    const user = userEvent.setup()
    render(<AdminDashboardTemplate />)
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()

    await user.click(within(nav()).getByRole('button', { name: /^Notifications/ }))
    expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toBeVisible()
    expect(within(nav()).getByRole('button', { name: /^Notifications/ })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await user.click(within(nav()).getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible()
  })

  it('counts unread notifications in the sidebar and updates it when they are read', async () => {
    const user = userEvent.setup()
    render(<AdminDashboardTemplate />)
    const button = () => within(nav()).getByRole('button', { name: /^Notifications/ })
    expect(button()).toHaveAccessibleName(`Notifications, ${String(unread)} unread`)

    await user.click(button())
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(button()).toHaveAccessibleName('Notifications')
  })

  it('keeps the chosen range when moving between views', async () => {
    const user = userEvent.setup()
    render(<AdminDashboardTemplate />)
    await user.click(screen.getByRole('tab', { name: 'Last 30 days' }))
    expect(screen.getByRole('tab', { name: 'Last 30 days' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.click(within(nav()).getByRole('button', { name: 'Settings' }))
    await user.click(within(nav()).getByRole('button', { name: 'Overview' }))
    expect(screen.getByRole('tab', { name: 'Last 30 days' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('can show each view loading, failing, and recovering', async () => {
    const user = userEvent.setup()
    render(<AdminDashboardTemplate />)

    await user.click(screen.getByRole('radio', { name: 'Loading' }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading overview')

    await user.click(screen.getByRole('radio', { name: 'Error' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Mock: the reporting service did not respond.',
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('radio', { name: 'Loaded' })).toBeChecked()
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
  })

  it('says the app and its data are invented', () => {
    render(<AdminDashboardTemplate />)
    expect(screen.getByText('Example app · invented data')).toBeVisible()
    expect(screen.getByText(/invented and held in memory/)).toBeVisible()
  })

  it('moves between views with the keyboard', async () => {
    const user = userEvent.setup()
    render(<AdminDashboardTemplate />)
    within(nav())
      .getByRole('button', { name: /^Overview/ })
      .focus()
    await user.tab()
    expect(within(nav()).getByRole('button', { name: /^Notifications/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toBeVisible()
  })
})
