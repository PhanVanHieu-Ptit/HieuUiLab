import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MaplibreViewerDemo } from './maplibre-viewer-demo'

// Neither `webgl-support` nor the controller is mocked here: this is the path every test that
// renders a lab route in jsdom takes. jsdom cannot create a WebGL2 context, so the demo must
// stop before the map library is imported.
const library = vi.hoisted(() => ({ loads: 0 }))

vi.mock('maplibre-gl', () => {
  library.loads += 1
  return {}
})
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => {
  library.loads += 1
  return {}
})

describe('the demo where WebGL2 is missing', () => {
  it('explains that the map is unavailable', () => {
    render(<MaplibreViewerDemo />)
    expect(screen.getByRole('heading', { name: 'Interactive map unavailable' })).toBeInTheDocument()
    expect(screen.getByText(/could not create a WebGL2 context/)).toBeInTheDocument()
  })

  it('never downloads the map library', async () => {
    render(<MaplibreViewerDemo />)
    // Give any stray dynamic import time to run before checking.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(library.loads).toBe(0)
  })

  it('shows no controls that would have nothing to control', () => {
    render(<MaplibreViewerDemo />)
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
