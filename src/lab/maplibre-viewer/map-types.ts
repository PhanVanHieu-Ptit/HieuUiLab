import type { FeatureRef, LayerId } from './layers'
import type { MapPalette } from './theme-colors'

/**
 * The contract between the React layer and the MapLibre layer. This file has no runtime import of
 * the map library, so React code and tests can use these types and `MapInitError` without it.
 */

export type MapInitErrorKind = 'webgl2-unavailable' | 'import-failed' | 'init-failed'

export class MapInitError extends Error {
  readonly kind: MapInitErrorKind

  constructor(kind: MapInitErrorKind, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'MapInitError'
    this.kind = kind
  }
}

/** What a layer is doing, as far as the map can tell. Hidden layers are tracked by the UI. */
export type LayerStatus = 'loading' | 'ready' | 'error'

export type LayerStatuses = Readonly<Record<LayerId, LayerStatus>>

export interface OnlineTarget {
  /** The full style URL, which may carry an API key. Never render it. */
  readonly styleUrl: string
  /** Plain text credit for the provider. */
  readonly attribution: string
}

export type BasemapTarget = 'bundled' | OnlineTarget

export interface MapControllerOptions {
  readonly palette: MapPalette
  readonly visibility: Readonly<Record<LayerId, boolean>>
  /** A click on the map: the topmost feature under it, or null for empty space. */
  readonly onFeatureClick: (ref: FeatureRef | null) => void
  readonly onLayerStatus: (statuses: LayerStatuses) => void
  /** The requested online basemap finished loading. */
  readonly onBasemapReady: () => void
  /** The online basemap was refused or failed, and the map went back to the bundled one. */
  readonly onBasemapFailed: (message: string) => void
  /** The graphics context was lost (`true`) or came back (`false`). */
  readonly onContextChange: (lost: boolean) => void
}

/** The imperative handle for one live map. All methods are safe to call after `dispose`. */
export interface MapController {
  setLayerVisibility: (layer: LayerId, visible: boolean) => void
  selectFeature: (ref: FeatureRef | null) => void
  focusFeature: (ref: FeatureRef) => void
  resetView: () => void
  setBasemap: (target: BasemapTarget) => void
  setPalette: (palette: MapPalette) => void
  dispose: () => void
}
