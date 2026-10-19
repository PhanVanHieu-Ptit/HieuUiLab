import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { getProject } from '@/content/projects'
import { getTemplate } from '@/content/templates'
import { docNodes } from '@/docs/manifest'
import { getNote, noteHref, notes } from '@/notes/manifest'
import { renderRoute } from '@/test/render'

const note = getNote('theme-without-flash')
const project = getProject('contrast-tested-design-system')
const template = getTemplate('admin-dashboard')

/** Every required route, with its expected page title (before " · Hieu UI Lab"). */
const requiredRoutes: readonly [path: string, title: string | null][] = [
  ['/', null],
  ['/components', 'Components'],
  ['/components/button', 'Button'],
  ['/blocks', 'Blocks'],
  ['/blocks/resource-list', 'Resource list'],
  ['/templates', 'Templates'],
  ['/templates/admin-dashboard', 'Admin dashboard'],
  ['/templates/operations-monitoring', 'Operations monitoring'],
  ['/templates/data-management-workspace', 'Data management workspace'],
  ['/playground', 'Playground'],
  ['/labs', 'Labs'],
  ['/labs/maps', 'Maps'],
  ['/labs/3d', '3D'],
  // Every documentation page, taken from the manifest the routes are generated from.
  ...docNodes.map((node): [string, string] => [node.href, node.entry.title]),
  ['/notes', 'Notes'],
  // Every article, taken from the manifest the loader reads.
  ...notes.map((entry): [string, string] => [noteHref(entry), entry.title]),
  ['/projects', 'Projects'],
  ['/projects/contrast-tested-design-system', project?.title ?? 'missing project'],
  ['/about', 'About'],
]

function metaContent(selector: string): string | null {
  return document.head.querySelector<HTMLMetaElement>(selector)?.content ?? null
}

describe('required routes', () => {
  it.each(requiredRoutes)('%s renders one page with its title', async (path, title) => {
    const { container } = await renderRoute(path)

    expect(screen.queryByRole('heading', { name: 'Page not found' })).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(container.querySelectorAll('main')).toHaveLength(1)
    await waitFor(() => {
      expect(document.title).toBe(title ? `${title} · Hieu UI Lab` : 'Hieu UI Lab')
    })
    expect(metaContent('meta[name="description"]')).toBeTruthy()
    expect(metaContent('meta[property="og:title"]')).toBe(document.title)
  })

  it('describes a detail page with its own summary', async () => {
    await renderRoute('/notes/theme-without-flash')
    await waitFor(() => {
      expect(metaContent('meta[name="description"]')).toBe(note?.summary)
    })
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })
})

describe('breadcrumbs', () => {
  it.each([
    ['/labs/3d/webgl-scene', ['Home', 'Labs', '3D'], 'WebGL scene with motion controls'],
    ['/labs/maps', ['Home', 'Labs'], 'Maps'],
    ['/notes/theme-without-flash', ['Home', 'Notes'], note?.title],
    // The group a page belongs to is a crumb without a link.
    ['/docs/installation', ['Home', 'Docs'], 'Installation'],
    ['/blocks/empty-state', ['Home', 'Blocks', 'Feedback'], 'Empty state'],
    ['/templates/operations-monitoring', ['Home', 'Templates'], 'Operations monitoring'],
    ['/about', ['Home'], 'About'],
  ] as const)('%s follows the URL', async (path, links, current) => {
    await renderRoute(path)
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(trail)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(links)
    expect(within(trail).getByText(current ?? '')).toHaveAttribute('aria-current', 'page')
  })

  it('is not shown on the home page', async () => {
    await renderRoute('/')
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
  })

  it('names the group of a docs page, without a link, between Docs and the page', async () => {
    await renderRoute('/docs/installation')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(trail)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Home', 'Docs', 'Overview', 'Installation'])
    expect(within(trail).queryByRole('link', { name: 'Overview' })).toBeNull()
  })
})

describe('the templates routes', () => {
  it('are built pages: indexable, not labelled planned, and current in the sidebar', async () => {
    await renderRoute('/templates')
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Templates' })).toBeInTheDocument()
    expect(within(main).queryByText('Planned')).toBeNull()
    expect(within(main).queryByText('Not implemented yet')).toBeNull()
    await waitFor(() => {
      expect(document.title).toBe('Templates · Hieu UI Lab')
    })
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    const sidebar = screen.getByRole('navigation', { name: 'Registry' })
    expect(
      within(sidebar).getByRole('link', { name: 'All templates', current: 'page' }),
    ).toHaveAttribute('href', '/templates')
  })

  it('describe a template with its own summary and mark it in the sidebar', async () => {
    await renderRoute('/templates/admin-dashboard')
    await waitFor(() => {
      expect(metaContent('meta[name="description"]')).toBe(template?.summary)
    })
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    const sidebar = screen.getByRole('navigation', { name: 'Registry' })
    expect(
      within(sidebar).getByRole('link', { name: /^Admin dashboard/, current: 'page' }),
    ).toHaveAttribute('href', '/templates/admin-dashboard')
    expect(within(sidebar).getByRole('link', { name: 'All templates' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('keep Templates active in the header on a template page', async () => {
    await renderRoute('/templates/data-management-workspace')
    const header = screen.getByRole('navigation', { name: 'Main' })
    expect(within(header).getByRole('link', { name: 'Templates' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(header).getByRole('link', { name: 'Blocks' })).not.toHaveAttribute('aria-current')
  })
})

describe('the playground route', () => {
  it('is a built page: indexable, not labelled planned, and current in the sidebar', async () => {
    await renderRoute('/playground')
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Playground' })).toBeInTheDocument()
    expect(within(main).queryByText('Planned')).toBeNull()
    expect(within(main).queryByText('Not implemented yet')).toBeNull()
    await waitFor(() => {
      expect(document.title).toBe('Playground · Hieu UI Lab')
    })
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    const sidebar = screen.getByRole('navigation', { name: 'Registry' })
    expect(
      within(sidebar).getByRole('link', { name: 'Playground', current: 'page' }),
    ).toHaveAttribute('href', '/playground')
  })
})

describe('invalid URLs', () => {
  it.each([
    ['/components/nope', 'Components'],
    ['/blocks/nope', 'Blocks'],
    ['/templates/nope', 'Templates'],
    ['/notes/nope', 'Notes'],
    ['/projects/nope', 'Projects'],
    ['/labs/nope', 'Labs'],
    ['/labs/maps/nope', 'Maps'],
  ])('%s shows not-found with a way back to %s', async (path, section) => {
    await renderRoute(path)
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Browse ${section}` })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
    await waitFor(() => {
      expect(document.title).toBe('Page not found · Hieu UI Lab')
    })
    expect(metaContent('meta[name="robots"]')).toBe('noindex')
  })

  it('keeps the docs sidebar for an unknown component', async () => {
    await renderRoute('/components/nope')
    expect(screen.getByRole('navigation', { name: 'Registry' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it.each(['/xyz', '/notes/a/b'])('%s renders the not-found page', async (path) => {
    await renderRoute(path)
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Browse/ })).toBeNull()
    await waitFor(() => {
      expect(document.title).toBe('Page not found · Hieu UI Lab')
    })
  })
})

describe('an unknown docs page', () => {
  it.each(['/docs/nope', '/docs/installation/nope', '/docs/a/b/c'])(
    '%s is a 404 inside the docs layout',
    async (path) => {
      await renderRoute(path)
      expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
      // The sidebar stays, with a way back to the docs.
      expect(screen.getByRole('navigation', { name: 'Registry' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Browse Docs' })).toHaveAttribute('href', '/docs')
      expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
      expect(screen.getAllByRole('main')).toHaveLength(1)
      await waitFor(() => {
        expect(document.title).toBe('Page not found · Hieu UI Lab')
      })
      expect(metaContent('meta[name="robots"]')).toBe('noindex')
    },
  )

  it('suggests the pages closest to a mistyped path', async () => {
    await renderRoute('/docs/instalation')
    const suggestions = screen.getByRole('navigation', { name: 'Suggestions' })
    expect(within(suggestions).getByRole('link', { name: 'Installation' })).toHaveAttribute(
      'href',
      '/docs/installation',
    )
  })

  it('suggests nothing for a path unlike any page', async () => {
    await renderRoute('/docs/zzzzzzzz')
    expect(screen.queryByRole('navigation', { name: 'Suggestions' })).toBeNull()
  })
})

describe('redirects', () => {
  it.each([
    ['/docs/architecture', '/docs/project-structure'],
    ['/lab', '/labs'],
    ['/lab/map-projections', '/labs/maps/map-projections'],
    ['/lab/webgl-scene', '/labs/3d/webgl-scene'],
    ['/labs/3d/map-projections', '/labs/maps/map-projections'],
    ['/components/empty-state', '/blocks/empty-state'],
    ['/blocks/button', '/components/button'],
  ])('%s → %s', async (from, to) => {
    const { router } = await renderRoute(from)
    expect(router.state.location.pathname).toBe(to)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('does not keep an unknown legacy lab URL alive', async () => {
    await renderRoute('/lab/nope')
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})

describe('history', () => {
  it('restores pages on back and forward', async () => {
    const { router } = await renderRoute('/labs')
    const h1 = () => screen.getByRole('heading', { level: 1 }).textContent

    for (const path of ['/labs/3d', '/labs/3d/webgl-scene']) {
      await act(() => router.navigate(path))
    }
    await waitFor(() => {
      expect(h1()).toBe('WebGL scene with motion controls')
    })

    await act(() => router.navigate(-1))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/labs/3d')
      expect(h1()).toBe('3D')
    })

    await act(() => router.navigate(-1))
    await waitFor(() => {
      expect(h1()).toBe('Geospatial and 3D experiments')
    })

    await act(() => router.navigate(1))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/labs/3d')
      expect(document.title).toBe('3D · Hieu UI Lab')
    })
  })
})

describe('active navigation', () => {
  it('marks the section in the header on nested pages', async () => {
    await renderRoute('/labs/3d/webgl-scene')
    const header = screen.getByRole('navigation', { name: 'Main' })
    expect(within(header).getByRole('link', { name: 'Labs' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(header).getByRole('link', { name: 'Docs' })).not.toHaveAttribute('aria-current')
  })

  it('does not mark Docs as active on component pages', async () => {
    await renderRoute('/components/button')
    const header = screen.getByRole('navigation', { name: 'Main' })
    expect(within(header).getByRole('link', { name: 'Components' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(header).getByRole('link', { name: 'Docs' })).not.toHaveAttribute('aria-current')
  })
})
