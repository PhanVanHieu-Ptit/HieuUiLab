import type {
  AttributionControl,
  LngLatBoundsLike,
  MapLibreMap,
  MapMouseEvent,
  StyleSpecification,
  Subscription,
} from 'maplibre-gl'

import { MAP_VIEW, escapeHtml } from './config'
import { getFocusTarget } from './data'
import { LAYERS, LAYER_IDS, type FeatureRef, type LayerId } from './layers'
import {
  MapInitError,
  type BasemapTarget,
  type LayerStatus,
  type LayerStatuses,
  type MapController,
  type MapControllerOptions,
  type OnlineTarget,
} from './map-types'
import {
  bundledBaseStyle,
  composeStyle,
  isUsableStyle,
  paintUpdates,
  pickFeature,
  selectionFilter,
  type DesiredState,
} from './map-style'
import type { MapPalette } from './theme-colors'

/**
 * The only module that imports `maplibre-gl` at runtime. It owns one map: it builds it, keeps it
 * in step with the state the React layer holds, and tears it down.
 *
 * Rules this file keeps:
 * - One map per call, and none at all if the caller aborts first, so React StrictMode's
 *   mount-unmount-mount never builds two.
 * - Every `map.on` subscription is recorded and released in `dispose`, which is safe to call twice.
 * - Clicks use one delegated listener that queries the map, so a style swap never leaves a
 *   per-layer listener behind.
 * - An online style is downloaded and checked before it replaces anything, so a bad one cannot
 *   blank the map, and repeated refusals from a provider send the map back to the bundled style.
 */

const importMapLibre = () => import('maplibre-gl')
type MapLibreModule = Awaited<ReturnType<typeof importMapLibre>>

let loading: Promise<MapLibreModule> | undefined

/**
 * The library, its stylesheet, and its worker, fetched once. A failed fetch is forgotten so Retry
 * can try again.
 *
 * MapLibre looks for its worker next to its own file, but a bundler moves that file and emits no
 * worker beside it, so the request lands on the app's HTML fallback and the map never starts.
 * `?worker&url` makes Vite emit the worker as an asset of its own and return that asset's URL,
 * which is handed to the library before any map exists.
 */
function loadMapLibre(): Promise<MapLibreModule> {
  loading ??= Promise.all([
    importMapLibre(),
    import('maplibre-gl/dist/maplibre-gl.css'),
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
  ]).then(
    ([module, , worker]) => {
      module.setWorkerUrl(worker.default)
      return module
    },
    (cause: unknown) => {
      loading = undefined
      throw new MapInitError('import-failed', 'The map library could not be downloaded.', { cause })
    },
  )
  return loading
}

function abortError(): DOMException {
  return new DOMException('The map was torn down before it finished loading.', 'AbortError')
}

const CLICK_PADDING = 8
const STYLE_FETCH_TIMEOUT_MS = 10_000
const STYLE_LOAD_TIMEOUT_MS = 15_000
/** HTTP statuses that mean the provider is refusing us rather than failing. */
const REFUSAL_STATUSES: ReadonlySet<number> = new Set([401, 403, 429])
const REFUSAL_LIMIT = 3

const MAPLIBRE_CREDIT =
  '<a href="https://maplibre.org/" target="_blank" rel="noreferrer">MapLibre</a>'
const BUNDLED_CREDIT = 'Synthetic sample data'

function boundsOf(bounds: readonly [number, number, number, number]): LngLatBoundsLike {
  const [west, south, east, north] = bounds
  return [
    [west, south],
    [east, north],
  ]
}

function statusOf(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null
  return typeof error.status === 'number' ? error.status : null
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return 'the provider'
  }
}

/** Download an online style and check it. Messages name the host and never the URL or its key. */
async function fetchOnlineStyle(
  styleUrl: string,
  signal: AbortSignal,
): Promise<StyleSpecification> {
  const host = hostOf(styleUrl)
  const timeout = new AbortController()
  const timer = setTimeout(() => {
    timeout.abort()
  }, STYLE_FETCH_TIMEOUT_MS)
  const onOuterAbort = () => {
    timeout.abort()
  }
  signal.addEventListener('abort', onOuterAbort, { once: true })
  try {
    const response = await fetch(styleUrl, { signal: timeout.signal, credentials: 'omit' })
    if (!response.ok) {
      throw new Error(`The basemap host (${host}) answered HTTP ${String(response.status)}.`)
    }
    const style: unknown = await response.json()
    if (!isUsableStyle(style)) {
      throw new Error(`The basemap host (${host}) returned something that is not a map style.`)
    }
    return style
  } catch (error) {
    if (signal.aborted) throw error
    if (error instanceof Error && error.message.startsWith('The basemap host')) throw error
    if (timeout.signal.aborted) {
      throw new Error(`The basemap host (${host}) did not answer in time.`)
    }
    throw new Error(`The basemap host (${host}) could not be reached.`)
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', onOuterAbort)
  }
}

function sameStatuses(a: LayerStatuses, b: LayerStatuses): boolean {
  return LAYER_IDS.every((id) => a[id] === b[id])
}

/** Resolve once the first style has loaded and drawn, or reject if the map cannot start. */
function whenLoaded(map: MapLibreMap, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const subscriptions: Subscription[] = []
    function settle(finish: () => void) {
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe()
      })
      signal.removeEventListener('abort', onAbort)
      finish()
    }
    function onAbort() {
      settle(() => {
        reject(abortError())
      })
    }
    subscriptions.push(
      map.on('load', () => {
        settle(resolve)
      }),
      map.on('error', (event) => {
        settle(() => {
          reject(new MapInitError('init-failed', event.error.message))
        })
      }),
    )
    signal.addEventListener('abort', onAbort, { once: true })
    if (signal.aborted) onAbort()
  })
}

/**
 * Build the map in `container` and resolve with its controller once it has drawn. Rejects with a
 * `MapInitError`, or with an `AbortError` if `signal` aborts first, in which case no map is left.
 */
export async function createMapController(
  container: HTMLElement,
  options: MapControllerOptions,
  signal: AbortSignal,
): Promise<MapController> {
  const maplibre = await loadMapLibre()
  // The check that keeps StrictMode honest: an aborted mount stops here, before any map exists.
  if (signal.aborted) throw abortError()

  const desired: DesiredState = {
    palette: options.palette,
    visibility: { ...options.visibility },
    selected: null,
  }

  let map: MapLibreMap
  try {
    map = new maplibre.Map({
      container,
      style: composeStyle(bundledBaseStyle(desired.palette), desired),
      center: [...MAP_VIEW.center],
      zoom: MAP_VIEW.zoom,
      minZoom: MAP_VIEW.minZoom,
      maxZoom: MAP_VIEW.maxZoom,
      maxBounds: boundsOf(MAP_VIEW.maxBounds),
      attributionControl: false,
      // The map sits inside a scrolling page: wheel and one-finger drags scroll the page unless
      // the visitor holds Ctrl/Cmd or uses two fingers.
      cooperativeGestures: true,
      renderWorldCopies: false,
      dragRotate: false,
      touchPitch: false,
      maxPitch: 0,
    })
  } catch (cause) {
    if (cause instanceof maplibre.GPUInitializationError) {
      throw new MapInitError(
        'webgl2-unavailable',
        'This browser could not create a WebGL2 context.',
        {
          cause,
        },
      )
    }
    throw new MapInitError('init-failed', 'The map could not be created.', { cause })
  }

  const controller = buildController(maplibre, map, options, desired)
  try {
    await whenLoaded(map, signal)
  } catch (error) {
    controller.dispose()
    throw error
  }
  return controller
}

function buildController(
  maplibre: MapLibreModule,
  map: MapLibreMap,
  options: MapControllerOptions,
  desired: {
    palette: MapPalette
    visibility: Record<LayerId, boolean>
    selected: FeatureRef | null
  },
): MapController {
  const subscriptions: Subscription[] = []
  let disposed = false
  let basemap: { kind: 'bundled' } | { kind: 'online'; styleUrl: string } = { kind: 'bundled' }

  // Rotation is off for mouse, touch, and keyboard; pinch and +/- still zoom.
  map.touchZoomRotate.disableRotation()
  map.keyboard.disableRotation()
  map
    .getCanvas()
    .setAttribute(
      'aria-label',
      'Interactive map. Drag to pan, use the plus and minus keys to zoom. The same features are listed beside the map.',
    )

  map.addControl(
    new maplibre.NavigationControl({ showCompass: false, visualizePitch: false }),
    'top-right',
  )
  map.addControl(new maplibre.ScaleControl({ unit: 'metric' }), 'bottom-left')
  let attribution: AttributionControl = new maplibre.AttributionControl({
    customAttribution: [BUNDLED_CREDIT, MAPLIBRE_CREDIT],
  })
  map.addControl(attribution, 'bottom-right')

  function setAttribution(credits: string[]) {
    map.removeControl(attribution)
    attribution = new maplibre.AttributionControl({ customAttribution: credits })
    map.addControl(attribution, 'bottom-right')
  }

  // --- Layer status -------------------------------------------------------------------------

  const statuses: Record<LayerId, LayerStatus> = {
    sites: 'loading',
    route: 'loading',
    zones: 'loading',
  }
  let lastReported: LayerStatuses | null = null

  function reportStatuses() {
    if (lastReported && sameStatuses(lastReported, statuses)) return
    lastReported = { ...statuses }
    options.onLayerStatus(lastReported)
  }

  function setAllStatuses(status: LayerStatus) {
    LAYER_IDS.forEach((id) => {
      statuses[id] = status
    })
    reportStatuses()
  }

  function layerOfSource(sourceId: unknown): LayerId | undefined {
    return LAYER_IDS.find((id) => LAYERS[id].sourceId === sourceId)
  }

  // --- Applying the state the React layer holds ---------------------------------------------

  function applyVisibility(layer: LayerId) {
    for (const id of LAYERS[layer].styleLayerIds) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', desired.visibility[layer] ? 'visible' : 'none')
      }
    }
  }

  function applySelection() {
    for (const layer of LAYER_IDS) {
      const highlight = `lab-${layer}-selected`
      if (map.getLayer(highlight))
        map.setFilter(highlight, selectionFilter(desired.selected, layer))
    }
  }

  function applyPalette() {
    for (const { layerId, property, value } of paintUpdates(
      desired.palette,
      basemap.kind === 'bundled',
    )) {
      if (map.getLayer(layerId)) map.setPaintProperty(layerId, property, value)
    }
  }

  /** Re-apply everything. Idempotent, so it is safe after every style load. */
  function applyAll() {
    LAYER_IDS.forEach(applyVisibility)
    applySelection()
    applyPalette()
  }

  // --- Basemap swaps ------------------------------------------------------------------------

  let swap: AbortController | null = null
  let swapTimer: ReturnType<typeof setTimeout> | undefined
  let awaitingOnlineIdle = false
  let refusals = 0

  function cancelSwap() {
    swap?.abort()
    swap = null
    clearTimeout(swapTimer)
    swapTimer = undefined
    awaitingOnlineIdle = false
  }

  function showBundled() {
    basemap = { kind: 'bundled' }
    map.setMaxBounds(boundsOf(MAP_VIEW.maxBounds))
    map.setMinZoom(MAP_VIEW.minZoom)
    setAllStatuses('loading')
    map.setStyle(composeStyle(bundledBaseStyle(desired.palette), desired), { diff: false })
    setAttribution([BUNDLED_CREDIT, MAPLIBRE_CREDIT])
    map.jumpTo({ center: [...MAP_VIEW.center], zoom: MAP_VIEW.zoom })
  }

  function failOnline(message: string) {
    if (disposed) return
    cancelSwap()
    if (basemap.kind === 'online') showBundled()
    options.onBasemapFailed(message)
  }

  async function showOnline(target: OnlineTarget) {
    cancelSwap()
    const current = new AbortController()
    swap = current
    let style: StyleSpecification
    try {
      style = await fetchOnlineStyle(target.styleUrl, current.signal)
    } catch (error) {
      if (current.signal.aborted || disposed) return
      failOnline(error instanceof Error ? error.message : 'The online basemap could not be loaded.')
      return
    }
    if (current.signal.aborted || disposed) return

    basemap = { kind: 'online', styleUrl: target.styleUrl }
    refusals = 0
    awaitingOnlineIdle = true
    // The island sits in open ocean, so the online map is free to zoom out and pan away.
    map.setMaxBounds(null)
    map.setMinZoom(MAP_VIEW.onlineMinZoom)
    setAllStatuses('loading')
    map.setStyle(composeStyle(style, desired), { diff: false })
    setAttribution([escapeHtml(target.attribution), MAPLIBRE_CREDIT])
    swapTimer = setTimeout(() => {
      failOnline('The online basemap did not finish loading. Showing the bundled basemap instead.')
    }, STYLE_LOAD_TIMEOUT_MS)
  }

  // --- Listeners: each is registered once and released in dispose -----------------------------

  const track = (subscription: Subscription) => {
    subscriptions.push(subscription)
  }

  track(
    map.on('style.load', () => {
      clearTimeout(swapTimer)
      swapTimer = undefined
      applyAll()
    }),
  )

  track(
    map.on('idle', () => {
      LAYER_IDS.forEach((id) => {
        if (statuses[id] === 'loading') statuses[id] = 'ready'
      })
      reportStatuses()
      if (awaitingOnlineIdle) {
        awaitingOnlineIdle = false
        options.onBasemapReady()
      }
    }),
  )

  track(
    map.on('sourcedata', (event) => {
      const layer = layerOfSource(event.sourceId)
      if (!layer) return
      statuses[layer] = event.isSourceLoaded ? 'ready' : 'loading'
      reportStatuses()
    }),
  )

  track(
    map.on('error', (event) => {
      const sourceId: unknown = 'sourceId' in event ? event.sourceId : undefined
      const layer = layerOfSource(sourceId)
      if (layer) {
        statuses[layer] = 'error'
        reportStatuses()
        return
      }
      const status = statusOf(event.error)
      if (basemap.kind === 'online' && status !== null && REFUSAL_STATUSES.has(status)) {
        refusals += 1
        if (refusals >= REFUSAL_LIMIT) {
          failOnline(
            `The basemap host (${hostOf(basemap.styleUrl)}) refused requests (HTTP ${String(status)}). Showing the bundled basemap instead.`,
          )
        }
      }
    }),
  )

  track(
    map.on('click', (event: MapMouseEvent) => {
      const { x, y } = event.point
      const layers = LAYER_IDS.map((id) => LAYERS[id].hitLayerId).filter((id) => map.getLayer(id))
      const hits =
        layers.length === 0
          ? []
          : map.queryRenderedFeatures(
              [
                [x - CLICK_PADDING, y - CLICK_PADDING],
                [x + CLICK_PADDING, y + CLICK_PADDING],
              ],
              { layers },
            )
      options.onFeatureClick(
        pickFeature(
          hits.map((hit) => ({ styleLayerId: hit.layer.id, properties: hit.properties })),
        ),
      )
    }),
  )

  track(
    map.on('mousemove', (event: MapMouseEvent) => {
      const { x, y } = event.point
      const layers = LAYER_IDS.map((id) => LAYERS[id].hitLayerId).filter((id) => map.getLayer(id))
      const over =
        layers.length > 0 &&
        map.queryRenderedFeatures(
          [
            [x - CLICK_PADDING, y - CLICK_PADDING],
            [x + CLICK_PADDING, y + CLICK_PADDING],
          ],
          { layers },
        ).length > 0
      map.getCanvas().style.cursor = over ? 'pointer' : ''
    }),
  )

  track(
    map.on('webglcontextlost', () => {
      options.onContextChange(true)
    }),
  )
  track(
    map.on('webglcontextrestored', () => {
      options.onContextChange(false)
    }),
  )

  // --- The handle ---------------------------------------------------------------------------

  return {
    setLayerVisibility(layer, visible) {
      if (disposed) return
      desired.visibility[layer] = visible
      applyVisibility(layer)
    },

    selectFeature(ref) {
      if (disposed) return
      desired.selected = ref
      applySelection()
    },

    focusFeature(ref) {
      if (disposed) return
      const target = getFocusTarget(ref)
      if (!target) return
      // No `essential` flag: MapLibre skips the animation when the system asks for reduced motion.
      if (target.kind === 'point') {
        map.easeTo({
          center: [...target.position],
          zoom: Math.max(map.getZoom(), 11),
        })
      } else {
        map.fitBounds(boundsOf(target.bounds), { padding: 60, maxZoom: 12 })
      }
    },

    resetView() {
      if (disposed) return
      map.easeTo({ center: [...MAP_VIEW.center], zoom: MAP_VIEW.zoom })
    },

    setBasemap(target: BasemapTarget) {
      if (disposed) return
      if (target === 'bundled') {
        cancelSwap()
        if (basemap.kind === 'online') showBundled()
        return
      }
      if (basemap.kind === 'online' && basemap.styleUrl === target.styleUrl) return
      void showOnline(target)
    },

    setPalette(palette) {
      if (disposed) return
      desired.palette = palette
      applyPalette()
    },

    dispose() {
      if (disposed) return
      disposed = true
      cancelSwap()
      for (const subscription of subscriptions.splice(0)) subscription.unsubscribe()
      // Removes the controls, the canvas, the worker, and the GPU context.
      map.remove()
    },
  }
}
