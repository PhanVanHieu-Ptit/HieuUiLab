import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

describe('CommandMenu', () => {
  it('opens with Ctrl+K and lists docs pages and components', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.keyboard('{Control>}k{/Control}')

    const dialog = await screen.findByRole('dialog', { name: 'Search documentation' })
    const input = within(dialog).getByRole('combobox', { name: 'Search documentation' })
    expect(input).toHaveFocus()
    const listbox = within(dialog).getByRole('listbox', { name: 'Results' })
    expect(within(listbox).getByRole('group', { name: 'Getting started' })).toBeInTheDocument()
    expect(within(listbox).getByRole('option', { name: /^Button/ })).toBeInTheDocument()
  })

  it('opens from the header trigger', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Search docs' }))
    expect(await screen.findByRole('combobox')).toHaveFocus()
  })

  it('filters, moves with the arrow keys, and navigates on Enter', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Search docs' }))
    const input = await screen.findByRole('combobox')

    await user.type(input, 'ta')
    const options = screen.getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Tabs/)]),
    )
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[0]?.id)

    await user.keyboard('{ArrowDown}')
    expect(options[1] ?? options[0]).toHaveAttribute('aria-selected', 'true')

    await user.clear(input)
    await user.type(input, 'tabs{Enter}')

    expect(router.state.location.pathname).toBe('/components/tabs')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Search docs' }))
    await user.type(await screen.findByRole('combobox'), 'zzzz')

    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('No results for “zzzz”.')
  })

  it('opens with "/" but not while typing in a field', async () => {
    const user = userEvent.setup()
    renderRoute('/')
    await user.keyboard('/')
    const input = await screen.findByRole('combobox')
    await user.type(input, '/')
    expect(input).toHaveValue('/')
  })
})
