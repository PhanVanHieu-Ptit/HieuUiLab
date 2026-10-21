import { describe, expect, it } from 'vitest'

import { MAP_VIEW } from './config'
import {
  HUB_ID,
  HUB_POSITION,
  ROUTE_ID,
  ROUTE_STOP_IDS,
  SITE_CATEGORIES,
  distanceKm,
  featureExists,
  featuresOfLayer,
  getFeatureDetails,
  getFocusTarget,
  graticule,
  land,
  pointInRing,
  route,
  routeLengthKm,
  sites,
  toLngLat,
  zones,
  type LngLat,
} from './data'
import { LAYER_IDS } from './layers'

function unique(values: readonly string[]) {
  return new Set(values).size === values.length
}

describe('the sample dataset', () => {
  it('gives every feature a unique id within its layer', () => {
    expect(unique(sites.features.map((feature) => feature.properties.id))).toBe(true)
    expect(unique(zones.features.map((feature) => feature.properties.id))).toBe(true)
    expect(unique(route.features.map((feature) => feature.properties.id))).toBe(true)
  })

  it('uses only known categories and statuses', () => {
    for (const { properties } of sites.features) {
      expect(SITE_CATEGORIES).toContain(properties.category)
      expect(['open', 'limited', 'closed']).toContain(properties.status)
      expect(properties.name).not.toBe('')
      expect(properties.note).not.toBe('')
    }
  })

  it('keeps every coordinate valid and inside the map bounds', () => {
    const [west, south, east, north] = MAP_VIEW.maxBounds
    const positions: LngLat[] = [
      ...sites.features.map((feature) => toLngLat(feature.geometry.coordinates)),
      ...route.features.flatMap((feature) => feature.geometry.coordinates.map(toLngLat)),
      ...zones.features.flatMap((feature) =>
        (feature.geometry.coordinates[0] ?? []).map(toLngLat),
      ),
      ...land.features.flatMap((feature) => (feature.geometry.coordinates[0] ?? []).map(toLngLat)),
    ]
    expect(positions.length).toBeGreaterThan(0)
    for (const [lng, lat] of positions) {
      expect(lng).toBeGreaterThanOrEqual(-180)
      expect(lng).toBeLessThanOrEqual(180)
      expect(lat).toBeGreaterThanOrEqual(-90)
      expect(lat).toBeLessThanOrEqual(90)
      expect(lng).toBeGreaterThan(west)
      expect(lng).toBeLessThan(east)
      expect(lat).toBeGreaterThan(south)
      expect(lat).toBeLessThan(north)
    }
  })

  it('closes every polygon ring', () => {
    for (const collection of [zones, land]) {
      for (const feature of collection.features) {
        const ring = feature.geometry.coordinates[0] ?? []
        expect(ring.length).toBeGreaterThanOrEqual(4)
        expect(ring[0]).toEqual(ring.at(-1))
      }
    }
  })

  it('puts the hub on the initial map centre, so a click there selects it', () => {
    const hub = sites.features.find((feature) => feature.properties.id === HUB_ID)
    expect(hub).toBeDefined()
    expect(toLngLat(hub?.geometry.coordinates ?? [])).toEqual(HUB_POSITION)
    expect(MAP_VIEW.center).toEqual(HUB_POSITION)
  })

  it('keeps every site on the island', () => {
    const ring = (land.features[0]?.geometry.coordinates[0] ?? []).map(toLngLat)
    for (const feature of sites.features) {
      expect(pointInRing(toLngLat(feature.geometry.coordinates), ring)).toBe(true)
    }
  })

  it('draws the route through sites only, starting and ending at the hub', () => {
    const ids = new Set(sites.features.map((feature) => feature.properties.id))
    for (const stop of ROUTE_STOP_IDS) expect(ids.has(stop)).toBe(true)
    expect(ROUTE_STOP_IDS[0]).toBe(HUB_ID)
    expect(ROUTE_STOP_IDS.at(-1)).toBe(HUB_ID)

    const coordinates = route.features[0]?.geometry.coordinates.map(toLngLat) ?? []
    expect(coordinates[0]).toEqual(HUB_POSITION)
    expect(coordinates.at(-1)).toEqual(HUB_POSITION)
    // Every stop appears on the line at its site's exact position.
    for (const stop of ROUTE_STOP_IDS) {
      const site = sites.features.find((feature) => feature.properties.id === stop)
      expect(coordinates).toContainEqual(toLngLat(site?.geometry.coordinates ?? []))
    }
  })

  it('carries no links, so the invented data points nowhere real', () => {
    const text = JSON.stringify([sites, zones, route])
    expect(text).not.toMatch(/https?:\/\//)
  })
})

describe('geometry helpers', () => {
  it('measures a degree of longitude on the equator', () => {
    // 2πR / 360 for R = 6371.0088 km.
    expect(distanceKm([0, 0], [1, 0])).toBeCloseTo(111.195, 2)
    expect(distanceKm([0, 0], [0, 0])).toBe(0)
  })

  it('sums the legs of a polyline', () => {
    expect(
      routeLengthKm([
        [0, 0],
        [1, 0],
        [1, 1],
      ]),
    ).toBeCloseTo(distanceKm([0, 0], [1, 0]) + distanceKm([1, 0], [1, 1]), 6)
    expect(routeLengthKm([])).toBe(0)
    expect(routeLengthKm([[2, 2]])).toBe(0)
  })

  it('draws a graticule at the step, inside the bounds', () => {
    const grid = graticule([0, 0, 1, 1], 0.5)
    expect(grid.features).toHaveLength(6)
    expect(unique(grid.features.map((feature) => feature.properties.id))).toBe(true)
  })

  it('rejects a position without a finite longitude and latitude', () => {
    expect(() => toLngLat([1])).toThrow()
    expect(() => toLngLat([Number.NaN, 2])).toThrow()
    expect(toLngLat([1, 2, 99])).toEqual([1, 2])
  })

  it('tells inside from outside a ring', () => {
    const square: LngLat[] = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ]
    expect(pointInRing([1, 1], square)).toBe(true)
    expect(pointInRing([3, 1], square)).toBe(false)
  })
})

describe('looking features up', () => {
  it('reports whether a feature exists', () => {
    expect(featureExists({ layer: 'sites', id: HUB_ID })).toBe(true)
    expect(featureExists({ layer: 'route', id: ROUTE_ID })).toBe(true)
    expect(featureExists({ layer: 'zones', id: 'harbour-district' })).toBe(true)
    expect(featureExists({ layer: 'sites', id: 'nope' })).toBe(false)
    // An id from another layer is not a match.
    expect(featureExists({ layer: 'zones', id: HUB_ID })).toBe(false)
  })

  it('builds the details the info panel shows', () => {
    const site = getFeatureDetails({ layer: 'sites', id: HUB_ID })
    expect(site).toMatchObject({ layer: 'sites', position: HUB_POSITION })

    const line = getFeatureDetails({ layer: 'route', id: ROUTE_ID })
    expect(line?.layer).toBe('route')
    if (line?.layer === 'route') {
      expect(line.lengthKm).toBeGreaterThan(10)
      expect(line.stops).toHaveLength(ROUTE_STOP_IDS.length)
    }

    const zone = getFeatureDetails({ layer: 'zones', id: 'harbour-district' })
    expect(zone?.layer).toBe('zones')
    if (zone?.layer === 'zones') {
      expect(zone.sites.map((entry) => entry.id)).toContain(HUB_ID)
    }

    expect(getFeatureDetails({ layer: 'sites', id: 'nope' })).toBeNull()
  })

  it('chooses where the camera goes for each kind of feature', () => {
    expect(getFocusTarget({ layer: 'sites', id: HUB_ID })).toEqual({
      kind: 'point',
      position: HUB_POSITION,
    })
    expect(getFocusTarget({ layer: 'route', id: ROUTE_ID })?.kind).toBe('bounds')
    expect(getFocusTarget({ layer: 'zones', id: 'harbour-district' })?.kind).toBe('bounds')
    expect(getFocusTarget({ layer: 'zones', id: 'nope' })).toBeNull()
  })

  it('lists the features of every layer for the sidebar', () => {
    for (const layer of LAYER_IDS) {
      const entries = featuresOfLayer(layer)
      expect(entries.length).toBeGreaterThan(0)
      for (const entry of entries) expect(featureExists({ layer, id: entry.id })).toBe(true)
    }
  })
})
