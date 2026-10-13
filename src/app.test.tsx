import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('boots the real router and renders the home page inside the site shell', () => {
    const { container } = render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
    const mainNav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(mainNav).getByRole('link', { name: 'Components' })).toHaveAttribute(
      'href',
      '/components',
    )
    expect(screen.getByRole('button', { name: /^Theme: (Light|Dark|System)$/ })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Search docs' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Open navigation' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'GitHub (opens in a new tab)' })).toHaveAttribute(
      'target',
      '_blank',
    )
    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(container.querySelector('main#main')).not.toBeNull()
  })
})
