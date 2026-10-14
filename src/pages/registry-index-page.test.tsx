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
    expect(cardTitles()).toEqual(['Alert', 'Form feedback', 'Skeleton', 'Spinner'])
  })

  it('filters by category and tag', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/components')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'navigation')
    await user.click(screen.getByRole('button', { name: 'keyboard', pressed: false }))

    expect(router.state.location.search).toBe('?category=navigation&tag=keyboard')
    expect(screen.getByRole('button', { name: 'keyboard', pressed: true })).toBeInTheDocument()
    expect(cardTitles()).toEqual(['Tabs'])
  })

  it('sorts by status with planned entries last', async () => {
    const user = userEvent.setup()
    await renderRoute('/components')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'status')

    // Stable first, then experimental, then planned.
    expect(cardTitles().slice(-2)).toEqual(['Sheet', 'Combobox'])
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
    expect(options).not.toContain('Overlays')
  })
})
