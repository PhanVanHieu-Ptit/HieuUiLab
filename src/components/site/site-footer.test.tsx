import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { siteConfig } from '@/config/site'
import { renderRoute } from '@/test/render'

describe('SiteFooter', () => {
  it('appears on every layout', () => {
    for (const path of ['/', '/docs', '/notes']) {
      const { unmount } = renderRoute(path)
      expect(screen.getByRole('contentinfo'), path).toBeInTheDocument()
      unmount()
    }
  })

  it('links to every section, the source, and GitHub contact without an email address', () => {
    renderRoute('/')
    const footer = screen.getByRole('contentinfo')

    const explore = within(footer).getByRole('navigation', { name: 'Footer: Explore' })
    for (const [name, href] of [
      ['Components', '/components'],
      ['Blocks', '/blocks'],
      ['Lab', '/lab'],
      ['Projects', '/projects'],
      ['Notes', '/notes'],
      ['Docs', '/docs'],
    ] as const) {
      expect(within(explore).getByRole('link', { name })).toHaveAttribute('href', href)
    }

    expect(
      within(footer).getByRole('link', { name: 'Open an issue (opens in a new tab)' }),
    ).toHaveAttribute('href', siteConfig.issuesUrl)
    expect(
      within(footer).getByRole('link', { name: 'Repository (opens in a new tab)' }),
    ).toHaveAttribute('href', siteConfig.githubUrl)
    expect(footer.querySelector('a[href^="mailto:"]')).toBeNull()
  })
})
