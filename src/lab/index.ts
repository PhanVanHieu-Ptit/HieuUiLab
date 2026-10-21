import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** Interactive demo per experiment slug, split into its own chunk. */
export const labDemos: Readonly<Record<string, LazyExoticComponent<ComponentType>>> = {
  'map-projections': lazy(() =>
    import('./map-projections/map-projections-demo').then((module) => ({
      default: module.MapProjectionsDemo,
    })),
  ),
  'maplibre-viewer': lazy(() =>
    import('./maplibre-viewer/maplibre-viewer-demo').then((module) => ({
      default: module.MaplibreViewerDemo,
    })),
  ),
  'webgl-scene': lazy(() =>
    import('./webgl-scene/webgl-scene-demo').then((module) => ({
      default: module.WebglSceneDemo,
    })),
  ),
}
