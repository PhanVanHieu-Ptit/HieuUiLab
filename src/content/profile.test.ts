import { describe, expect, it } from 'vitest'

import { createProfileContext, installedPackages } from '@/test/profile-context'

import { contactLinks, profile, profileLinks } from './profile'
import { validateProfile } from './profile-rules'
import type { ProfileLink } from './profile-types'
import { showcaseProjects } from './showcase-projects'

describe('profile', () => {
  it('passes every rule against the real repository', () => {
    expect(validateProfile(profile, createProfileContext())).toEqual([])
  })

  it('positions the author as a frontend engineer focused on the agreed areas', () => {
    expect(profile.headline).toBe(
      'Frontend engineer focused on React, TypeScript, reusable UI systems, and practical engineering.',
    )
  })

  it('organizes skills into engineering domains that each point at work that exists', () => {
    expect(profile.domains.length).toBeGreaterThanOrEqual(5)
    for (const domain of profile.domains) {
      expect(domain.projects.length + domain.notes.length, domain.id).toBeGreaterThan(0)
    }
  })

  it('shows every public project through at least one domain', () => {
    const linked = new Set(profile.domains.flatMap((domain) => domain.projects))
    for (const project of showcaseProjects) {
      expect(linked.has(project.slug), project.slug).toBe(true)
    }
  })

  it('keeps learning goals about packages the repository does not use yet', () => {
    const installed = installedPackages()
    const guarded = profile.goals.flatMap((goal) =>
      goal.notYetDependency === undefined ? [] : [goal.notYetDependency],
    )
    expect(guarded.length).toBeGreaterThan(0)
    for (const name of guarded) expect(installed.has(name), name).toBe(false)
  })
})

describe('profile links', () => {
  const links: readonly ProfileLink[] = [
    { kind: 'github', url: 'https://github.com/example-owner' },
    { kind: 'repository', url: 'https://github.com/example-owner/repo' },
    { kind: 'issues', url: 'https://github.com/example-owner/repo/issues/new' },
    { kind: 'cv', path: '/cv.pdf' },
    { kind: 'email', address: 'someone@example.com' },
  ]

  it('resolves each kind to a label, a target, and an address', () => {
    expect(profileLinks(links)).toEqual([
      {
        kind: 'github',
        label: 'GitHub profile',
        href: 'https://github.com/example-owner',
        target: 'web',
      },
      {
        kind: 'repository',
        label: 'Repository',
        href: 'https://github.com/example-owner/repo',
        target: 'web',
      },
      {
        kind: 'issues',
        label: 'Open an issue',
        href: 'https://github.com/example-owner/repo/issues/new',
        target: 'web',
      },
      { kind: 'cv', label: 'CV (PDF)', href: '/cv.pdf', target: 'file' },
      { kind: 'email', label: 'Email', href: 'mailto:someone@example.com', target: 'mail' },
    ])
  })

  it('lists contact links without the repository, which the footer shows as source', () => {
    expect(contactLinks(links).map((link) => link.kind)).toEqual([
      'github',
      'issues',
      'cv',
      'email',
    ])
  })

  it('lists nothing for a link that is not in the profile', () => {
    expect(profileLinks([])).toEqual([])
    expect(
      contactLinks([{ kind: 'github', url: 'https://github.com/example-owner' }]),
    ).toHaveLength(1)
  })

  it('uses the real profile by default', () => {
    expect(profileLinks().map((link) => link.kind)).toEqual(profile.links.map((link) => link.kind))
  })
})
