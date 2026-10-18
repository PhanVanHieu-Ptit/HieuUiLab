import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderRoute } from '@/test/render'

import { docNodes } from './manifest'

describe('docs pages as routes', () => {
  it.each(docNodes.map((node) => [node.href, node.entry.title] as const))(
    '%s renders its content under the h1 "%s"',
    async (href, title) => {
      await renderRoute(href)
      const main = screen.getByRole('main')
      expect(within(main).getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
      // Every page has a section of its own beyond the header.
      expect(within(main).getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0)
      // A directive or construct that failed would show a note saying so in place of the content.
      expect(within(main).queryByText(/^Cannot show|^Not supported in docs/)).toBeNull()
    },
  )

  it('scrolls to the heading a fragment names when the page is opened directly', async () => {
    // A direct load renders the layout first and the lazy page later, with the location unchanged.
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    scrollIntoView.mockClear()
    await renderRoute('/docs/installation#cn')
    await waitFor(() => {
      expect(scrollIntoView.mock.contexts).toContain(document.getElementById('cn'))
    })
    expect(document.getElementById('cn')).toHaveTextContent('Add the cn helper')
  })

  it('names the Markdown file it was written in', async () => {
    await renderRoute('/docs/theming')
    expect(screen.getByText('src/docs/content/theme-customization.md')).toBeInTheDocument()
  })
})

describe('nested navigation', () => {
  it('lists child pages under their parent in the sidebar and marks the current one', async () => {
    await renderRoute('/docs/component-conventions/adding-a-component')
    const sidebar = screen.getByRole('navigation', { name: 'Registry' })
    expect(within(sidebar).getByRole('heading', { name: 'Guides' })).toBeInTheDocument()

    const parent = within(sidebar).getByRole('link', { name: 'Component conventions' })
    const child = within(sidebar).getByRole('link', { name: 'Adding a component' })
    expect(parent.closest('li')).toContainElement(child)
    expect(parent.closest('ul')).not.toBe(child.closest('ul'))
    expect(child).toHaveAttribute('aria-current', 'page')
    expect(parent).not.toHaveAttribute('aria-current')
  })

  it('marks the parent, not its children, on the parent page', async () => {
    await renderRoute('/docs/block-composition')
    const sidebar = screen.getByRole('navigation', { name: 'Registry' })
    expect(within(sidebar).getByRole('link', { name: 'Block composition' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(sidebar).getByRole('link', { name: 'Adding a page block' })).not.toHaveAttribute(
      'aria-current',
    )
    expect(within(sidebar).getByRole('link', { name: 'Adding a template' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('shows the group and the parent in the breadcrumb of a nested page', async () => {
    await renderRoute('/docs/block-composition/templates')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(trail)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Home', 'Docs', 'Guides', 'Block composition', 'Adding a template'])
    expect(
      within(trail)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/', '/docs', '/docs/block-composition'])
    expect(within(trail).getByText('Adding a template')).toHaveAttribute('aria-current', 'page')
  })

  it('shows the parent as the last crumb of a parent page', async () => {
    await renderRoute('/docs/block-composition')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(trail)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Home', 'Docs', 'Guides', 'Block composition'])
  })

  it('has no breadcrumb group on the docs index', async () => {
    await renderRoute('/docs')
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(trail)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Home', 'Docs'])
  })

  it('opens a nested page from the sidebar link', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/docs/block-composition')
    const sidebar = screen.getByRole('navigation', { name: 'Registry' })
    await user.click(within(sidebar).getByRole('link', { name: 'Adding a page block' }))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/docs/block-composition/page-blocks')
    })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Adding a page block' }),
    ).toBeInTheDocument()
  })

  it('finds a nested page in the search menu', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Search docs' }))
    const input = await screen.findByRole('combobox')
    await user.type(input, 'adding a page{Enter}')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/docs/block-composition/page-blocks')
    })
  })
})

describe('copying code from a docs page', () => {
  it('copies a code block exactly', async () => {
    // Created before rendering: the copy button checks for the clipboard when it mounts.
    const user = userEvent.setup()
    await renderRoute('/docs/installation')
    await user.click(screen.getByRole('button', { name: 'Copy src/main.tsx' }))
    expect(await navigator.clipboard.readText()).toBe(
      "import '@fontsource-variable/ibm-plex-sans'\nimport '@fontsource-variable/jetbrains-mono'",
    )
    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()
  })

  it('shows the file of a ::source directive and copies it', async () => {
    const user = userEvent.setup()
    await renderRoute('/docs/installation')
    await user.click(screen.getByRole('button', { name: 'Copy src/lib/cn.ts' }))
    expect(await navigator.clipboard.readText()).toContain('twMerge')
  })
})

describe('generated content on a docs page', () => {
  it('embeds the design tokens from the stylesheet', async () => {
    await renderRoute('/docs/design-tokens')
    const colors = await screen.findByRole('table', { name: 'Color tokens' })
    expect(within(colors).getByRole('rowheader', { name: '--primary' })).toBeInTheDocument()
    expect(
      within(colors).getByRole('rowheader', { name: '--surface-foreground' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('table', { name: 'Interaction state utilities' }),
    ).toBeInTheDocument()
  })

  it('embeds the API tables of the entries a guide uses', async () => {
    await renderRoute('/docs/form-integration')
    expect(await screen.findByRole('table', { name: 'FormField props' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'useFormSubmit props' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'FormFeedback props' })).toBeInTheDocument()
  })

  it('lists the components and blocks on the API reference', async () => {
    await renderRoute('/docs/component-api')
    expect(screen.getByRole('table', { name: 'Actions components' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Actions blocks' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Pages blocks' })).toBeInTheDocument()
    // Pages are all blocks: no components table exists for them.
    expect(screen.queryByRole('table', { name: 'Pages components' })).toBeNull()
  })
})

describe('moved and missing docs pages', () => {
  it('redirects the old Architecture URL and replaces the history entry', async () => {
    const { router } = await renderRoute('/docs/architecture')
    expect(router.state.location.pathname).toBe('/docs/project-structure')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(screen.getByRole('heading', { level: 1, name: 'Project structure' })).toBeInTheDocument()
  })

  it('keeps the sidebar on a missing page and suggests where to go', async () => {
    const { router } = await renderRoute('/docs/block-composition/templatez')
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Registry' })).toBeInTheDocument()
    const suggestions = screen.getByRole('navigation', { name: 'Suggestions' })
    expect(within(suggestions).getByRole('link', { name: 'Adding a template' })).toHaveAttribute(
      'href',
      '/docs/block-composition/templates',
    )

    await act(() => router.navigate('/docs'))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Getting started' }),
    ).toBeInTheDocument()
  })
})
