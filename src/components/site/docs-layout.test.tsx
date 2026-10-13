import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

describe('DocsLayout', () => {
  it('renders a breadcrumb trail with the current page marked', () => {
    renderRoute('/components/button')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(within(trail).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(within(trail).getByRole('link', { name: 'Components' })).toHaveAttribute(
      'href',
      '/components',
    )
    expect(within(trail).getByText('Button')).toHaveAttribute('aria-current', 'page')
  })

  it('does not link a section without a landing page', () => {
    renderRoute('/docs/theming')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(trail).queryByRole('link', { name: 'Getting started' })).toBeNull()
    expect(within(trail).getByText('Theming')).toHaveAttribute('aria-current', 'page')
  })

  it('groups the sidebar and marks the active link', () => {
    renderRoute('/docs')
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

  it('renders exactly one main landmark and one h1', () => {
    const { container } = renderRoute('/docs/theming')
    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})
