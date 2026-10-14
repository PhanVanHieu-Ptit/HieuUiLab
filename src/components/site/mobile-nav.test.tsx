import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

describe('MobileNav', () => {
  it('opens a labelled drawer with the docs navigation', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Open navigation' }))

    const drawer = await screen.findByRole('dialog', { name: 'Hieu UI Lab' })
    const nav = within(drawer).getByRole('navigation', { name: 'Site' })
    expect(within(nav).getByRole('link', { name: 'Introduction' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Button' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /^Resource list/ })).toHaveAttribute(
      'href',
      '/blocks/resource-list',
    )
    for (const [name, href] of [
      ['All experiments', '/labs'],
      ['Maps', '/labs/maps'],
      ['3D', '/labs/3d'],
      ['Projects', '/projects'],
      ['Notes', '/notes'],
      ['About', '/about'],
      [/^Templates/, '/templates'],
      [/^Playground/, '/playground'],
    ] as const) {
      expect(within(nav).getByRole('link', { name })).toHaveAttribute('href', href)
    }
    expect(nav.querySelector('[aria-disabled="true"]')).toBeNull()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(trigger)
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(trigger).toHaveFocus()
  })

  it('navigates and closes when a link is chosen', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    const drawer = await screen.findByRole('dialog')

    await user.click(within(drawer).getByRole('link', { name: 'Card' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/components/card')
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
