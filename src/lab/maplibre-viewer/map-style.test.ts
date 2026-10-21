import type { StyleSpecification } from 'maplibre-gl'
import { describe, expect, it } from 'vitest'

import { HUB_ID } from './data'
import { HIT_PRIORITY, LAYER_IDS, LAYERS, layerOfStyleLayer } from './layers'
import {
  bundledBaseStyle,
  composeStyle,
  dataLayers,
  dataSources,
  featureRefFromHit,
  isUsableStyle,
  paintUpdates,
  pickFeature,
  selectionFilter,
  type DesiredState,
} from './map-style'
import { FALLBACK_TOKENS, derivePalette } from './theme-colors'

const palette = derivePalette(FALLBACK_TOKENS)

const desired: DesiredState = {
  palette,
  visibility: { sites: true, route: true, zones: true },
  selected: null,
}

const providerStyle: StyleSpecification = {
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'https://tiles.example.com/tiles.json' } },
  layers: [
    { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water' },
    { id: 'road', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation' },
  ],
  glyphs: 'https://tiles.example.com/fonts/{fontstack}/{range}.pbf',
}

describe('the bundled basemap', () => {
  const style = bundledBaseStyle(palette)

  it('needs no network: no glyphs, no sprite, no remote sources', () => {
    expect(style.glyphs).toBeUndefined()
    expect(style.sprite).toBeUndefined()
    for (const source of Object.values(style.sources)) {
      expect(source.type).toBe('geojson')
      if (source.type === 'geojson') expect(typeof source.data).toBe('object')
    }
  })

  it('has no text layers, since labels would need a glyph server', () => {
    expect(style.layers.some((layer) => layer.type === 'symbol')).toBe(false)
  })

  it('draws ocean, then graticule, then the island', () => {
    expect(style.layers.map((layer) => layer.id)).toEqual([
      'lab-ocean',
      'lab-graticule',
      'lab-land-fill',
      'lab-land-outline',
    ])
  })
})

describe('data layers', () => {
  it('draws zones, then the route, then sites, so markers are on top', () => {
    const order = dataLayers(desired).map((layer) => layer.id)
    const indexOf = (id: string) => order.indexOf(id)
    expect(indexOf('lab-zones-fill')).toBeLessThan(indexOf('lab-route-line'))
    expect(indexOf('lab-route-line')).toBeLessThan(indexOf('lab-sites-circle'))
  })

  it('builds exactly the style layers the registry names', () => {
    const built = dataLayers(desired).map((layer) => layer.id)
    const registered = LAYER_IDS.flatMap((id) => LAYERS[id].styleLayerIds)
    expect([...built].sort()).toEqual([...registered].sort())
  })

  it('gives every layer a source that exists', () => {
    const sources = dataSources()
    for (const layer of dataLayers(desired)) {
      expect(layer.type === 'background' ? null : layer.source).not.toBeUndefined()
      if (layer.type !== 'background') expect(sources).toHaveProperty([layer.source])
    }
  })

  it('names the hit layer of every map layer among the built layers', () => {
    const built = new Set(dataLayers(desired).map((layer) => layer.id))
    for (const id of LAYER_IDS) expect(built.has(LAYERS[id].hitLayerId)).toBe(true)
  })

  it('prefixes every id so it cannot collide with a provider’s layers', () => {
    for (const layer of dataLayers(desired)) expect(layer.id.startsWith('lab-')).toBe(true)
    for (const id of Object.keys(dataSources())) expect(id.startsWith('lab-')).toBe(true)
  })

  it('bakes visibility into the layout', () => {
    const hidden = dataLayers({ ...desired, visibility: { sites: false, route: true, zones: true } })
    const visibilityOf = (id: string) => hidden.find((layer) => layer.id === id)?.layout?.visibility
    expect(visibilityOf('lab-sites-circle')).toBe('none')
    expect(visibilityOf('lab-sites-selected')).toBe('none')
    expect(visibilityOf('lab-route-line')).toBe('visible')
  })

  it('uses a colour from the palette for each category', () => {
    const circle = dataLayers(desired).find((layer) => layer.id === 'lab-sites-circle')
    expect(JSON.stringify(circle)).toContain(palette.categories.harbour)
    expect(JSON.stringify(circle)).toContain(palette.categories.depot)
  })
})

describe('selectionFilter', () => {
  it('matches the selected feature on its own layer', () => {
    expect(selectionFilter({ layer: 'sites', id: HUB_ID }, 'sites')).toEqual([
      '==',
      ['get', 'id'],
      HUB_ID,
    ])
  })

  it('matches nothing when nothing is selected, and is never null', () => {
    // A null filter would remove the filter and highlight every feature.
    expect(selectionFilter(null, 'sites')).toEqual(['==', ['get', 'id'], ''])
  })

  it('matches nothing on a layer the selection does not belong to', () => {
    expect(selectionFilter({ layer: 'sites', id: HUB_ID }, 'route')).toEqual(['==', ['get', 'id'], ''])
  })

  it('is baked into the highlight layers', () => {
    const layers = dataLayers({ ...desired, selected: { layer: 'zones', id: 'harbour-district' } })
    const filterOf = (id: string) => layers.find((layer) => layer.id === id)
    expect(filterOf('lab-zones-selected')).toMatchObject({
      filter: ['==', ['get', 'id'], 'harbour-district'],
    })
    expect(filterOf('lab-sites-selected')).toMatchObject({ filter: ['==', ['get', 'id'], ''] })
  })
})

describe('composeStyle', () => {
  it('puts the data layers above the base layers and keeps the base style’s own settings', () => {
    const style = composeStyle(providerStyle, desired)
    const ids = style.layers.map((layer) => layer.id)
    expect(ids.slice(0, 2)).toEqual(['water', 'road'])
    expect(ids.at(-1)).toBe('lab-sites-circle')
    expect(style.glyphs).toBe(providerStyle.glyphs)
    expect(Object.keys(style.sources)).toEqual(
      expect.arrayContaining(['openmaptiles', ...Object.keys(dataSources())]),
    )
  })

  it('does not change the style it was given', () => {
    const before = JSON.stringify(providerStyle)
    composeStyle(providerStyle, desired)
    expect(JSON.stringify(providerStyle)).toBe(before)
  })

  it('has unique layer ids', () => {
    const ids = composeStyle(bundledBaseStyle(palette), desired).layers.map((layer) => layer.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('isUsableStyle', () => {
  it('accepts a version 8 style with layers and sources', () => {
    expect(isUsableStyle(providerStyle)).toBe(true)
  })

  it.each([
    ['null', null],
    ['text', 'style'],
    ['the wrong version', { version: 7, sources: {}, layers: [] }],
    ['no layers', { version: 8, sources: {} }],
    ['no sources', { version: 8, layers: [] }],
    ['null sources', { version: 8, sources: null, layers: [] }],
  ])('rejects %s', (_name, value) => {
    expect(isUsableStyle(value)).toBe(false)
  })
})

describe('paintUpdates', () => {
  it('covers the data layers, and the base layers only when asked', () => {
    const withBase = new Set(paintUpdates(palette, true).map((update) => update.layerId))
    const withoutBase = new Set(paintUpdates(palette, false).map((update) => update.layerId))
    expect(withBase.has('lab-ocean')).toBe(true)
    expect(withoutBase.has('lab-ocean')).toBe(false)
    expect(withoutBase.has('lab-route-line')).toBe(true)
  })

  it('follows the palette it is given', () => {
    const other = derivePalette({ ...FALLBACK_TOKENS, primary: '#ff0000' })
    const route = (colours: typeof palette) =>
      paintUpdates(colours, false).find(
        (update) => update.layerId === 'lab-route-line' && update.property === 'line-color',
      )?.value
    expect(route(palette)).toBe(palette.route)
    expect(route(other)).toBe('#ff0000')
  })
})

describe('picking a feature from a click', () => {
  const site = { styleLayerId: 'lab-sites-circle', properties: { id: HUB_ID } }
  const line = { styleLayerId: 'lab-route-line', properties: { id: 'coastal-loop' } }
  const zone = { styleLayerId: 'lab-zones-fill', properties: { id: 'harbour-district' } }

  it('maps a style layer back to its layer', () => {
    expect(layerOfStyleLayer('lab-sites-circle')).toBe('sites')
    expect(layerOfStyleLayer('lab-zones-outline')).toBe('zones')
    expect(layerOfStyleLayer('water')).toBeNull()
  })

  it('prefers points, then the line, then zones, whatever order the map returns', () => {
    expect(HIT_PRIORITY).toEqual(['sites', 'route', 'zones'])
    expect(pickFeature([zone, line, site])).toEqual({ layer: 'sites', id: HUB_ID })
    expect(pickFeature([zone, line])).toEqual({ layer: 'route', id: 'coastal-loop' })
    expect(pickFeature([zone])).toEqual({ layer: 'zones', id: 'harbour-district' })
  })

  it('returns null for an empty click', () => {
    expect(pickFeature([])).toBeNull()
  })

  it('skips a hit it cannot trust and falls through to the next', () => {
    const forged = { styleLayerId: 'lab-sites-circle', properties: { id: 'not-a-site' } }
    expect(pickFeature([forged, zone])).toEqual({ layer: 'zones', id: 'harbour-district' })
  })

  describe('featureRefFromHit', () => {
    it.each([
      ['a layer that is not ours', { styleLayerId: 'water', properties: { id: HUB_ID } }],
      ['no properties', { styleLayerId: 'lab-sites-circle', properties: null }],
      ['text for properties', { styleLayerId: 'lab-sites-circle', properties: 'x' }],
      ['a numeric id', { styleLayerId: 'lab-sites-circle', properties: { id: 3 } }],
      ['an id from another layer', { styleLayerId: 'lab-zones-fill', properties: { id: HUB_ID } }],
    ])('rejects %s', (_name, hit) => {
      expect(featureRefFromHit(hit)).toBeNull()
    })
  })
})
