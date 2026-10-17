import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projects } from '@/content/projects'
import { showcaseProjects } from '@/content/showcase-projects'
import { templates } from '@/content/templates'
import { renderRoute } from '@/test/render'

function tile(section: HTMLElement, name: string): HTMLElement {
  const container = within(section).getByRole('link', { name }).closest('div')
  if (!container) throw new Error(`No tile for ${name}`)
  return container
}

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
