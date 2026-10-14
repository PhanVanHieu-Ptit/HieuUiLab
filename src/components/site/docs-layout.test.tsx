import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

describe('DocsLayout', () => {
  it('renders a breadcrumb trail with the current page marked', async () => {
    await renderRoute('/components/button')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(within(trail).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(within(trail).getByRole('link', { name: 'Components' })).toHaveAttribute(
      'href',
      '/components',
    )
    expect(within(trail).getByText('Button')).toHaveAttribute('aria-current', 'page')
  })

  it('follows the URL for docs pages', async () => {
    await renderRoute('/docs/theming')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(trail)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'Docs'])
    expect(within(trail).getByText('Theming')).toHaveAttribute('aria-current', 'page')
  })

  it('groups the sidebar and marks the active link', async () => {
    await renderRoute('/docs')
    const sidebar = screen.getByRole('navigation', { name: 'Registry' })
    expect(within(sidebar).getByRole('heading', { name: 'Getting started' })).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Introduction' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(sidebar).getByRole('link', { name: 'Theming' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('renders exactly one main landmark and one h1', async () => {
    const { container } = await renderRoute('/docs/theming')
    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})
