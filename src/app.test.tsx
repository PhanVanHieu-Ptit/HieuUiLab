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
    expect(screen.getByRole('button', { name: /^Switch to (dark|light) theme$/ })).toBeVisible()
    expect(container.querySelector('main#main')).not.toBeNull()
  })
})
