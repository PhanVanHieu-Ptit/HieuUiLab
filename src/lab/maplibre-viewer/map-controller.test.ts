import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HUB_ID } from './data'
import { createMapController } from './map-controller'
import { MapInitError, type MapController, type MapControllerOptions } from './map-types'
import { FALLBACK_TOKENS, derivePalette } from './theme-colors'

type Handler = (event: Record<string, unknown>) => void

/**
 * A recording stand-in for MapLibre. It keeps what the controller needs to be tested for: which
 * listeners are registered and released, and which methods were called with what.
 */
const fake = vi.hoisted(() => {
  interface Call {
    method: string
    args: unknown[]
  }
  interface Registration {
    type: string
    handler: Handler
  }
  interface FakeStyle {
    layers: { id: string; layout?: { visibility?: string } }[]
    sources: Record<string, unknown>
  }

  class GpuError extends Error {}

  /**
   * What the library was asked to do, in order, and never reset: the controller loads the library
   * once per file, so the worker hand-over happens during the first test that builds a map.
   */
  const libraryEvents: string[] = []
  const workerUrls: string[] = []
  const workerUrl = '/assets/maplibre-gl-worker.test.js'
  const setWorkerUrl = (url: string) => {
    libraryEvents.push('setWorkerUrl')
    workerUrls.push(url)
  }

  class FakeControl {
    constructor(readonly options?: Record<string, unknown>) {}
  }
  class FakeNavigation extends FakeControl {}
  class FakeScale extends FakeControl {}
  class FakeAttribution extends FakeControl {}

  class FakeMap {
    static instances: FakeMap[] = []
    static failWith: Error | null = null
    /** When false, the map never reports `load` or `style.load` on its own. */
    static autoLoad = true

    readonly calls: Call[] = []
    readonly listeners: Registration[] = []
    readonly released: Registration[] = []
    /** Method calls and unsubscribes in the order they happened. */
    readonly order: string[] = []
    readonly canvas = document.createElement('canvas')
    readonly controls: FakeControl[] = []
    layers = new Set<string>()
    style: FakeStyle
    hits: unknown[] = []
    removed = 0
    zoom = 9.4

    readonly touchZoomRotate = {
      disableRotation: () => {
        this.record('touchZoomRotate.disableRotation')
      },
    }
    readonly keyboard = {
      disableRotation: () => {
        this.record('keyboard.disableRotation')
      },
    }

    constructor(readonly options: Record<string, unknown>) {
      if (FakeMap.failWith) throw FakeMap.failWith
      libraryEvents.push('new Map')
      FakeMap.instances.push(this)
      this.style = options.style as FakeStyle
      this.indexLayers()
      if (FakeMap.autoLoad) {
        queueMicrotask(() => {
          this.emit('style.load')
          this.emit('load')
        })
      }
    }

    private indexLayers() {
      this.layers = new Set(this.style.layers.map((layer) => layer.id))
    }

    record(method: string, ...args: unknown[]) {
      this.calls.push({ method, args })
      this.order.push(method)
    }

    callsTo(method: string): unknown[][] {
      return this.calls.filter((call) => call.method === method).map((call) => call.args)
    }

    on(type: string, handler: Handler) {
      const registration = { type, handler }
      this.listeners.push(registration)
      return {
        unsubscribe: () => {
          const index = this.listeners.indexOf(registration)
          if (index === -1) return
          this.listeners.splice(index, 1)
          this.released.push(registration)
          this.order.push('unsubscribe')
        },
      }
    }

    listenerCount(type: string): number {
      return this.listeners.filter((entry) => entry.type === type).length
    }

    emit(type: string, event: Record<string, unknown> = {}) {
      for (const entry of [...this.listeners]) if (entry.type === type) entry.handler(event)
    }

    getLayer(id: string) {
      return this.layers.has(id) ? { id } : undefined
    }

    setStyle(style: FakeStyle, options?: unknown) {
      this.record('setStyle', style, options)
      this.style = style
      this.indexLayers()
      if (FakeMap.autoLoad)
        queueMicrotask(() => {
          this.emit('style.load')
        })
    }

    setLayoutProperty(...args: unknown[]) {
      this.record('setLayoutProperty', ...args)
    }
    setPaintProperty(...args: unknown[]) {
      this.record('setPaintProperty', ...args)
    }
    setFilter(...args: unknown[]) {
      this.record('setFilter', ...args)
    }
    setMaxBounds(...args: unknown[]) {
      this.record('setMaxBounds', ...args)
    }
    setMinZoom(...args: unknown[]) {
      this.record('setMinZoom', ...args)
    }
    jumpTo(...args: unknown[]) {
      this.record('jumpTo', ...args)
    }
    easeTo(...args: unknown[]) {
      this.record('easeTo', ...args)
    }
    fitBounds(...args: unknown[]) {
      this.record('fitBounds', ...args)
    }
    addControl(control: FakeControl, position: string) {
      this.record('addControl', control, position)
      this.controls.push(control)
    }
    removeControl(control: FakeControl) {
      this.record('removeControl', control)
      this.controls.splice(this.controls.indexOf(control), 1)
    }
    queryRenderedFeatures(...args: unknown[]) {
      this.record('queryRenderedFeatures', ...args)
      return this.hits
    }
    getZoom() {
      return this.zoom
    }
    getCanvas() {
      return this.canvas
    }
    remove() {
      this.removed += 1
      this.order.push('remove')
    }

    /** The attribution control that is on the map now. */
    attribution(): FakeAttribution | undefined {
      return this.controls.find((control) => control instanceof FakeAttribution)
    }
  }

  return {
    FakeMap,
    FakeNavigation,
    FakeScale,
    FakeAttribution,
    GpuError,
    libraryEvents,
    workerUrls,
    workerUrl,
    setWorkerUrl,
  }
})

vi.mock('maplibre-gl', () => ({
  Map: fake.FakeMap,
  NavigationControl: fake.FakeNavigation,
  ScaleControl: fake.FakeScale,
  AttributionControl: fake.FakeAttribution,
  GPUInitializationError: fake.GpuError,
  setWorkerUrl: fake.setWorkerUrl,
}))
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}))
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: fake.workerUrl }))

type FakeMap = InstanceType<typeof fake.FakeMap>

function lastMap(): FakeMap {
  const map = fake.FakeMap.instances.at(-1)
  if (!map) throw new Error('No map was built')
  return map
}

function makeOptions(
  visibility: MapControllerOptions['visibility'] = { sites: true, route: true, zones: true },
) {
  return {
    palette: derivePalette(FALLBACK_TOKENS),
    visibility,
    onFeatureClick: vi.fn(),
    onLayerStatus: vi.fn(),
    onBasemapReady: vi.fn(),
    onBasemapFailed: vi.fn(),
    onContextChange: vi.fn(),
  } satisfies MapControllerOptions
}

const created: MapController[] = []

async function create(options = makeOptions()) {
  const abort = new AbortController()
  const controller = await createMapController(document.createElement('div'), options, abort.signal)
  created.push(controller)
  return { controller, options, map: lastMap(), abort }
}

const SECRET = 'SEKRET-123'
const target = {
  styleUrl: `https://tiles.example.com/style.json?key=${SECRET}`,
  attribution: 'Example <b>Maps</b>',
}
const providerStyle = {
  version: 8,
  sources: { provider: { type: 'vector', url: 'https://tiles.example.com/tiles.json' } },
  layers: [{ id: 'provider-water', type: 'background' }],
}

const fetchMock = vi.fn()

function respondWithStyle(body: unknown = providerStyle) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body)))
}

beforeEach(() => {
  fake.FakeMap.instances.length = 0
  fake.FakeMap.failWith = null
  fake.FakeMap.autoLoad = true
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  for (const controller of created.splice(0)) controller.dispose()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const EVENTS_WE_LISTEN_TO = [
  'style.load',
  'idle',
  'sourcedata',
  'error',
  'click',
  'mousemove',
  'webglcontextlost',
  'webglcontextrestored',
]

/** Wait until the controller has finished an async basemap swap. */
async function swapped(map: FakeMap, count = 1) {
  await vi.waitFor(() => {
    expect(map.callsTo('setStyle')).toHaveLength(count)
  })
}

describe('creating the map', () => {
  // A bundled app has no worker beside the library, so a map that starts without this URL fails in
  // a real browser while every test that mocks the library still passes.
  it('hands the library its worker once, before the first map exists', async () => {
    await create()
    await create()
    expect(fake.workerUrls).toEqual([fake.workerUrl])
    expect(fake.libraryEvents.indexOf('setWorkerUrl')).toBeGreaterThanOrEqual(0)
    expect(fake.libraryEvents.indexOf('setWorkerUrl')).toBeLessThan(
      fake.libraryEvents.indexOf('new Map'),
    )
  })

  it('builds one map with the bundled style and resolves once it has drawn', async () => {
    const { map } = await create()
    expect(fake.FakeMap.instances).toHaveLength(1)
    const style = map.options.style as { layers: { id: string }[]; glyphs?: string }
    expect(style.layers.map((layer) => layer.id)).toEqual(
      expect.arrayContaining(['lab-ocean', 'lab-land-fill', 'lab-route-line', 'lab-sites-circle']),
    )
    expect(style.glyphs).toBeUndefined()
  })

  it('keeps the page scrollable and the camera level', async () => {
    const { map } = await create()
    expect(map.options).toMatchObject({
      attributionControl: false,
      cooperativeGestures: true,
      renderWorldCopies: false,
      dragRotate: false,
      maxPitch: 0,
    })
    expect(map.callsTo('touchZoomRotate.disableRotation')).toHaveLength(1)
    expect(map.callsTo('keyboard.disableRotation')).toHaveLength(1)
  })

  it('adds navigation, scale and attribution controls once each, and labels the canvas', async () => {
    const { map } = await create()
    expect(map.controls.map((control) => control.constructor.name)).toEqual([
      'FakeNavigation',
      'FakeScale',
      'FakeAttribution',
    ])
    expect(map.canvas.getAttribute('aria-label')).toMatch(/Interactive map/)
  })

  it('credits the synthetic data and MapLibre, not a tile provider', async () => {
    const { map } = await create()
    const credits = map.attribution()?.options?.customAttribution as string[]
    expect(credits.join(' ')).toContain('Synthetic sample data')
    expect(credits.join(' ')).toContain('MapLibre')
  })

  it('starts with the visitor’s visibility baked into the style', async () => {
    const { map } = await create(makeOptions({ sites: false, route: true, zones: true }))
    const style = map.options.style as {
      layers: { id: string; layout?: { visibility?: string } }[]
    }
    const sites = style.layers.find((layer) => layer.id === 'lab-sites-circle')
    expect(sites?.layout?.visibility).toBe('none')
  })
})

describe('failing to create the map', () => {
  it('reports missing WebGL2 as such', async () => {
    fake.FakeMap.failWith = new fake.GpuError('no gpu')
    await expect(
      createMapController(
        document.createElement('div'),
        makeOptions(),
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ name: 'MapInitError', kind: 'webgl2-unavailable' })
    expect(fake.FakeMap.instances).toHaveLength(0)
  })

  it('reports any other constructor failure as an init failure', async () => {
    fake.FakeMap.failWith = new Error('bad options')
    const failure = createMapController(
      document.createElement('div'),
      makeOptions(),
      new AbortController().signal,
    )
    await expect(failure).rejects.toBeInstanceOf(MapInitError)
    await expect(failure).rejects.toMatchObject({ kind: 'init-failed' })
  })

  it('rejects and leaves no map behind when the style fails before the first draw', async () => {
    fake.FakeMap.autoLoad = false
    const pending = createMapController(
      document.createElement('div'),
      makeOptions(),
      new AbortController().signal,
    )
    await vi.waitFor(() => {
      expect(fake.FakeMap.instances).toHaveLength(1)
    })
    const map = lastMap()
    map.emit('error', { error: { message: 'bad style' } })
    await expect(pending).rejects.toMatchObject({ kind: 'init-failed', message: 'bad style' })
    expect(map.removed).toBe(1)
    expect(map.listeners).toHaveLength(0)
  })
})

describe('being torn down early', () => {
  it('builds no map when the caller aborts before the library arrives', async () => {
    const abort = new AbortController()
    const pending = createMapController(document.createElement('div'), makeOptions(), abort.signal)
    abort.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(fake.FakeMap.instances).toHaveLength(0)
  })

  it('removes the map and every listener when aborted while it loads', async () => {
    fake.FakeMap.autoLoad = false
    const abort = new AbortController()
    const pending = createMapController(document.createElement('div'), makeOptions(), abort.signal)
    await vi.waitFor(() => {
      expect(fake.FakeMap.instances).toHaveLength(1)
    })
    abort.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    const map = lastMap()
    expect(map.removed).toBe(1)
    expect(map.listeners).toHaveLength(0)
  })

  it('builds exactly one map for StrictMode’s mount, unmount, mount', async () => {
    const first = new AbortController()
    const second = new AbortController()
    const options = makeOptions()
    const firstCall = createMapController(document.createElement('div'), options, first.signal)
    first.abort()
    const secondCall = createMapController(document.createElement('div'), options, second.signal)
    await expect(firstCall).rejects.toMatchObject({ name: 'AbortError' })
    created.push(await secondCall)
    expect(fake.FakeMap.instances).toHaveLength(1)
    expect(lastMap().removed).toBe(0)
  })
})

describe('listeners', () => {
  it('registers each event once', async () => {
    const { map } = await create()
    for (const type of EVENTS_WE_LISTEN_TO) expect(map.listenerCount(type), type).toBe(1)
    expect(map.listenerCount('load')).toBe(0)
  })

  it('does not add listeners when the basemap changes back and forth', async () => {
    respondWithStyle()
    const { controller, map } = await create()
    controller.setBasemap(target)
    await swapped(map, 1)
    controller.setBasemap('bundled')
    respondWithStyle()
    controller.setBasemap(target)
    await swapped(map, 3)
    for (const type of EVENTS_WE_LISTEN_TO) expect(map.listenerCount(type), type).toBe(1)
  })

  it('releases every listener before removing the map, and does so once', async () => {
    const { controller, map } = await create()
    const registered = map.listeners.length
    // The two listeners that waited for the first draw were already released by then.
    const releasedBefore = map.released.length
    controller.dispose()
    controller.dispose()
    expect(map.removed).toBe(1)
    expect(map.listeners).toHaveLength(0)
    expect(map.released.length - releasedBefore).toBe(registered)
    expect(map.order.at(-1)).toBe('remove')
    expect(map.order.filter((entry) => entry === 'remove')).toHaveLength(1)
    expect(map.order.lastIndexOf('unsubscribe')).toBeLessThan(map.order.indexOf('remove'))
  })

  it('ignores every call after dispose', async () => {
    respondWithStyle()
    const { controller, map } = await create()
    controller.dispose()
    const before = map.calls.length
    controller.setLayerVisibility('sites', false)
    controller.selectFeature({ layer: 'sites', id: HUB_ID })
    controller.focusFeature({ layer: 'sites', id: HUB_ID })
    controller.resetView()
    controller.setBasemap(target)
    controller.setPalette(derivePalette(FALLBACK_TOKENS))
    await Promise.resolve()
    expect(map.calls).toHaveLength(before)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('applying the state', () => {
  it('hides and shows every style layer of a layer', async () => {
    const { controller, map } = await create()
    // Drop the replay that the first style load already made.
    map.calls.length = 0
    controller.setLayerVisibility('sites', false)
    expect(map.callsTo('setLayoutProperty')).toEqual([
      ['lab-sites-selected', 'visibility', 'none'],
      ['lab-sites-circle', 'visibility', 'none'],
    ])
    controller.setLayerVisibility('sites', true)
    expect(map.callsTo('setLayoutProperty').at(-1)).toEqual([
      'lab-sites-circle',
      'visibility',
      'visible',
    ])
  })

  it('highlights a feature by filter and clears it with a filter that matches nothing', async () => {
    const { controller, map } = await create()
    controller.selectFeature({ layer: 'sites', id: HUB_ID })
    const filters = new Map(map.callsTo('setFilter').map(([id, filter]) => [String(id), filter]))
    expect(filters.get('lab-sites-selected')).toEqual(['==', ['get', 'id'], HUB_ID])
    expect(filters.get('lab-route-selected')).toEqual(['==', ['get', 'id'], ''])
    expect(filters.get('lab-zones-selected')).toEqual(['==', ['get', 'id'], ''])

    controller.selectFeature(null)
    expect(map.callsTo('setFilter').at(-1)?.[1]).toEqual(['==', ['get', 'id'], ''])
    expect(map.callsTo('setFilter').every((call) => call[1] !== null)).toBe(true)
  })

  it('repaints from a new palette without a new map', async () => {
    const { controller, map } = await create()
    controller.setPalette(derivePalette({ ...FALLBACK_TOKENS, primary: '#ff0000' }))
    expect(map.callsTo('setPaintProperty')).toContainEqual([
      'lab-route-line',
      'line-color',
      '#ff0000',
    ])
    expect(map.callsTo('setPaintProperty').some(([id]) => id === 'lab-ocean')).toBe(true)
    expect(fake.FakeMap.instances).toHaveLength(1)
  })

  it('re-applies visibility, selection and colours after every style load', async () => {
    const { controller, map } = await create()
    controller.setLayerVisibility('route', false)
    controller.selectFeature({ layer: 'zones', id: 'harbour-district' })
    const before = map.calls.length
    map.emit('style.load')
    const replay = map.calls.slice(before)
    expect(replay.filter((call) => call.method === 'setLayoutProperty')).toContainEqual({
      method: 'setLayoutProperty',
      args: ['lab-route-line', 'visibility', 'none'],
    })
    expect(replay.filter((call) => call.method === 'setFilter')).toContainEqual({
      method: 'setFilter',
      args: ['lab-zones-selected', ['==', ['get', 'id'], 'harbour-district']],
    })
  })

  it('moves the camera to a point or fits a feature’s bounds', async () => {
    const { controller, map } = await create()
    controller.focusFeature({ layer: 'sites', id: HUB_ID })
    expect(map.callsTo('easeTo')[0]?.[0]).toMatchObject({ center: [-35, 5], zoom: 11 })
    controller.focusFeature({ layer: 'route', id: 'coastal-loop' })
    expect(map.callsTo('fitBounds')).toHaveLength(1)
    // Never forced: MapLibre skips the animation itself when the system asks for reduced motion.
    expect(JSON.stringify(map.calls)).not.toContain('essential')
    controller.focusFeature({ layer: 'sites', id: 'nope' })
    expect(map.callsTo('easeTo')).toHaveLength(1)
    controller.resetView()
    expect(map.callsTo('easeTo')).toHaveLength(2)
  })
})

describe('clicking the map', () => {
  const siteHit = { layer: { id: 'lab-sites-circle' }, properties: { id: HUB_ID } }
  const zoneHit = { layer: { id: 'lab-zones-fill' }, properties: { id: 'harbour-district' } }

  it('queries a padded box around the point, against our layers only', async () => {
    const { map } = await create()
    map.emit('click', { point: { x: 100, y: 120 } })
    const [box, params] = map.callsTo('queryRenderedFeatures')[0] ?? []
    expect(box).toEqual([
      [92, 112],
      [108, 128],
    ])
    expect(params).toEqual({
      layers: ['lab-sites-circle', 'lab-route-line', 'lab-zones-fill'],
    })
  })

  it('selects the point over the zone beneath it, whatever order the map returns', async () => {
    const { map, options } = await create()
    map.hits = [zoneHit, siteHit]
    map.emit('click', { point: { x: 1, y: 1 } })
    expect(options.onFeatureClick).toHaveBeenCalledExactlyOnceWith({ layer: 'sites', id: HUB_ID })
  })

  it('clears the selection on empty space', async () => {
    const { map, options } = await create()
    map.hits = []
    map.emit('click', { point: { x: 1, y: 1 } })
    expect(options.onFeatureClick).toHaveBeenCalledExactlyOnceWith(null)
  })

  it('never queries a layer the style does not have', async () => {
    const { map } = await create()
    map.layers.delete('lab-route-line')
    map.emit('click', { point: { x: 1, y: 1 } })
    expect(map.callsTo('queryRenderedFeatures')[0]?.[1]).toEqual({
      layers: ['lab-sites-circle', 'lab-zones-fill'],
    })
  })

  it('does not query at all when none of our layers exist', async () => {
    const { map, options } = await create()
    map.layers.clear()
    map.emit('click', { point: { x: 1, y: 1 } })
    expect(map.callsTo('queryRenderedFeatures')).toHaveLength(0)
    expect(options.onFeatureClick).toHaveBeenCalledWith(null)
  })

  it('shows a pointer cursor over a feature and the default cursor elsewhere', async () => {
    const { map } = await create()
    map.hits = [siteHit]
    map.emit('mousemove', { point: { x: 5, y: 5 } })
    expect(map.canvas.style.cursor).toBe('pointer')
    map.hits = []
    map.emit('mousemove', { point: { x: 5, y: 5 } })
    expect(map.canvas.style.cursor).toBe('')
  })
})

describe('layer status', () => {
  const idle = { sites: 'ready', route: 'ready', zones: 'ready' }

  it('turns ready when the map goes idle, once', async () => {
    const { map, options } = await create()
    map.emit('idle')
    map.emit('idle')
    expect(options.onLayerStatus).toHaveBeenCalledExactlyOnceWith(idle)
  })

  it('follows each source’s own loading', async () => {
    const { map, options } = await create()
    map.emit('sourcedata', { sourceId: 'lab-sites', isSourceLoaded: true })
    expect(options.onLayerStatus).toHaveBeenLastCalledWith({
      sites: 'ready',
      route: 'loading',
      zones: 'loading',
    })
    map.emit('sourcedata', { sourceId: 'lab-sites', isSourceLoaded: true })
    expect(options.onLayerStatus).toHaveBeenCalledTimes(1)
    map.emit('sourcedata', { sourceId: 'some-provider-source', isSourceLoaded: false })
    expect(options.onLayerStatus).toHaveBeenCalledTimes(1)
  })

  it('marks a layer whose source errored', async () => {
    const { map, options } = await create()
    map.emit('idle')
    map.emit('error', { sourceId: 'lab-route', error: { message: 'x' } })
    expect(options.onLayerStatus).toHaveBeenLastCalledWith({
      sites: 'ready',
      route: 'error',
      zones: 'ready',
    })
  })
})

describe('graphics context', () => {
  it('reports a lost context and its return', async () => {
    const { map, options } = await create()
    map.emit('webglcontextlost')
    expect(options.onContextChange).toHaveBeenLastCalledWith(true)
    map.emit('webglcontextrestored')
    expect(options.onContextChange).toHaveBeenLastCalledWith(false)
  })
})

describe('the online basemap', () => {
  it('requests the style only when asked, and only once for the same target', async () => {
    respondWithStyle()
    const { controller, map } = await create()
    expect(fetchMock).not.toHaveBeenCalled()
    controller.setBasemap(target)
    await swapped(map)
    controller.setBasemap(target)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(target.styleUrl)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'omit' })
  })

  it('puts the data layers on top of the provider’s style, with the visitor’s choices', async () => {
    respondWithStyle()
    const { controller, map } = await create()
    controller.setLayerVisibility('zones', false)
    controller.selectFeature({ layer: 'sites', id: HUB_ID })
    controller.setBasemap(target)
    await swapped(map)
    const [style, options] = map.callsTo('setStyle')[0] ?? []
    expect(options).toEqual({ diff: false })
    const composed = style as {
      layers: { id: string; layout?: { visibility?: string }; filter?: unknown }[]
    }
    const ids = composed.layers.map((layer) => layer.id)
    expect(ids[0]).toBe('provider-water')
    expect(ids.at(-1)).toBe('lab-sites-circle')
    expect(composed.layers.find((layer) => layer.id === 'lab-zones-fill')?.layout?.visibility).toBe(
      'none',
    )
    expect(composed.layers.find((layer) => layer.id === 'lab-sites-selected')?.filter).toEqual([
      '==',
      ['get', 'id'],
      HUB_ID,
    ])
  })

  it('frees the camera for a real map, then credits the provider with escaped text', async () => {
    respondWithStyle()
    const { controller, map } = await create()
    controller.setBasemap(target)
    await swapped(map)
    expect(map.callsTo('setMaxBounds').at(-1)).toEqual([null])
    expect(map.callsTo('setMinZoom').at(-1)).toEqual([2])
    const credits = map.attribution()?.options?.customAttribution as string[]
    expect(credits[0]).toBe('Example &lt;b&gt;Maps&lt;/b&gt;')
    expect(map.controls.filter((control) => control instanceof fake.FakeAttribution)).toHaveLength(
      1,
    )
  })

  it('reports ready on the first idle after the swap, and only then', async () => {
    respondWithStyle()
    const { controller, map, options } = await create()
    map.emit('idle')
    expect(options.onBasemapReady).not.toHaveBeenCalled()
    controller.setBasemap(target)
    await swapped(map)
    map.emit('idle')
    map.emit('idle')
    expect(options.onBasemapReady).toHaveBeenCalledTimes(1)
  })

  it('goes back to the bundled style, bounds and camera', async () => {
    respondWithStyle()
    const { controller, map } = await create()
    controller.setBasemap(target)
    await swapped(map)
    controller.setBasemap('bundled')
    expect(map.callsTo('setStyle')).toHaveLength(2)
    const bundled = map.callsTo('setStyle')[1]?.[0] as { layers: { id: string }[] }
    expect(bundled.layers.map((layer) => layer.id)).toContain('lab-ocean')
    expect(map.callsTo('setMaxBounds').at(-1)?.[0]).toEqual([
      [-36.5, 3.5],
      [-33.5, 6.5],
    ])
    expect(map.callsTo('setMinZoom').at(-1)).toEqual([8])
    expect(map.callsTo('jumpTo')).toHaveLength(1)
    const credits = map.attribution()?.options?.customAttribution as string[]
    expect(credits.join(' ')).toContain('Synthetic sample data')
  })

  it('does nothing when asked for the bundled basemap while already on it', async () => {
    const { controller, map } = await create()
    const before = map.calls.length
    controller.setBasemap('bundled')
    expect(map.calls).toHaveLength(before)
  })

  it('ignores a style that arrives after the visitor changed their mind', async () => {
    let finish: (response: Response) => void = () => undefined
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        finish = resolve
      }),
    )
    const { controller, map, options } = await create()
    controller.setBasemap(target)
    controller.setBasemap('bundled')
    finish(new Response(JSON.stringify(providerStyle)))
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(map.callsTo('setStyle')).toHaveLength(0)
    expect(options.onBasemapFailed).not.toHaveBeenCalled()
  })

  describe('when the style cannot be used', () => {
    async function failWith(setup: () => void) {
      setup()
      const { controller, map, options } = await create()
      controller.setBasemap(target)
      await vi.waitFor(() => {
        expect(options.onBasemapFailed).toHaveBeenCalledTimes(1)
      })
      const message = String(options.onBasemapFailed.mock.calls[0]?.[0])
      return { map, message, controller, options }
    }

    it('stays on the bundled map and names the host, never the key', async () => {
      const { map, message } = await failWith(() => {
        fetchMock.mockRejectedValue(new TypeError(`Failed to fetch ${target.styleUrl}`))
      })
      expect(message).toContain('tiles.example.com')
      expect(message).toContain('could not be reached')
      expect(message).not.toContain(SECRET)
      expect(message).not.toContain('https://')
      expect(map.callsTo('setStyle')).toHaveLength(0)
    })

    it('reports an HTTP refusal', async () => {
      const { message } = await failWith(() => {
        fetchMock.mockResolvedValue(new Response('no', { status: 404 }))
      })
      expect(message).toContain('HTTP 404')
      expect(message).not.toContain(SECRET)
    })

    it('rejects a body that is not a map style', async () => {
      const { message } = await failWith(() => {
        respondWithStyle({ hello: 'world' })
      })
      expect(message).toContain('not a map style')
    })

    it('rejects a body that is not JSON', async () => {
      const { message } = await failWith(() => {
        fetchMock.mockResolvedValue(new Response('<html>'))
      })
      expect(message).toContain('could not be reached')
    })

    it('can try again afterwards', async () => {
      const { controller, map } = await failWith(() => {
        fetchMock.mockRejectedValue(new TypeError('offline'))
      })
      respondWithStyle()
      controller.setBasemap(target)
      await swapped(map)
    })

    it('gives up on a host that does not answer', async () => {
      vi.useFakeTimers()
      fetchMock.mockImplementation(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }),
      )
      const { controller, options } = await create()
      controller.setBasemap(target)
      await vi.advanceTimersByTimeAsync(10_000)
      expect(options.onBasemapFailed).toHaveBeenCalledTimes(1)
      expect(String(options.onBasemapFailed.mock.calls[0]?.[0])).toContain('did not answer in time')
    })

    it('goes back to the bundled map when the style never finishes loading', async () => {
      vi.useFakeTimers()
      respondWithStyle()
      const { controller, map, options } = await create()
      fake.FakeMap.autoLoad = false
      controller.setBasemap(target)
      await vi.advanceTimersByTimeAsync(0)
      expect(map.callsTo('setStyle')).toHaveLength(1)
      await vi.advanceTimersByTimeAsync(15_000)
      expect(map.callsTo('setStyle')).toHaveLength(2)
      expect(options.onBasemapFailed).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the provider refuses requests', () => {
    async function online() {
      respondWithStyle()
      const created = await create()
      created.controller.setBasemap(target)
      await swapped(created.map)
      return created
    }
    const refuse = (map: FakeMap, status: number, times: number) => {
      for (let count = 0; count < times; count += 1) {
        map.emit('error', { error: { message: 'Forbidden', status } })
      }
    }

    it.each([401, 403, 429])(
      'falls back to the bundled map after repeated HTTP %i',
      async (status) => {
        const { map, options } = await online()
        refuse(map, status, 2)
        expect(options.onBasemapFailed).not.toHaveBeenCalled()
        refuse(map, status, 1)
        expect(options.onBasemapFailed).toHaveBeenCalledTimes(1)
        expect(String(options.onBasemapFailed.mock.calls[0]?.[0])).toContain(
          `HTTP ${String(status)}`,
        )
        expect(String(options.onBasemapFailed.mock.calls[0]?.[0])).not.toContain(SECRET)
        expect(map.callsTo('setStyle')).toHaveLength(2)
      },
    )

    it('falls back once, however many more errors follow', async () => {
      const { map, options } = await online()
      refuse(map, 429, 10)
      expect(options.onBasemapFailed).toHaveBeenCalledTimes(1)
    })

    it('does not treat other failures as a refusal', async () => {
      const { map, options } = await online()
      refuse(map, 500, 10)
      map.emit('error', { error: { message: 'offline' } })
      expect(options.onBasemapFailed).not.toHaveBeenCalled()
    })

    it('counts again from zero on the next attempt', async () => {
      const { controller, map, options } = await online()
      refuse(map, 429, 2)
      controller.setBasemap('bundled')
      respondWithStyle()
      controller.setBasemap({ ...target, styleUrl: `${target.styleUrl}&v=2` })
      await swapped(map, 3)
      refuse(map, 429, 2)
      expect(options.onBasemapFailed).not.toHaveBeenCalled()
    })
  })
})
