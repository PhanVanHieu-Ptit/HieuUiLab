import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

describe('RegistryDetailPage', () => {
  it('renders the Button entry with demos, source, and props', async () => {
    await renderRoute('/components/button')

    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Variants' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Button props' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('aria-current', 'page')
  })

  it('switches a demo from Preview to Code', async () => {
    const user = userEvent.setup()
    await renderRoute('/components/button')

    const tablist = screen.getByRole('tablist', { name: 'Variants example' })
    const codeTab = screen
      .getAllByRole('tab', { name: 'Code' })
      .find((tab) => tablist.contains(tab))
    expect(codeTab).toBeDefined()
    if (!codeTab) return

    await user.click(codeTab)

    expect(codeTab).toHaveAttribute('aria-selected', 'true')
    const panel = screen.getByRole('tabpanel', { name: 'Code' })
    expect(panel).toHaveTextContent('export function ButtonVariantsDemo')
  })

  it('shows a not-found message for an unknown slug', async () => {
    await renderRoute('/components/does-not-exist')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('renders a block with links to the registry entries it needs', async () => {
    await renderRoute('/blocks/resource-list')

    expect(screen.getByRole('heading', { level: 1, name: 'Resource list' })).toBeInTheDocument()
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'Blocks' })).toHaveAttribute(
      'href',
      '/blocks',
    )
    const requires = screen.getByText(/Also copy these registry entries first/)
    expect(
      within(requires)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/blocks/empty-state', '/components/button', '/components/skeleton'])
  })

  it('redirects an entry requested under another category to its own page', async () => {
    const { router } = await renderRoute('/components/resource-list')
    expect(router.state.location.pathname).toBe('/blocks/resource-list')
    expect(screen.getByRole('heading', { level: 1, name: 'Resource list' })).toBeInTheDocument()
  })
})
