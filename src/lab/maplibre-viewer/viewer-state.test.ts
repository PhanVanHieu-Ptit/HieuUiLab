import { describe, expect, it } from 'vitest'

import type { FeatureRef } from './layers'
import {
  INITIAL_VISIBILITY,
  displayStatus,
  initialViewerState,
  viewerReducer,
  type ViewerAction,
  type ViewerState,
} from './viewer-state'

const site: FeatureRef = { layer: 'sites', id: 'lumen-harbour' }
const zone: FeatureRef = { layer: 'zones', id: 'harbour-district' }

function run(actions: readonly ViewerAction[], from: ViewerState = initialViewerState) {
  return actions.reduce(viewerReducer, from)
}

describe('viewerReducer', () => {
  it('starts with every layer visible, nothing selected, and the bundled basemap', () => {
    expect(initialViewerState.visibility).toEqual({ sites: true, route: true, zones: true })
    expect(initialViewerState.selected).toBeNull()
    expect(initialViewerState.basemap).toEqual({ requested: 'bundled', phase: 'ready', error: null })
    expect(INITIAL_VISIBILITY).toEqual(initialViewerState.visibility)
  })

  describe('layer visibility', () => {
    it('toggles one layer and leaves the others alone', () => {
      const state = run([{ type: 'toggleLayer', layer: 'route', visible: false }])
      expect(state.visibility).toEqual({ sites: true, route: false, zones: true })
    })

    it('returns the same state when nothing changes', () => {
      expect(run([{ type: 'toggleLayer', layer: 'route', visible: true }])).toBe(initialViewerState)
    })

    it('clears a selection that belongs to the layer being hidden', () => {
      const state = run([
        { type: 'select', ref: site },
        { type: 'toggleLayer', layer: 'sites', visible: false },
      ])
      expect(state.selected).toBeNull()
    })

    it('keeps a selection that belongs to another layer', () => {
      const state = run([
        { type: 'select', ref: site },
        { type: 'toggleLayer', layer: 'zones', visible: false },
      ])
      expect(state.selected).toEqual(site)
    })

    it('does not change the visibility object it was given', () => {
      const before = initialViewerState.visibility
      run([{ type: 'toggleLayer', layer: 'sites', visible: false }])
      expect(before.sites).toBe(true)
    })
  })

  describe('selection', () => {
    it('selects a feature and clears it', () => {
      const selected = run([{ type: 'select', ref: site }])
      expect(selected.selected).toEqual(site)
      expect(run([{ type: 'clearSelection' }], selected).selected).toBeNull()
    })

    it('replaces the selection with another feature', () => {
      expect(run([{ type: 'select', ref: site }, { type: 'select', ref: zone }]).selected).toEqual(
        zone,
      )
    })

    it('ignores a selection on a hidden layer', () => {
      const state = run([
        { type: 'toggleLayer', layer: 'sites', visible: false },
        { type: 'select', ref: site },
      ])
      expect(state.selected).toBeNull()
    })

    it('returns the same state for a repeat selection and a repeat clear', () => {
      const selected = run([{ type: 'select', ref: site }])
      expect(viewerReducer(selected, { type: 'select', ref: { ...site } })).toBe(selected)
      expect(viewerReducer(initialViewerState, { type: 'clearSelection' })).toBe(initialViewerState)
    })
  })

  describe('basemap', () => {
    it('goes to loading when the visitor asks for the online basemap', () => {
      const state = run([{ type: 'requestOnline' }])
      expect(state.basemap).toEqual({ requested: 'online', phase: 'loading', error: null })
    })

    it('becomes ready when the provider has drawn', () => {
      const state = run([{ type: 'requestOnline' }, { type: 'basemapReady' }])
      expect(state.basemap).toEqual({ requested: 'online', phase: 'ready', error: null })
    })

    it('ignores a late ready report after the visitor went back to the bundled map', () => {
      const state = run([{ type: 'requestOnline' }, { type: 'useBundled' }, { type: 'basemapReady' }])
      expect(state.basemap.requested).toBe('bundled')
    })

    it('falls back to the bundled basemap and keeps the reason', () => {
      const state = run([
        { type: 'requestOnline' },
        { type: 'basemapFailed', message: 'The host refused requests (HTTP 429).' },
      ])
      expect(state.basemap).toEqual({
        requested: 'bundled',
        phase: 'ready',
        error: 'The host refused requests (HTTP 429).',
      })
    })

    it('clears the reason when the visitor tries again', () => {
      const state = run([
        { type: 'basemapFailed', message: 'x' },
        { type: 'requestOnline' },
      ])
      expect(state.basemap.error).toBeNull()
    })

    it('keeps visibility and selection across a basemap change', () => {
      const state = run([
        { type: 'toggleLayer', layer: 'zones', visible: false },
        { type: 'select', ref: site },
        { type: 'requestOnline' },
        { type: 'basemapFailed', message: 'x' },
      ])
      expect(state.visibility.zones).toBe(false)
      expect(state.selected).toEqual(site)
    })
  })

  describe('layer status', () => {
    const ready = { sites: 'ready', route: 'ready', zones: 'ready' } as const

    it('stores what the map reports', () => {
      expect(run([{ type: 'layerStatus', statuses: ready }]).layerStatus).toEqual(ready)
    })

    it('returns the same state for an identical report', () => {
      const once = run([{ type: 'layerStatus', statuses: ready }])
      expect(viewerReducer(once, { type: 'layerStatus', statuses: { ...ready } })).toBe(once)
    })

    it('goes back to loading when a new map starts, and keeps the visitor’s choices', () => {
      const state = run([
        { type: 'layerStatus', statuses: ready },
        { type: 'toggleLayer', layer: 'route', visible: false },
        { type: 'mapReset' },
      ])
      expect(state.layerStatus).toEqual({ sites: 'loading', route: 'loading', zones: 'loading' })
      expect(state.visibility.route).toBe(false)
    })
  })
})

describe('displayStatus', () => {
  it('shows hidden for a hidden layer, whatever the map reports', () => {
    const state = run([
      { type: 'layerStatus', statuses: { sites: 'error', route: 'ready', zones: 'loading' } },
      { type: 'toggleLayer', layer: 'sites', visible: false },
    ])
    expect(displayStatus(state, 'sites')).toBe('hidden')
    expect(displayStatus(state, 'route')).toBe('ready')
    expect(displayStatus(state, 'zones')).toBe('loading')
  })

  it('shows an error for a visible layer that failed', () => {
    const state = run([
      { type: 'layerStatus', statuses: { sites: 'error', route: 'ready', zones: 'ready' } },
    ])
    expect(displayStatus(state, 'sites')).toBe('error')
  })
})
