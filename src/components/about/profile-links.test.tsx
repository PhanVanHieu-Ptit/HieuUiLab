import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { profileLinks } from '@/content/profile'
import type { ProfileLink } from '@/content/profile-types'

import { ProfileLinkButtons } from './profile-links'

function renderLinks(links: readonly ProfileLink[]) {
  return render(
    <MemoryRouter>
      <ProfileLinkButtons links={profileLinks(links)} />
    </MemoryRouter>,
  )
}

describe('ProfileLinkButtons', () => {
  it('renders nothing for a profile with no links, so nothing is invented', () => {
    const { container } = renderLinks([])
    expect(container).toBeEmptyDOMElement()
  })

  it('opens a GitHub page in a new tab and says so', () => {
    renderLinks([{ kind: 'github', url: 'https://github.com/example-owner' }])
    const link = screen.getByRole('link', { name: 'GitHub profile (opens in a new tab)' })
    expect(link).toHaveAttribute('href', 'https://github.com/example-owner')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('serves a CV as a file in a new tab, not as a router link', () => {
    renderLinks([{ kind: 'cv', path: '/cv.pdf' }])
    const link = screen.getByRole('link', { name: 'CV (PDF) (opens in a new tab)' })
    expect(link).toHaveAttribute('href', '/cv.pdf')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('opens an email address in the mail client, not a new tab', () => {
    renderLinks([{ kind: 'email', address: 'someone@example.com' }])
    const link = screen.getByRole('link', { name: 'Email' })
    expect(link).toHaveAttribute('href', 'mailto:someone@example.com')
    expect(link).not.toHaveAttribute('target')
  })

  it('renders each listed link once, in order', () => {
    renderLinks([
      { kind: 'github', url: 'https://github.com/example-owner' },
      { kind: 'cv', path: '/cv.pdf' },
      { kind: 'email', address: 'someone@example.com' },
    ])
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      'https://github.com/example-owner',
      '/cv.pdf',
      'mailto:someone@example.com',
    ])
  })
})
