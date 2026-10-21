import type {
  AllPaintProperties,
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
  LayerSpecification,
  StyleSpecification,
} from 'maplibre-gl'

import { GRATICULE_STEP, MAP_VIEW } from './config'
import { featureExists, graticule, land, route, sites, zones, type SiteCategory } from './data'
import { HIT_PRIORITY, LAYERS, layerOfStyleLayer, type FeatureRef, type LayerId } from './layers'
import type { MapPalette } from './theme-colors'

/**
 * Pure builders for the map's style. Nothing here touches the map library at runtime, so the
 * style can be built, composed, and tested without a GPU.
 *
 * The bundled style has no `glyphs` and no `sprite`, and so no text layers: labels need a font
 * server, which would be a network request. Feature names appear in the sidebar instead.
 */

export interface DesiredState {
  readonly palette: MapPalette
  readonly visibility: Readonly<Record<LayerId, boolean>>
  readonly selected: FeatureRef | null
}

const MARKER_RADIUS: Readonly<Record<SiteCategory, number>> = {
  harbour: 10,
  depot: 8,
  lookout: 6,
  station: 7,
}

function byCategory<T extends string | number>(
  values: Readonly<Record<SiteCategory, T>>,
  fallback: T,
): ExpressionSpecification {
  return [
    'match',
    ['get', 'category'],
    'harbour',
    values.harbour,
    'depot',
    values.depot,
    'lookout',
    values.lookout,
    'station',
    values.station,
    fallback,
  ]
}

/**
 * The filter for a highlight layer. "Nothing selected" must still be a filter: removing the
 * filter with `null` would highlight every feature.
 */
export function selectionFilter(selected: FeatureRef | null, layer: LayerId): FilterSpecification {
  return ['==', ['get', 'id'], selected?.layer === layer ? selected.id : '']
}

function visibilityOf(desired: DesiredState, layer: LayerId): 'visible' | 'none' {
  return desired.visibility[layer] ? 'visible' : 'none'
}

/** The sources for the three data layers. */
export function dataSources(): Record<string, GeoJSONSourceSpecification> {
  return {
    [LAYERS.sites.sourceId]: { type: 'geojson', data: sites },
    [LAYERS.route.sourceId]: { type: 'geojson', data: route },
    [LAYERS.zones.sourceId]: { type: 'geojson', data: zones },
  }
}

/**
 * The data layers, bottom to top: zones, then the route, then the sites. They are appended after
 * whatever basemap is underneath, so markers always draw above provider tiles.
 */
export function dataLayers(desired: DesiredState): LayerSpecification[] {
  const { palette } = desired
  return [
    {
      id: 'lab-zones-fill',
      type: 'fill',
      source: LAYERS.zones.sourceId,
      layout: { visibility: visibilityOf(desired, 'zones') },
      paint: { 'fill-color': palette.zone, 'fill-opacity': 0.07 },
    },
    {
      id: 'lab-zones-outline',
      type: 'line',
      source: LAYERS.zones.sourceId,
      layout: { visibility: visibilityOf(desired, 'zones') },
      paint: {
        'line-color': palette.zone,
        'line-opacity': 0.5,
        'line-width': 1.5,
        'line-dasharray': [2, 2],
      },
    },
    {
      id: 'lab-zones-selected',
      type: 'line',
      source: LAYERS.zones.sourceId,
      filter: selectionFilter(desired.selected, 'zones'),
      layout: { visibility: visibilityOf(desired, 'zones') },
      paint: { 'line-color': palette.selection, 'line-width': 3.5 },
    },
    {
      id: 'lab-route-selected',
      type: 'line',
      source: LAYERS.route.sourceId,
      filter: selectionFilter(desired.selected, 'route'),
      layout: {
        visibility: visibilityOf(desired, 'route'),
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: { 'line-color': palette.selection, 'line-opacity': 0.3, 'line-width': 10 },
    },
    {
      id: 'lab-route-line',
      type: 'line',
      source: LAYERS.route.sourceId,
      layout: {
        visibility: visibilityOf(desired, 'route'),
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: { 'line-color': palette.route, 'line-width': 3 },
    },
    {
      id: 'lab-sites-selected',
      type: 'circle',
      source: LAYERS.sites.sourceId,
      filter: selectionFilter(desired.selected, 'sites'),
      layout: { visibility: visibilityOf(desired, 'sites') },
      paint: {
        'circle-radius': byCategory(
          {
            harbour: MARKER_RADIUS.harbour + 6,
            depot: MARKER_RADIUS.depot + 6,
            lookout: MARKER_RADIUS.lookout + 6,
            station: MARKER_RADIUS.station + 6,
          },
          12,
        ),
        'circle-color': palette.selection,
        'circle-opacity': 0.25,
        'circle-stroke-color': palette.selection,
        'circle-stroke-width': 2,
      },
    },
    {
      id: 'lab-sites-circle',
      type: 'circle',
      source: LAYERS.sites.sourceId,
      layout: { visibility: visibilityOf(desired, 'sites') },
      paint: {
        'circle-radius': byCategory(MARKER_RADIUS, 6),
        'circle-color': byCategory(palette.categories, palette.selection),
        'circle-stroke-color': palette.siteHalo,
        'circle-stroke-width': 2,
      },
    },
  ]
}

/** The basemap that needs no network: a background, a graticule, and the island. */
export function bundledBaseStyle(palette: MapPalette): StyleSpecification {
  return {
    version: 8,
    name: 'Hieu UI Lab bundled basemap',
    sources: {
      'lab-graticule': {
        type: 'geojson',
        data: graticule(MAP_VIEW.maxBounds, GRATICULE_STEP),
      },
      'lab-land': { type: 'geojson', data: land },
    },
    layers: [
      { id: 'lab-ocean', type: 'background', paint: { 'background-color': palette.ocean } },
      {
        id: 'lab-graticule',
        type: 'line',
        source: 'lab-graticule',
        paint: { 'line-color': palette.graticule, 'line-width': 1 },
      },
      {
        id: 'lab-land-fill',
        type: 'fill',
        source: 'lab-land',
        paint: { 'fill-color': palette.land },
      },
      {
        id: 'lab-land-outline',
        type: 'line',
        source: 'lab-land',
        paint: { 'line-color': palette.landOutline, 'line-width': 1.5 },
      },
    ],
  }
}

/**
 * A basemap style with the data layers on top. Used for the bundled style and, after it has been
 * fetched and checked, for an online one. The state is baked in, so a style swap cannot lose the
 * visitor's visibility choices or selection.
 */
export function composeStyle(base: StyleSpecification, desired: DesiredState): StyleSpecification {
  return {
    ...base,
    sources: { ...base.sources, ...dataSources() },
    layers: [...base.layers, ...dataLayers(desired)],
  }
}

/** The loose shape of a downloaded style, which is checked before it is trusted. */
export function isUsableStyle(value: unknown): value is StyleSpecification {
  if (typeof value !== 'object' || value === null) return false
  const style = value as Record<string, unknown>
  return (
    style.version === 8 &&
    Array.isArray(style.layers) &&
    typeof style.sources === 'object' &&
    style.sources !== null
  )
}

type PaintName = keyof AllPaintProperties

export interface PaintUpdate {
  readonly layerId: string
  readonly property: PaintName
  readonly value: AllPaintProperties[PaintName]
}

function entriesOf(paint: object): [PaintName, AllPaintProperties[PaintName]][] {
  // These objects are the `paint` of valid layer specs built above, so every key is a paint
  // property. The library types the setter per property, which a loop over entries cannot satisfy.
  return Object.entries(paint) as [PaintName, AllPaintProperties[PaintName]][]
}

/**
 * Every palette-dependent paint property, so a theme change is a series of `setPaintProperty`
 * calls and never a new map. `includeBase` is false over an online style, whose own layers belong
 * to the provider.
 */
export function paintUpdates(palette: MapPalette, includeBase: boolean): PaintUpdate[] {
  const layers = [
    ...(includeBase ? bundledBaseStyle(palette).layers : []),
    ...dataLayers({
      palette,
      visibility: { sites: true, route: true, zones: true },
      selected: null,
    }),
  ]
  return layers.flatMap((layer) =>
    entriesOf(layer.paint ?? {}).map(([property, value]) => ({
      layerId: layer.id,
      property,
      value,
    })),
  )
}

/** A feature the map returned for a click, reduced to what selection needs. */
export interface Hit {
  readonly styleLayerId: string
  readonly properties: unknown
}

/**
 * The feature named by a map feature's properties, if it is one of ours. Properties come back
 * from the map as `any`, so only a string `id` that exists in the dataset is accepted.
 */
export function featureRefFromHit(hit: Hit): FeatureRef | null {
  const layer = layerOfStyleLayer(hit.styleLayerId)
  if (layer === null) return null
  if (typeof hit.properties !== 'object' || hit.properties === null) return null
  const id = (hit.properties as Record<string, unknown>).id
  if (typeof id !== 'string') return null
  const ref: FeatureRef = { layer, id }
  return featureExists(ref) ? ref : null
}

/** Choose one feature when a click lands on several: points before the route before zones. */
export function pickFeature(hits: readonly Hit[]): FeatureRef | null {
  const refs = hits.flatMap((hit) => {
    const ref = featureRefFromHit(hit)
    return ref ? [ref] : []
  })
  for (const layer of HIT_PRIORITY) {
    const match = refs.find((ref) => ref.layer === layer)
    if (match) return match
  }
  return null
}
