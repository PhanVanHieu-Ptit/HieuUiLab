import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getShowcaseProject } from '@/content/showcase-projects'
import { templates } from '@/content/templates'
import { renderRoute } from '@/test/render'

describe('HomePage', () => {
  it('leads with the hero and both primary actions', async () => {
    await renderRoute('/')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Build. Learn. Share.')
    expect(screen.getByRole('link', { name: 'Explore Components' })).toHaveAttribute(
      'href',
      '/components',
    )
    expect(screen.getByRole('link', { name: 'View Projects' })).toHaveAttribute('href', '/projects')
  })

  it('renders every landing section', async () => {
    await renderRoute('/')

    for (const name of [
      'What the lab is for',
      'Featured components',
      'UI blocks',
      'Templates',
      'Geospatial and 3D experiments',
      'Projects',
      'Engineering case studies',
      'Recent engineering notes',
      'Technology stack',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('names all three capabilities', async () => {
    await renderRoute('/')
    const section = screen.getByRole('region', { name: 'What the lab is for' })

    expect(
      within(section).getByRole('link', { name: 'Build reusable interfaces' }),
    ).toHaveAttribute('href', '/components')
    expect(
      within(section).getByRole('link', { name: 'Engineer reliable frontend systems' }),
    ).toHaveAttribute('href', '/projects')
    expect(
      within(section).getByRole('link', { name: 'Share practical engineering knowledge' }),
    ).toHaveAttribute('href', '/notes')
  })

  it('renders working component previews, not pictures of them', async () => {
    const user = userEvent.setup()
    await renderRoute('/')
    const preview = screen.getByRole('group', { name: 'Tabs live preview' })

    await user.click(within(preview).getByRole('tab', { name: 'Activity' }))

    expect(within(preview).getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('link', { name: 'Tabs' })).toHaveAttribute('href', '/components/tabs')
  })

  it('links featured cards to their detail pages', async () => {
    await renderRoute('/')

    expect(screen.getByRole('link', { name: 'Orders dashboard' })).toHaveAttribute(
      'href',
      '/blocks/orders-dashboard',
    )
    expect(screen.getByRole('link', { name: 'Map projection explorer' })).toHaveAttribute(
      'href',
      '/labs/maps/map-projections',
    )
    expect(screen.getByRole('link', { name: 'Registry-driven documentation' })).toHaveAttribute(
      'href',
      '/projects/registry-driven-documentation',
    )
  })

  it('features the templates, each linked to its page', async () => {
    await renderRoute('/')
    const section = screen.getByRole('region', { name: 'Templates' })
    for (const template of templates) {
      expect(within(section).getByRole('link', { name: template.title })).toHaveAttribute(
        'href',
        `/templates/${template.slug}`,
      )
    }
    expect(within(section).getByRole('link', { name: 'All templates' })).toHaveAttribute(
      'href',
      '/templates',
    )
    // Real information from the template, not a placeholder: its views and the blocks it uses.
    expect(within(section).getByRole('list', { name: 'Admin dashboard views' })).toHaveTextContent(
      'Notifications',
    )
    expect(within(section).getByRole('list', { name: 'Admin dashboard blocks' })).toHaveTextContent(
      'Dashboard overview',
    )
  })

  it('features the public projects, labelled as public', async () => {
    await renderRoute('/')
    const section = screen.getByRole('region', { name: 'Projects' })
    for (const slug of [
      'hieu-ui-lab-platform',
      'hieu-ui-lab-component-library',
      'geospatial-3d-experiments',
    ]) {
      const project = getShowcaseProject(slug)
      expect(
        within(section).getByRole('link', { name: project?.title ?? slug }),
        slug,
      ).toHaveAttribute('href', `/projects/${slug}`)
    }
    expect(within(section).getAllByText('Public project')).toHaveLength(3)
    expect(within(section).getByRole('link', { name: 'All projects' })).toHaveAttribute(
      'href',
      '/projects',
    )
  })

  it('has no internal link that leads to the not-found page', { timeout: 30_000 }, async () => {
    const { container, unmount } = await renderRoute('/')
    const hrefs = new Set(
      Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'), (anchor) =>
        anchor.getAttribute('href'),
      ),
    )
    unmount()
    expect(hrefs.size).toBeGreaterThan(10)

    for (const href of hrefs) {
      if (!href) continue
      const view = await renderRoute(href)
      expect(
        screen.queryByRole('heading', { name: 'Page not found' }),
        `${href} should resolve`,
      ).toBeNull()
      expect(screen.getAllByRole('heading', { level: 1 }), href).toHaveLength(1)
      view.unmount()
    }
  })

  it('opens external links in a new tab with an accessible hint', async () => {
    await renderRoute('/')
    const stack = screen.getByRole('region', { name: 'Technology stack' })
    const react = within(stack).getByRole('link', { name: 'React (opens in a new tab)' })

    expect(react).toHaveAttribute('href', 'https://react.dev')
    expect(react).toHaveAttribute('target', '_blank')
    expect(react).toHaveAttribute('rel', 'noreferrer')
  })
})
