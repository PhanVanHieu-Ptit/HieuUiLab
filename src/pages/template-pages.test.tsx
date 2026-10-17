import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { siteConfig } from '@/config/site'
import { templates } from '@/content/templates'
import { renderRoute } from '@/test/render'

describe('Templates index', () => {
  it('lists every template with its views and blocks, linked to its page', async () => {
    await renderRoute('/templates')
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Templates' })).toBeInTheDocument()

    const cards = within(main).getAllByRole('heading', { level: 2 })
    expect(cards.map((heading) => heading.textContent)).toEqual(
      templates.map((template) => template.title),
    )
    for (const template of templates) {
      expect(within(main).getByRole('link', { name: template.title })).toHaveAttribute(
        'href',
        `/templates/${template.slug}`,
      )
      const views = within(main).getByRole('list', { name: `${template.title} views` })
      expect(
        within(views)
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(template.views.map((view) => view.label))
      expect(
        within(main).getByRole('list', { name: `${template.title} blocks` }),
      ).toBeInTheDocument()
    }
  })

  it('opens a template from its card', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/templates')
    await user.click(screen.getByRole('link', { name: 'Admin dashboard' }))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/templates/admin-dashboard')
    })
  })
})

describe('Template detail', () => {
  it('shows the sections in order under one h1', async () => {
    await renderRoute('/templates/operations-monitoring')
    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Operations monitoring' }),
    ).toBeInTheDocument()
    expect(
      within(main)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([
      'Live preview',
      'Blocks used',
      'Views and composition',
      'Design decisions',
      'Known limitations',
      'Files and example data',
    ])
  })

  it('runs the template in a resizable preview, with the app inside it', async () => {
    await renderRoute('/templates/admin-dashboard')
    const preview = await screen.findByRole('group', { name: 'Admin dashboard template preview' })
    expect(
      await within(preview).findByRole('navigation', { name: 'Workspace admin sections' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Preview width' })).toBeInTheDocument()
    expect(screen.getByText(/invented data/i, { selector: 'p' })).toBeInTheDocument()
  })

  it('shows the source the preview runs from in the Code tab', async () => {
    const user = userEvent.setup()
    await renderRoute('/templates/admin-dashboard')
    await screen.findByRole('group', { name: 'Admin dashboard template preview' })
    await user.click(screen.getByRole('tab', { name: 'Code' }))
    await waitFor(() => {
      expect(document.body.textContent).toContain('export function AdminDashboardTemplate')
    })
  })

  it('links each block it is built from to the block’s page', async () => {
    await renderRoute('/templates/admin-dashboard')
    const section = screen.getByRole('region', { name: 'Blocks used' })
    expect(within(section).getByRole('link', { name: 'Dashboard overview' })).toHaveAttribute(
      'href',
      '/blocks/dashboard-overview',
    )
    expect(within(section).getByRole('link', { name: 'Notification center' })).toHaveAttribute(
      'href',
      '/blocks/notification-center',
    )
    expect(within(section).getByRole('link', { name: 'User profile settings' })).toHaveAttribute(
      'href',
      '/blocks/user-profile-settings',
    )
  })

  it('lists its views, decisions, and limitations from the manifest', async () => {
    await renderRoute('/templates/data-management-workspace')
    const template = templates.find((item) => item.slug === 'data-management-workspace')
    if (!template) throw new Error('Missing template')

    const views = screen.getByRole('list', { name: 'Views' })
    expect(within(views).getAllByRole('heading', { level: 3 })).toHaveLength(template.views.length)
    for (const decision of template.decisions) {
      expect(screen.getByRole('heading', { level: 3, name: decision.title })).toBeInTheDocument()
    }
    for (const limitation of template.limitations) {
      expect(screen.getByText(limitation)).toBeInTheDocument()
    }
  })

  it('links its source and example data files on GitHub in a new tab', async () => {
    await renderRoute('/templates/admin-dashboard')
    const source = screen.getByRole('list', { name: 'Source files' })
    const first = within(source).getAllByRole('link')[0]
    expect(first).toHaveAttribute(
      'href',
      `${siteConfig.githubUrl}/blob/main/src/templates/admin-dashboard/template.tsx`,
    )
    expect(first).toHaveAttribute('target', '_blank')
    expect(first).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    expect(
      within(screen.getByRole('list', { name: 'Example data files' })).getAllByRole('link'),
    ).toHaveLength(3)
  })

  it('is labelled experimental, not planned, and is indexable', async () => {
    await renderRoute('/templates/admin-dashboard')
    // The preview's own example data may say "Planned"; the page's label is what matters here.
    const header = screen.getByRole('heading', { level: 1 }).closest('header')
    if (!header) throw new Error('The page has no header.')
    expect(within(header).getByText('Experimental')).toBeInTheDocument()
    expect(within(header).queryByText('Planned')).toBeNull()
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })
})
