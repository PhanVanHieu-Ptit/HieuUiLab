import { describe, expect, it, vi } from 'vitest'

import { createMapController } from './map-controller'
import { MapInitError } from './map-types'
import { FALLBACK_TOKENS, derivePalette } from './theme-colors'

// The library fails to download: a dynamic import that rejects, as on a dropped connection.
vi.mock('maplibre-gl', () => {
  throw new Error('Failed to fetch dynamically imported module')
})
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}))

describe('when the map library cannot be downloaded', () => {
  it('rejects with an import failure and builds nothing', async () => {
    const options = {
      palette: derivePalette(FALLBACK_TOKENS),
      visibility: { sites: true, route: true, zones: true },
      onFeatureClick: vi.fn(),
      onLayerStatus: vi.fn(),
      onBasemapReady: vi.fn(),
      onBasemapFailed: vi.fn(),
      onContextChange: vi.fn(),
    }
    const failure = createMapController(
      document.createElement('div'),
      options,
      new AbortController().signal,
    )
    await expect(failure).rejects.toBeInstanceOf(MapInitError)
    await expect(failure).rejects.toMatchObject({ kind: 'import-failed' })
    expect(options.onFeatureClick).not.toHaveBeenCalled()
  })
})
