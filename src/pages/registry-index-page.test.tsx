import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getRegistryEntries } from '@/registry'
import { renderRoute } from '@/test/render'

const components = getRegistryEntries('component')

function cardTitles(name = 'Components results'): string[] {
  const list = screen.queryByRole('list', { name })
  const headings = list ? within(list).queryAllByRole('heading', { level: 2 }) : []
  // The card link's text, without the status badge that shares the heading.
  return headings.map((heading) => within(heading).getByRole('link').textContent)
}

describe('RegistryIndexPage', () => {
  it('lists every component, including planned ones marked as planned', async () => {
    await renderRoute('/components')

    expect(screen.getByRole('status')).toHaveTextContent(`${String(components.length)} components`)
    const combobox = screen.getByRole('link', { name: 'Combobox' })
    expect(combobox).toHaveAttribute('href', '/components/combobox')
    const card = combobox.closest('h2')?.parentElement
    expect(card && within(card).getByText('Planned')).toBeInTheDocument()
  })

  it('filters by search text and writes it to the URL', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components')

    await user.type(screen.getByRole('searchbox', { name: 'Search components' }), 'modal')

    expect(router.state.location.search).toBe('?q=modal')
    expect(cardTitles()).toEqual(['Dialog', 'Sheet'])
    expect(screen.getByRole('status')).toHaveTextContent(
      `2 of ${String(components.length)} components`,
    )
  })

  it('reads filters from the URL', async () => {
    await renderRoute('/components?category=feedback&sort=name')

    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('feedback')
    expect(cardTitles()).toEqual([
      'Alert',
      'Form feedback',
      'Notification item',
      'Skeleton',
      'Spinner',
    ])
  })

  it('filters by category and tag', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'navigation')
    await user.click(screen.getByRole('button', { name: 'keyboard', pressed: false }))

    expect(router.state.location.search).toBe('?category=navigation&tag=keyboard')
    expect(screen.getByRole('button', { name: 'keyboard', pressed: true })).toBeInTheDocument()
    expect(cardTitles()).toEqual(['Pagination', 'Tabs'])
  })

  it('sorts by status with planned entries last', async () => {
    const user = userEvent.setup()
    await renderRoute('/components')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'status')

    // Stable first, then experimental, then planned.
    expect(cardTitles().slice(-2)).toEqual(['Table', 'Combobox'])
  })

  it('shows an empty state with a way to clear the filters', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components?q=nothing-matches-this')

    expect(
      screen.getByRole('heading', { level: 2, name: 'No components match these filters' }),
    ).toBeInTheDocument()

    const [clear] = screen.getAllByRole('button', { name: 'Clear filters' })
    expect(clear).toBeDefined()
    if (clear) await user.click(clear)

    expect(router.state.location.search).toBe('')
    expect(cardTitles()).toHaveLength(components.length)
  })

  it('offers only categories that blocks use', async () => {
    await renderRoute('/blocks')
    const options = within(screen.getByRole('combobox', { name: 'Category' }))
      .getAllByRole('option')
      .map((option) => option.textContent)
    expect(options).toContain('Data display')
    expect(options).not.toContain('Navigation')
  })

  it('removes one active filter at a time', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components?q=a&category=navigation&tag=keyboard')
    const active = screen.getByRole('list', { name: 'Active filters' })

    await user.click(within(active).getByRole('button', { name: 'Remove tag keyboard' }))
    expect(router.state.location.search).toBe('?q=a&category=navigation')

    await user.click(within(active).getByRole('button', { name: 'Remove category Navigation' }))
    expect(router.state.location.search).toBe('?q=a')
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('')

    await user.click(within(active).getByRole('button', { name: 'Remove search “a”' }))
    expect(router.state.location.search).toBe('')
    expect(screen.queryByRole('list', { name: 'Active filters' })).toBeNull()

    // Each removal was its own history entry.
    await router.navigate(-1)
    await screen.findByRole('button', { name: 'Remove search “a”' })
  })

  it('clears the search with Escape and links the searchbox to the results', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components?q=modal')
    const search = screen.getByRole('searchbox', { name: 'Search components' })
    expect(search).toHaveAttribute(
      'aria-controls',
      screen.getByRole('list', { name: 'Components results' }).id,
    )

    search.focus()
    await user.keyboard('{Escape}')

    expect(search).toHaveValue('')
    expect(router.state.location.search).toBe('')
    expect(cardTitles()).toHaveLength(components.length)
  })

  it('suggests close names for a mistyped search', async () => {
    await renderRoute('/components?q=buton')
    const suggestions = screen.getByRole('navigation', { name: 'Search suggestions' })
    expect(within(suggestions).getByRole('link', { name: 'Button' })).toHaveAttribute(
      'href',
      '/components/button',
    )
  })

  it('points to the other catalog when it has matches', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components?q=dashboard')
    const suggestions = screen.getByRole('navigation', { name: 'Search suggestions' })
    await user.click(within(suggestions).getByRole('link', { name: '3 blocks match “dashboard”' }))

    expect(router.state.location.pathname).toBe('/blocks')
    expect(router.state.location.search).toBe('?q=dashboard')
    expect(cardTitles('Blocks results')).toEqual([
      'Dashboard overview',
      'Monitoring dashboard',
      'Orders dashboard',
    ])
  })

  it('opens an entry from its card', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components?q=modal')
    const results = screen.getByRole('list', { name: 'Components results' })

    await user.click(within(results).getByRole('link', { name: 'Dialog' }))

    // The detail page is a lazy chunk; the location updates once it has loaded.
    expect(await screen.findByRole('heading', { level: 1, name: 'Dialog' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/components/dialog')
  })
})
