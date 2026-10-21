import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson'

import type { FeatureRef, LayerId } from './layers'

/**
 * Sample data for the map viewer. Everything here is invented: the island, the sites, the route,
 * and the zones do not describe any real place, organisation, or survey. The island sits in open
 * ocean in the Atlantic so that it cannot be mistaken for a real coastline, including when an
 * online basemap is switched on.
 *
 * Coordinates are [longitude, latitude] in degrees (WGS 84), the order GeoJSON uses.
 */

export type LngLat = readonly [number, number]
export type Bounds = readonly [west: number, south: number, east: number, north: number]

export type SiteCategory = 'harbour' | 'depot' | 'lookout' | 'station'
export type SiteStatus = 'open' | 'limited' | 'closed'

export interface SiteProperties {
  id: string
  name: string
  category: SiteCategory
  status: SiteStatus
  note: string
}

export interface RouteProperties {
  id: string
  name: string
  note: string
}

export interface ZoneProperties {
  id: string
  name: string
  note: string
}

export const SITE_CATEGORIES: readonly SiteCategory[] = ['harbour', 'depot', 'lookout', 'station']

export const SITE_CATEGORY_LABELS: Readonly<Record<SiteCategory, string>> = {
  harbour: 'Harbour',
  depot: 'Depot',
  lookout: 'Lookout',
  station: 'Station',
}

export const SITE_STATUS_LABELS: Readonly<Record<SiteStatus, string>> = {
  open: 'Open',
  limited: 'Limited',
  closed: 'Closed',
}

/** The hub: the map opens centred here, so it is also the first thing a canvas click selects. */
export const HUB_ID = 'lumen-harbour'
export const HUB_POSITION: LngLat = [-35, 5]

function site(
  id: string,
  name: string,
  category: SiteCategory,
  status: SiteStatus,
  position: LngLat,
  note: string,
): Feature<Point, SiteProperties> {
  return {
    type: 'Feature',
    properties: { id, name, category, status, note },
    geometry: { type: 'Point', coordinates: [...position] },
  }
}

export const sites: FeatureCollection<Point, SiteProperties> = {
  type: 'FeatureCollection',
  features: [
    site(
      HUB_ID,
      'Lumen Harbour',
      'harbour',
      'open',
      HUB_POSITION,
      'The main harbour. Every loop of the service route starts and ends here.',
    ),
    site(
      'north-light',
      'North Light',
      'lookout',
      'open',
      [-35.02, 5.13],
      'A lookout on the north shore with a clear view of the approach.',
    ),
    site(
      'ridge-lookout',
      'Ridge Lookout',
      'lookout',
      'limited',
      [-34.92, 5.12],
      'A lookout on the ridge. Access is limited to daylight hours.',
    ),
    site(
      'east-quay',
      'East Quay',
      'harbour',
      'limited',
      [-34.8, 5.05],
      'A small quay on the east coast with one berth.',
    ),
    site(
      'east-depot',
      'East Depot',
      'depot',
      'open',
      [-34.84, 4.95],
      'A storage depot serving the eastern reach.',
    ),
    site(
      'south-station',
      'South Station',
      'station',
      'open',
      [-34.95, 4.88],
      'A relay station on the south shore.',
    ),
    site(
      'west-depot',
      'West Depot',
      'depot',
      'closed',
      [-35.17, 4.95],
      'A depot closed for the sample season.',
    ),
    site(
      'west-lookout',
      'West Lookout',
      'lookout',
      'open',
      [-35.2, 5.06],
      'A lookout above the western cove.',
    ),
  ],
}

/**
 * The route, in order. A string is a stop and names a site by id, so the line cannot drift from the
 * markers; a pair is a waypoint that bends the line around the island instead of across it.
 */
const ROUTE_PATH: readonly (string | LngLat)[] = [
  HUB_ID,
  [-35.1, 5.03],
  'west-lookout',
  [-35.19, 5],
  'west-depot',
  [-35.06, 4.91],
  'south-station',
  [-34.89, 4.91],
  'east-depot',
  [-34.82, 5],
  'east-quay',
  [-34.86, 5.09],
  'ridge-lookout',
  [-34.97, 5.12],
  'north-light',
  [-35.01, 5.06],
  HUB_ID,
]

export const ROUTE_STOP_IDS: readonly string[] = ROUTE_PATH.filter(
  (step): step is string => typeof step === 'string',
)

export const ROUTE_ID = 'coastal-loop'

function sitePosition(id: string): LngLat {
  const feature = sites.features.find((candidate) => candidate.properties.id === id)
  if (!feature) throw new Error(`The route names an unknown site: ${id}`)
  return toLngLat(feature.geometry.coordinates)
}

function routeCoordinates(): LngLat[] {
  return ROUTE_PATH.map((step) => (typeof step === 'string' ? sitePosition(step) : step))
}

export const route: FeatureCollection<LineString, RouteProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: ROUTE_ID,
        name: 'Coastal service loop',
        note: 'A sample loop that leaves the harbour, circles the island, and returns.',
      },
      geometry: { type: 'LineString', coordinates: routeCoordinates().map((point) => [...point]) },
    },
  ],
}

function rectangle(points: readonly LngLat[]): Polygon {
  const first = points[0]
  if (!first) throw new Error('A polygon needs at least one point')
  return { type: 'Polygon', coordinates: [[...points, first].map((point) => [...point])] }
}

export const zones: FeatureCollection<Polygon, ZoneProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'harbour-district',
        name: 'Harbour district',
        note: 'The area around the main harbour.',
      },
      geometry: rectangle([
        [-35.08, 4.95],
        [-34.92, 4.95],
        [-34.92, 5.06],
        [-35.08, 5.06],
      ]),
    },
    {
      type: 'Feature',
      properties: {
        id: 'western-reach',
        name: 'Western reach',
        note: 'The western coast, from the cove to the closed depot.',
      },
      geometry: rectangle([
        [-35.23, 4.94],
        [-35.1, 4.94],
        [-35.1, 5.09],
        [-35.22, 5.09],
      ]),
    },
    {
      type: 'Feature',
      properties: {
        id: 'eastern-reach',
        name: 'Eastern reach',
        note: 'The eastern coast, from the depot to the quay.',
      },
      geometry: rectangle([
        [-34.88, 4.9],
        [-34.76, 4.94],
        [-34.76, 5.08],
        [-34.88, 5.1],
      ]),
    },
  ],
}

/** The island outline. Part of the bundled basemap, not a toggleable layer. */
export const land: FeatureCollection<Polygon, { id: string }> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'lumen-island' },
      geometry: rectangle([
        [-35.28, 5.02],
        [-35.22, 5.1],
        [-35.12, 5.15],
        [-35, 5.17],
        [-34.9, 5.14],
        [-34.8, 5.1],
        [-34.72, 5.02],
        [-34.74, 4.93],
        [-34.82, 4.87],
        [-34.93, 4.84],
        [-35.05, 4.83],
        [-35.15, 4.87],
        [-35.24, 4.92],
      ]),
    },
  ],
}

/** Checks a GeoJSON position and returns it as a typed pair. */
export function toLngLat(position: readonly number[]): LngLat {
  const [lng, lat] = position
  if (lng === undefined || lat === undefined || !Number.isFinite(lng) || !Number.isFinite(lat)) {
    throw new Error('A position needs a finite longitude and latitude')
  }
  return [lng, lat]
}

const EARTH_RADIUS_KM = 6371.0088

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance between two points, by the haversine formula. */
export function distanceKm(from: LngLat, to: LngLat): number {
  const dLat = toRadians(to[1] - from[1])
  const dLng = toRadians(to[0] - from[0])
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from[1])) * Math.cos(toRadians(to[1])) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** The length of a polyline, in kilometres. */
export function routeLengthKm(coordinates: readonly LngLat[]): number {
  let total = 0
  for (let index = 1; index < coordinates.length; index += 1) {
    const from = coordinates[index - 1]
    const to = coordinates[index]
    if (from && to) total += distanceKm(from, to)
  }
  return total
}

/** Meridians and parallels every `step` degrees inside `bounds`. */
export function graticule(bounds: Bounds, step: number): FeatureCollection<LineString, { id: string }> {
  const [west, south, east, north] = bounds
  const features: Feature<LineString, { id: string }>[] = []
  const first = (from: number) => Math.ceil(from / step) * step
  for (let lng = first(west); lng <= east + 1e-9; lng += step) {
    features.push({
      type: 'Feature',
      properties: { id: `meridian-${lng.toFixed(3)}` },
      geometry: {
        type: 'LineString',
        coordinates: [
          [lng, south],
          [lng, north],
        ],
      },
    })
  }
  for (let lat = first(south); lat <= north + 1e-9; lat += step) {
    features.push({
      type: 'Feature',
      properties: { id: `parallel-${lat.toFixed(3)}` },
      geometry: {
        type: 'LineString',
        coordinates: [
          [west, lat],
          [east, lat],
        ],
      },
    })
  }
  return { type: 'FeatureCollection', features }
}

export function getSite(id: string): Feature<Point, SiteProperties> | undefined {
  return sites.features.find((feature) => feature.properties.id === id)
}

export function getZone(id: string): Feature<Polygon, ZoneProperties> | undefined {
  return zones.features.find((feature) => feature.properties.id === id)
}

export function getRoute(id: string): Feature<LineString, RouteProperties> | undefined {
  return route.features.find((feature) => feature.properties.id === id)
}

export function featureExists(ref: FeatureRef): boolean {
  switch (ref.layer) {
    case 'sites':
      return getSite(ref.id) !== undefined
    case 'route':
      return getRoute(ref.id) !== undefined
    case 'zones':
      return getZone(ref.id) !== undefined
  }
}

/** Everything the info panel shows. Looked up here, never read back from the map. */
export type FeatureDetails =
  | { layer: 'sites'; site: SiteProperties; position: LngLat }
  | { layer: 'route'; route: RouteProperties; lengthKm: number; stops: readonly SiteProperties[] }
  | { layer: 'zones'; zone: ZoneProperties; sites: readonly SiteProperties[] }

export function getFeatureDetails(ref: FeatureRef): FeatureDetails | null {
  switch (ref.layer) {
    case 'sites': {
      const feature = getSite(ref.id)
      if (!feature) return null
      return {
        layer: 'sites',
        site: feature.properties,
        position: toLngLat(feature.geometry.coordinates),
      }
    }
    case 'route': {
      const feature = getRoute(ref.id)
      if (!feature) return null
      const stops = ROUTE_STOP_IDS.flatMap((id) => {
        const stop = getSite(id)
        return stop ? [stop.properties] : []
      })
      return {
        layer: 'route',
        route: feature.properties,
        lengthKm: routeLengthKm(feature.geometry.coordinates.map(toLngLat)),
        stops,
      }
    }
    case 'zones': {
      const feature = getZone(ref.id)
      if (!feature) return null
      const ring = (feature.geometry.coordinates[0] ?? []).map(toLngLat)
      return {
        layer: 'zones',
        zone: feature.properties,
        sites: sites.features
          .filter((candidate) => pointInRing(toLngLat(candidate.geometry.coordinates), ring))
          .map((candidate) => candidate.properties),
      }
    }
  }
}

/** Ray casting. Treats longitude and latitude as plane coordinates, which is fine at this scale. */
export function pointInRing(point: LngLat, ring: readonly LngLat[]): boolean {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const a = ring[index]
    const b = ring[previous]
    if (!a || !b) continue
    const crosses =
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    if (crosses) inside = !inside
  }
  return inside
}

/** Where to take the camera for a feature: a point to centre on, or bounds to fit. */
export type FocusTarget =
  | { kind: 'point'; position: LngLat }
  | { kind: 'bounds'; bounds: Bounds }

function boundsOf(positions: readonly LngLat[]): Bounds {
  const lngs = positions.map((position) => position[0])
  const lats = positions.map((position) => position[1])
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
}

export function getFocusTarget(ref: FeatureRef): FocusTarget | null {
  switch (ref.layer) {
    case 'sites': {
      const feature = getSite(ref.id)
      return feature
        ? { kind: 'point', position: toLngLat(feature.geometry.coordinates) }
        : null
    }
    case 'route': {
      const feature = getRoute(ref.id)
      return feature
        ? { kind: 'bounds', bounds: boundsOf(feature.geometry.coordinates.map(toLngLat)) }
        : null
    }
    case 'zones': {
      const feature = getZone(ref.id)
      return feature
        ? {
            kind: 'bounds',
            bounds: boundsOf((feature.geometry.coordinates[0] ?? []).map(toLngLat)),
          }
        : null
    }
  }
}

/** Every feature a layer holds, for the lists in the sidebar. */
export function featuresOfLayer(layer: LayerId): readonly { id: string; name: string }[] {
  switch (layer) {
    case 'sites':
      return sites.features.map((feature) => feature.properties)
    case 'route':
      return route.features.map((feature) => feature.properties)
    case 'zones':
      return zones.features.map((feature) => feature.properties)
  }
}
