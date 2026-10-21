import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderRoute } from '@/test/render'

// Hold the lazily loaded map demo until the test has seen the loading state;
// otherwise the chunk can resolve before the first assertion runs.
const mapDemoGate = vi.hoisted(() => {
  let release: (() => void) | undefined
  const ready = new Promise<void>((resolve) => {
    release = resolve
  })
  return { ready, release: () => release?.() }
})

vi.mock('@/lab/map-projections/map-projections-demo', async (importOriginal) => {
  await mapDemoGate.ready
  return importOriginal()
})

describe('Lab pages', () => {
  it('lists the experiments', async () => {
    await renderRoute('/labs')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Geospatial and 3D experiments' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'WebGL scene with motion controls' })).toHaveAttribute(
      'href',
      '/labs/3d/webgl-scene',
    )
  })

  it('shows a loading state, then the lazily loaded demo', async () => {
    await renderRoute('/labs/maps/map-projections')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Map projection explorer' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading experiment')
    mapDemoGate.release()
    expect(await screen.findByRole('tab', { name: 'Orthographic' })).toBeInTheDocument()
    expect(screen.queryByText('Loading experiment')).not.toBeInTheDocument()
  })

  it('shows the unavailable state for WebGL in an environment without it', async () => {
    await renderRoute('/labs/3d/webgl-scene')
    expect(await screen.findByRole('heading', { name: 'WebGL is unavailable' })).toBeInTheDocument()
  })

  it('lists the Three.js scene alongside the raw WebGL2 scene in the 3D category', async () => {
    await renderRoute('/labs/3d')
    expect(
      screen.getByRole('link', { name: 'Three.js scene with orbit controls' }),
    ).toHaveAttribute('href', '/labs/3d/three-scene')
    expect(screen.getByRole('link', { name: 'WebGL scene with motion controls' })).toHaveAttribute(
      'href',
      '/labs/3d/webgl-scene',
    )
  })

  it('opens the Three.js scene, which explains the missing scene where WebGL2 is unavailable', async () => {
    await renderRoute('/labs/3d/three-scene')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Three.js scene with orbit controls' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '3D scene unavailable' })).toBeInTheDocument()
    expect(screen.queryByText('Loading experiment')).not.toBeInTheDocument()
    // The explanation sits under the demo whether or not the demo can run.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Rendering pipeline' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Extending it' })).toBeInTheDocument()
  })

  it('lists the map viewer alongside the other geospatial experiment', async () => {
    await renderRoute('/labs/maps')
    expect(
      screen.getByRole('link', { name: 'Interactive map viewer with MapLibre' }),
    ).toHaveAttribute('href', '/labs/maps/maplibre-viewer')
    expect(screen.getByRole('link', { name: 'Map projection explorer' })).toHaveAttribute(
      'href',
      '/labs/maps/map-projections',
    )
  })

  it('opens the map viewer, which explains the missing map where WebGL2 is unavailable', async () => {
    await renderRoute('/labs/maps/maplibre-viewer')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Interactive map viewer with MapLibre' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Interactive map unavailable' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Loading experiment')).not.toBeInTheDocument()
  })

  it('links back to the lab from the breadcrumb', async () => {
    await renderRoute('/labs/3d/webgl-scene')
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'Labs' })).toHaveAttribute('href', '/labs')
    expect(within(breadcrumb).getByRole('link', { name: '3D' })).toHaveAttribute('href', '/labs/3d')
  })
})

describe('Project pages', () => {
  it('lists case studies and opens one', async () => {
    await renderRoute('/projects')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Projects and case studies' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'A contrast-tested design system' })).toHaveAttribute(
      'href',
      '/projects/contrast-tested-design-system',
    )
  })

  it('renders the case study with facts and sections', async () => {
    await renderRoute('/projects/contrast-tested-design-system')

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
  it('lists notes with machine-readable dates', async () => {
    await renderRoute('/notes')
    expect(screen.getByRole('heading', { level: 1, name: 'Engineering notes' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Switching themes without a first-paint flash' })
    expect(link).toHaveAttribute('href', '/notes/theme-without-flash')
    expect(document.querySelector('time[datetime="2026-10-13"]')).not.toBeNull()
  })

  it('renders a note', async () => {
    await renderRoute('/notes/theme-without-flash')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Switching themes without a first-paint flash',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Implementation example' })).toBeVisible()
  })
})

describe('unknown slugs', () => {
  it.each(['/labs/maps/nope', '/labs/nope', '/projects/nope', '/notes/nope', '/blocks/nope'])(
    '%s renders the not-found page',
    async (path) => {
      await renderRoute(path)
      expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    },
  )
})
