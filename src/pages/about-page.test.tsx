import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { profile } from '@/content/profile'
import { projects } from '@/content/projects'
import { showcaseProjects } from '@/content/showcase-projects'
import { templates } from '@/content/templates'
import { notes } from '@/notes/manifest'
import { renderRoute } from '@/test/render'

function tile(section: HTMLElement, name: string): HTMLElement {
  const container = within(section).getByRole('link', { name }).closest('div')
  if (!container) throw new Error(`No tile for ${name}`)
  return container
}

describe('About page profile', () => {
  it('names the author and states the positioning once, as the page heading and description', async () => {
    await renderRoute('/about')
    expect(screen.getByRole('heading', { level: 1, name: 'About Hieu' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByText(profile.headline)).toHaveLength(1)
    expect(profile.headline).toMatch(/React, TypeScript, reusable UI systems, and practical/)
  })

  it('introduces the author and says what the page does not claim', async () => {
    await renderRoute('/about')
    const intro = screen.getByRole('region', { name: 'Introduction' })
    for (const paragraph of profile.intro) {
      expect(within(intro).getByText(paragraph)).toBeInTheDocument()
    }
    expect(intro).toHaveTextContent('makes no claims about employment, qualifications')
  })

  it('organizes skills by domain, each linking to the projects and notes that show it', async () => {
    await renderRoute('/about')
    const skills = screen.getByRole('region', { name: 'Skills by engineering domain' })

    for (const domain of profile.domains) {
      expect(
        within(skills).getByRole('heading', { level: 3, name: domain.title }),
        domain.id,
      ).toBeInTheDocument()

      const shows = within(skills).getByRole('list', {
        name: `${domain.title}: projects and notes`,
      })
      for (const slug of domain.projects) {
        const link = within(shows)
          .getAllByRole('link')
          .find((anchor) => anchor.getAttribute('href') === `/projects/${slug}`)
        expect(link, `${domain.id} → /projects/${slug}`).toBeDefined()
      }
      for (const slug of domain.notes) {
        const link = within(shows)
          .getAllByRole('link')
          .find((anchor) => anchor.getAttribute('href') === `/notes/${slug}`)
        expect(link, `${domain.id} → /notes/${slug}`).toBeDefined()
      }
    }
  })

  it('links each domain’s source files to GitHub, behind a disclosure', async () => {
    await renderRoute('/about')
    const [domain] = profile.domains
    if (!domain) throw new Error('profile has no domains')
    // The list is inside a closed <details>, so ask for hidden elements too.
    const files = screen.getByRole('list', { name: `${domain.title}: source files`, hidden: true })
    const links = within(files).getAllByRole('link', { hidden: true })
    expect(links).toHaveLength(domain.evidence.length)
    for (const [index, ref] of domain.evidence.entries()) {
      expect(links[index]).toHaveAttribute(
        'href',
        expect.stringMatching(new RegExp(`/blob/main/${ref.path}$`)),
      )
    }
  })

  it('features public projects and the newest notes', async () => {
    await renderRoute('/about')
    const projectsSection = screen.getByRole('region', { name: 'Public projects' })
    expect(within(projectsSection).getAllByRole('listitem').length).toBeGreaterThan(0)
    for (const project of showcaseProjects.slice(0, 3)) {
      expect(within(projectsSection).getByRole('link', { name: project.title })).toHaveAttribute(
        'href',
        `/projects/${project.slug}`,
      )
    }

    const notesSection = screen.getByRole('region', { name: 'Recent engineering notes' })
    const [newest] = notes
    if (!newest) throw new Error('no notes')
    expect(within(notesSection).getByRole('link', { name: newest.title })).toHaveAttribute(
      'href',
      `/notes/${newest.slug}`,
    )
  })

  it('lists learning goals as goals, with what the repository has today', async () => {
    await renderRoute('/about')
    const section = screen.getByRole('region', { name: 'Learning goals, not achievements' })
    const goals = within(section).getByRole('list', { name: 'Learning goals' })

    expect(within(goals).getAllByRole('listitem')).toHaveLength(profile.goals.length)
    for (const goal of profile.goals) {
      expect(within(goals).getByRole('heading', { level: 3, name: goal.title })).toBeInTheDocument()
      expect(within(goals).getByText(goal.today)).toBeInTheDocument()
    }
    expect(within(goals).getAllByText('Goal')).toHaveLength(profile.goals.length)
    expect(within(goals).getAllByText('In this repository today')).toHaveLength(
      profile.goals.length,
    )
  })

  it('shows a CV or an email only when the profile lists one', async () => {
    await renderRoute('/about')
    const hasCv = profile.links.some((link) => link.kind === 'cv')
    const email = profile.links.find((link) => link.kind === 'email')

    expect(screen.queryAllByRole('link', { name: /^CV/ }).length > 0).toBe(hasCv)
    expect(document.querySelector('a[href^="mailto:"]')?.getAttribute('href') ?? null).toBe(
      email ? `mailto:${email.address}` : null,
    )
    // GitHub is always listed, in the header and again under "Source and contact".
    expect(screen.getAllByRole('link', { name: /^GitHub profile/ }).length).toBeGreaterThanOrEqual(
      2,
    )
  })

  it('makes no claim about employment, qualifications, or numbers', async () => {
    await renderRoute('/about')
    const main = screen.getByRole('main')
    const skills = screen.getByRole('region', { name: 'Skills by engineering domain' })
    expect(skills.textContent).not.toMatch(/\bexpert|industry-leading|production-proven/i)
    expect(main.textContent).not.toMatch(/\byears of experience\b/i)
  })
})

describe('About page inventory', () => {
  it('counts templates and projects from the data, linked to their pages', async () => {
    await renderRoute('/about')
    const section = screen.getByRole('region', { name: 'What’s here' })

    expect(within(section).getByRole('link', { name: 'Templates' })).toHaveAttribute(
      'href',
      '/templates',
    )
    expect(tile(section, 'Templates')).toHaveTextContent(String(templates.length))

    expect(within(section).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/projects',
    )
    expect(tile(section, 'Projects')).toHaveTextContent(
      String(showcaseProjects.length + projects.length),
    )
    expect(tile(section, 'Projects')).toHaveTextContent(
      `${String(showcaseProjects.length)} public, ${String(projects.length)} case studies`,
    )
  })

  it('no longer lists Templates as planned', async () => {
    await renderRoute('/about')
    const planned = screen.getByRole('region', { name: 'Planned' })
    expect(within(planned).queryByRole('link', { name: 'Templates' })).toBeNull()
    expect(within(planned).getByRole('link', { name: 'Combobox' })).toBeInTheDocument()
  })
})
