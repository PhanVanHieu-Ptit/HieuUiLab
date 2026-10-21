/** The toggleable data layers. */
export const LAYER_IDS = ['sites', 'route', 'zones'] as const

export type LayerId = (typeof LAYER_IDS)[number]

/** A feature on the map, named by its layer and the `id` property in `data.ts`. */
export interface FeatureRef {
  readonly layer: LayerId
  readonly id: string
}

export interface LayerInfo {
  readonly id: LayerId
  readonly label: string
  readonly description: string
  /** The GeoJSON source that holds the layer's features. */
  readonly sourceId: string
  /** Style layers drawn for this layer, bottom to top. Hiding the layer hides all of them. */
  readonly styleLayerIds: readonly string[]
  /** The style layer a click is tested against. */
  readonly hitLayerId: string
}

// Every id starts with `lab-` so these layers can sit on top of an online provider's style without
// colliding with that style's own source and layer names.
export const LAYERS: Readonly<Record<LayerId, LayerInfo>> = {
  sites: {
    id: 'sites',
    label: 'Sites',
    description: 'Point markers, coloured and sized by category.',
    sourceId: 'lab-sites',
    styleLayerIds: ['lab-sites-selected', 'lab-sites-circle'],
    hitLayerId: 'lab-sites-circle',
  },
  route: {
    id: 'route',
    label: 'Service route',
    description: 'A polyline that visits the sites in order.',
    sourceId: 'lab-route',
    styleLayerIds: ['lab-route-selected', 'lab-route-line'],
    hitLayerId: 'lab-route-line',
  },
  zones: {
    id: 'zones',
    label: 'Service zones',
    description: 'Polygons that group the sites into areas.',
    sourceId: 'lab-zones',
    styleLayerIds: ['lab-zones-fill', 'lab-zones-outline', 'lab-zones-selected'],
    hitLayerId: 'lab-zones-fill',
  },
}

export function isLayerId(value: unknown): value is LayerId {
  return LAYER_IDS.some((id) => id === value)
}

/** The layer a style layer belongs to, or null for a layer that is not one of ours. */
export function layerOfStyleLayer(styleLayerId: string): LayerId | null {
  return LAYER_IDS.find((id) => LAYERS[id].styleLayerIds.includes(styleLayerId)) ?? null
}

/** When a click lands on several layers at once, the smaller target wins: points, then the line. */
export const HIT_PRIORITY: readonly LayerId[] = ['sites', 'route', 'zones']

export function sameFeature(a: FeatureRef | null, b: FeatureRef | null): boolean {
  if (a === null || b === null) return a === b
  return a.layer === b.layer && a.id === b.id
}
