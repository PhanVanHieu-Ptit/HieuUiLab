import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { siteConfig } from '@/config/site'
import { profile } from '@/content/profile'
import { renderRoute } from '@/test/render'

describe('SiteFooter', () => {
  it('appears on every layout', async () => {
    for (const path of ['/', '/docs', '/notes']) {
      const { unmount } = await renderRoute(path)
      expect(screen.getByRole('contentinfo'), path).toBeInTheDocument()
      unmount()
    }
  })

  it('links to every section, the source, and the contact links the profile lists', async () => {
    await renderRoute('/')
    const footer = screen.getByRole('contentinfo')

    const explore = within(footer).getByRole('navigation', { name: 'Footer: Explore' })
    for (const [name, href] of [
      ['Components', '/components'],
      ['Blocks', '/blocks'],
      ['Templates', '/templates'],
      ['Labs', '/labs'],
      ['Projects', '/projects'],
      ['Notes', '/notes'],
      ['Docs', '/docs'],
      ['About', '/about'],
    ] as const) {
      expect(within(explore).getByRole('link', { name })).toHaveAttribute('href', href)
    }

    expect(
      within(footer).getByRole('link', { name: 'Open an issue (opens in a new tab)' }),
    ).toHaveAttribute('href', siteConfig.issuesUrl)
    expect(
      within(footer).getByRole('link', { name: 'Repository (opens in a new tab)' }),
    ).toHaveAttribute('href', siteConfig.githubUrl)
    // An email address appears only when the profile lists one; the footer never invents it.
    const email = profile.links.find((link) => link.kind === 'email')
    expect(footer.querySelector('a[href^="mailto:"]')?.getAttribute('href') ?? null).toBe(
      email ? `mailto:${email.address}` : null,
    )
  })
})
