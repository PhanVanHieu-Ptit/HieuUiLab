import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

describe('Lab pages', () => {
  it('lists the experiments', () => {
    renderRoute('/lab')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Geospatial and 3D experiments' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'WebGL scene with motion controls' })).toHaveAttribute(
      'href',
      '/lab/webgl-scene',
    )
  })

  it('shows a loading state, then the lazily loaded demo', async () => {
    renderRoute('/lab/map-projections')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Map projection explorer' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading experiment')
    expect(await screen.findByRole('tab', { name: 'Orthographic' })).toBeInTheDocument()
    expect(screen.queryByText('Loading experiment')).not.toBeInTheDocument()
  })

  it('shows the unavailable state for WebGL in an environment without it', async () => {
    renderRoute('/lab/webgl-scene')
    expect(await screen.findByRole('heading', { name: 'WebGL is unavailable' })).toBeInTheDocument()
  })

  it('links back to the lab from the breadcrumb', () => {
    renderRoute('/lab/webgl-scene')
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'Lab' })).toHaveAttribute('href', '/lab')
  })
})

describe('Project pages', () => {
  it('lists case studies and opens one', () => {
    renderRoute('/projects')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Engineering case studies' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'A contrast-tested design system' })).toHaveAttribute(
      'href',
      '/projects/contrast-tested-design-system',
    )
  })

  it('renders the case study with facts and sections', () => {
    renderRoute('/projects/contrast-tested-design-system')

    expect(
      screen.getByRole('heading', { level: 1, name: 'A contrast-tested design system' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Outcome')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Trade-offs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Theming docs' })).toHaveAttribute(
      'href',
      '/docs/theming',
    )
  })
})

describe('Note pages', () => {
  it('lists notes with machine-readable dates', () => {
    renderRoute('/notes')
    expect(screen.getByRole('heading', { level: 1, name: 'Technical notes' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Switching themes without a first-paint flash' })
    expect(link).toHaveAttribute('href', '/notes/theme-without-flash')
    expect(document.querySelector('time[datetime="2026-10-13"]')).not.toBeNull()
  })

  it('renders a note', () => {
    renderRoute('/notes/theme-without-flash')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Switching themes without a first-paint flash',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Decide before first paint' }),
    ).toBeVisible()
  })
})

describe('unknown slugs', () => {
  it.each(['/lab/nope', '/projects/nope', '/notes/nope', '/blocks/nope'])(
    '%s renders the not-found page',
    (path) => {
      renderRoute(path)
      expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    },
  )
})
