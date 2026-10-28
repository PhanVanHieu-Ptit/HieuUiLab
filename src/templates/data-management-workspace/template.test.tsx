import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getTemplate } from '@/content/templates'
import { initialMembers } from '@/registry/crud-management-page/mock-data'
import { libraryItems } from '@/registry/search-filter-toolbar/mock-data'

import { DataManagementWorkspaceTemplate } from './template'

const manifest = getTemplate('data-management-workspace')
type User = ReturnType<typeof userEvent.setup>

function nav() {
  return screen.getByRole('navigation', { name: 'Content workspace sections' })
}

function goTo(user: User, name: string | RegExp) {
  return user.click(within(nav()).getByRole('button', { name }))
}

function table() {
  return screen.getByRole('table', { name: 'Library items' })
}

function names() {
  return within(table())
    .getAllByRole('rowheader')
    .map((header) => header.textContent)
}

const first = libraryItems[0]
const second = libraryItems[1]
if (!first || !second) throw new Error('The example library needs two items.')

describe('DataManagementWorkspaceTemplate', () => {
  it('has a sidebar button for each view in the manifest, and one is current', () => {
    render(<DataManagementWorkspaceTemplate />)
    const buttons = within(nav()).getAllByRole('button')
    expect(buttons).toHaveLength(manifest?.views.length ?? 0)
    manifest?.views.forEach((view, index) => {
      expect(buttons[index]).toHaveAccessibleName(new RegExp(`^${view.label}`))
    })
    expect(within(nav()).getAllByRole('button', { current: 'page' })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2, name: 'Library' })).toBeVisible()
  })

  describe('library', () => {
    it('searches and recovers from no match', async () => {
      const user = userEvent.setup()
      render(<DataManagementWorkspaceTemplate />)
      expect(
        screen.getByText(`${String(libraryItems.length)} of ${String(libraryItems.length)} items`),
      ).toBeVisible()

      await user.type(screen.getByRole('searchbox', { name: 'Search items' }), 'data grid')
      expect(names()).toEqual(['Data grid'])

      await user.clear(screen.getByRole('searchbox', { name: 'Search items' }))
      await user.type(screen.getByRole('searchbox', { name: 'Search items' }), 'zzz')
      expect(screen.getByRole('heading', { name: 'No items match' })).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Clear everything' }))
      expect(names().length).toBeGreaterThan(1)
    })

    it('only offers bulk actions when something is selected', async () => {
      const user = userEvent.setup()
      render(<DataManagementWorkspaceTemplate />)
      expect(screen.getByRole('button', { name: 'Mark deprecated' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Delete…' })).toBeDisabled()

      await user.click(screen.getByRole('checkbox', { name: `Select ${first.name}` }))
      expect(screen.getByText('1 selected')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Mark deprecated' })).toBeEnabled()
    })

    it('deletes the selection after confirmation and records it', async () => {
      const user = userEvent.setup()
      render(<DataManagementWorkspaceTemplate />)
      await user.click(screen.getByRole('checkbox', { name: `Select ${first.name}` }))
      await user.click(screen.getByRole('checkbox', { name: `Select ${second.name}` }))
      await user.click(screen.getByRole('button', { name: 'Delete…' }))

      const dialog = await screen.findByRole('dialog', { name: 'Delete 2 items?' })
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })

      expect(names()).not.toContain(first.name)
      expect(names()).not.toContain(second.name)
      expect(
        screen.getByText(
          `${String(libraryItems.length - 2)} of ${String(libraryItems.length - 2)} items`,
        ),
      ).toBeVisible()
      expect(within(nav()).getByRole('button', { name: 'Change history 1 change' })).toBeVisible()

      await goTo(user, /^Change history/)
      const list = screen.getByRole('list', { name: 'Change history' })
      expect(list).toHaveTextContent('You deleted 2 library items')
    })

    it('marks the selection deprecated and records it', async () => {
      const user = userEvent.setup()
      render(<DataManagementWorkspaceTemplate />)
      const live = libraryItems.find((item) => item.status !== 'deprecated')
      if (!live) throw new Error('The example library needs a live item.')
      await user.click(screen.getByRole('checkbox', { name: `Select ${live.name}` }))
      await user.click(screen.getByRole('button', { name: 'Mark deprecated' }))

      const row = within(table()).getByRole('rowheader', { name: live.name }).closest('tr')
      expect(row).not.toBeNull()
      expect(within(row as HTMLElement).getByText('Deprecated')).toBeVisible()
      expect(screen.getByText('Select items to act on several at once.')).toBeVisible()

      await goTo(user, /^Change history/)
      expect(screen.getByRole('list', { name: 'Change history' })).toHaveTextContent(
        'You marked as deprecated 1 library item',
      )
    })

    it('opens an item’s details as a sheet and closes it with Escape', async () => {
      const user = userEvent.setup()
      render(<DataManagementWorkspaceTemplate />)
      const opener = screen.getByRole('button', { name: `Details for ${first.name}` })
      await user.click(opener)

      const sheet = await screen.findByRole('dialog', { name: first.name })
      expect(within(sheet).getByText('An example record, held in memory.')).toBeVisible()

      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
      expect(opener).toHaveFocus()
    })
  })

  describe('people', () => {
    it('shows the team and records a removal in the history', async () => {
      const user = userEvent.setup()
      render(<DataManagementWorkspaceTemplate />)
      await goTo(user, 'People')
      expect(screen.getByRole('heading', { level: 2, name: 'Team members' })).toBeVisible()

      // The first member on the page, whoever the table's order puts there.
      const header = await within(
        screen.getByRole('table', { name: 'Team members' }),
      ).findAllByRole('rowheader')
      const member = { name: header[0]?.querySelector('span')?.textContent ?? '' }
      expect(initialMembers.map((candidate) => candidate.name)).toContain(member.name)
      await user.click(screen.getByRole('button', { name: `Delete ${member.name}` }))
      const dialog = await screen.findByRole('dialog', { name: 'Delete this member?' })
      await user.click(within(dialog).getByRole('button', { name: 'Delete member' }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })

      await goTo(user, /^Change history/)
      expect(screen.getByRole('list', { name: 'Change history' })).toHaveTextContent(
        `You removed ${member.name}`,
      )
    })

    it('adds a member and records the invitation', async () => {
      const user = userEvent.setup()
      render(<DataManagementWorkspaceTemplate />)
      await goTo(user, 'People')
      await user.click(screen.getByRole('button', { name: 'Add member' }))
      const dialog = await screen.findByRole('dialog', { name: 'Add member' })

      await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Mira Solano')
      await user.type(within(dialog).getByRole('textbox', { name: 'Email' }), 'mira@example.com')
      within(dialog).getByRole('combobox', { name: 'Role' }).focus()
      await user.keyboard('{Enter}')
      await user.click(await screen.findByRole('option', { name: 'Editor' }))
      await user.click(within(dialog).getByRole('button', { name: 'Add member' }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })

      await goTo(user, /^Change history/)
      expect(screen.getByRole('list', { name: 'Change history' })).toHaveTextContent(
        'You invited Mira Solano',
      )
    })
  })

  describe('change history', () => {
    it('starts empty and says what fills it', async () => {
      const user = userEvent.setup()
      render(<DataManagementWorkspaceTemplate />)
      await goTo(user, 'Change history')
      expect(screen.getByRole('heading', { name: 'No changes yet' })).toBeVisible()
      expect(within(nav()).getByRole('button', { name: 'Change history' })).toBeVisible()
    })
  })

  it('can show the library loading, empty, and failing, then recover', async () => {
    const user = userEvent.setup()
    render(<DataManagementWorkspaceTemplate />)

    await user.click(screen.getByRole('radio', { name: 'No records' }))
    expect(screen.getByRole('heading', { name: 'The library is empty' })).toBeVisible()
    expect(screen.getByText('0 of 0 items')).toBeVisible()

    await user.click(screen.getByRole('radio', { name: 'Error' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Mock: the library service did not respond.',
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByRole('radio', { name: 'Loaded' })).toBeChecked()
    expect(names().length).toBeGreaterThan(0)
  })

  it('says the app and its data are invented', () => {
    render(<DataManagementWorkspaceTemplate />)
    expect(screen.getByText('Example app · invented data')).toBeVisible()
    expect(screen.getByText(/invented and held in memory/)).toBeVisible()
  })
})
