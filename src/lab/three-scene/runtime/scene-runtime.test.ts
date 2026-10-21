import type * as Three from 'three'
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type Camera,
  type Scene,
} from 'three'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

import { HOME_POSE, TARGET, movePose, poseFromPosition } from '../camera-config'
import type { SceneController } from '../scene-types'
import type { ScenePalette } from '../theme-colors'
import type { SceneLayer } from './layers'
import { createSceneRuntime } from './scene-runtime'

// jsdom has no WebGL, so the renderer is replaced by a recording stand-in. Everything else is
// real: Three.js builds the scene and raycasts against it, and the real OrbitControls handle the
// pointer and wheel events. What this proves is what the runtime does with them.

const harness = vi.hoisted(() => ({
  renderers: [] as {
    parameters: { canvas: HTMLCanvasElement; antialias?: boolean }
    render: ReturnType<typeof vi.fn>
    dispose: ReturnType<typeof vi.fn>
    forceContextLoss: ReturnType<typeof vi.fn>
    setSize: ReturnType<typeof vi.fn>
    setPixelRatio: ReturnType<typeof vi.fn>
    info: {
      render: { calls: number; triangles: number; frame: number }
      memory: { geometries: number; textures: number }
    }
  }[],
  failToCreate: false,
  failToDraw: false,
  /** Everything the stand-in and the tests did that has an order, oldest first. */
  order: [] as string[],
}))

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof Three>()

  class FakeRenderer {
    readonly parameters: { canvas: HTMLCanvasElement; antialias?: boolean }
    readonly info = {
      render: { calls: 0, triangles: 0, frame: 0 },
      memory: { geometries: 0, textures: 0 },
    }
    readonly setPixelRatio = vi.fn()
    readonly setSize = vi.fn()
    readonly dispose = vi.fn(() => {
      harness.order.push('renderer.dispose')
    })
    readonly forceContextLoss = vi.fn(() => {
      harness.order.push('forceContextLoss')
    })
    readonly render = vi.fn((scene: Scene, camera: Camera) => {
      if (harness.failToDraw) throw new Error('Shader program failed to link.')
      // What the real renderer does before it draws, and what a raycast depends on.
      scene.updateMatrixWorld()
      camera.updateMatrixWorld()
      this.info.render.frame += 1
      this.info.render.calls = 7
      this.info.render.triangles = 4200
    })

    constructor(parameters: { canvas: HTMLCanvasElement; antialias?: boolean }) {
      if (harness.failToCreate) throw new Error('Error creating WebGL context.')
      this.parameters = parameters
      harness.renderers.push(this)
    }
  }

  return { ...actual, WebGLRenderer: FakeRenderer }
})

const palette: ScenePalette = {
  background: '#ffffff',
  ground: '#eeeeee',
  grid: '#bbbbbb',
  solid: '#3355cc',
  selection: '#cc8800',
}

const WIDTH = 800
const HEIGHT = 600

/** A manual animation-frame queue, and a resize observer the test can fire. */
const browser = {
  frames: new Map<number, FrameRequestCallback>(),
  next: 1,
  cancelled: [] as number[],
  observers: [] as { callback: () => void; disconnect: ReturnType<typeof vi.fn> }[],
}

function tick(now = 0) {
  const [handle, callback] = [...browser.frames][0] ?? []
  if (handle === undefined || !callback) throw new Error('No frame was requested.')
  browser.frames.delete(handle)
  callback(now)
}

/** Run frames at 100 ms steps until none is pending, and return how many ran. */
function settle(limit = 200): number {
  let count = 0
  for (let now = 0; browser.frames.size > 0; now += 100) {
    if (count >= limit) throw new Error('The scene never went quiet.')
    tick(now)
    count += 1
  }
  return count
}

let canvas: HTMLCanvasElement
let created: SceneController[]
let options: { palette: ScenePalette; onPick: Mock; onContextChange: Mock; onIdle: Mock }

function start(layers?: readonly SceneLayer[]): SceneController {
  const controller = createSceneRuntime(canvas, options, ...(layers ? [layers] : []))
  created.push(controller)
  return controller
}

const renderer = () => {
  const [first] = harness.renderers
  if (!first) throw new Error('No renderer was created.')
  return first
}

/** The camera the runtime draws with, as it was handed to the renderer. */
function cameraOf(): Camera {
  const call = renderer().render.mock.calls[0] as [Scene, Camera] | undefined
  if (!call) throw new Error('Nothing was drawn.')
  return call[1]
}

function poseOfCamera() {
  const { position } = cameraOf()
  return poseFromPosition([position.x, position.y, position.z])
}

function pointer(type: string, init: PointerEventInit = {}) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    button: 0,
    clientX: WIDTH / 2,
    clientY: HEIGHT / 2,
    ...init,
  })
  canvas.dispatchEvent(event)
  return event
}

function click(init: PointerEventInit = {}) {
  pointer('pointerdown', init)
  pointer('pointerup', init)
}

/**
 * Records the listeners added to a target and not yet removed, by identity, so a listener that is
 * removed twice (which the DOM allows) cannot hide one that is never removed.
 */
function watchListeners(target: EventTarget, label: string) {
  const live: { type: string; listener: unknown }[] = []
  let added = 0
  const add = target.addEventListener.bind(target) as (...args: unknown[]) => void
  const remove = target.removeEventListener.bind(target) as (...args: unknown[]) => void
  target.addEventListener = (type: string, listener: unknown, ...rest: unknown[]) => {
    live.push({ type: `${label}:${type}`, listener })
    added += 1
    add(type, listener, ...rest)
  }
  target.removeEventListener = (type: string, listener: unknown, ...rest: unknown[]) => {
    const index = live.findIndex(
      (entry) => entry.type === `${label}:${type}` && entry.listener === listener,
    )
    if (index !== -1) live.splice(index, 1)
    remove(type, listener, ...rest)
  }
  return {
    /** Everything added and not removed since, as `label:type`. */
    left: () => live.map((entry) => entry.type),
    /** How many listeners have been added in all. */
    get added() {
      return added
    },
  }
}

const originalResizeObserver = window.ResizeObserver

beforeEach(() => {
  harness.renderers.length = 0
  harness.failToCreate = false
  harness.failToDraw = false
  harness.order.length = 0
  browser.frames.clear()
  browser.next = 1
  browser.cancelled.length = 0
  browser.observers.length = 0
  created = []

  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      const handle = browser.next
      browser.next += 1
      browser.frames.set(handle, callback)
      return handle
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((handle: number) => {
      browser.cancelled.push(handle)
      browser.frames.delete(handle)
    }),
  )
  // The setup file defines `ResizeObserver` as writable but not configurable, so it is assigned
  // rather than stubbed.
  window.ResizeObserver = class {
    readonly disconnect = vi.fn()
    readonly observe = vi.fn()
    readonly unobserve = vi.fn()
    constructor(callback: () => void) {
      browser.observers.push({ callback, disconnect: this.disconnect })
    }
  } as unknown as typeof ResizeObserver
  vi.stubGlobal('devicePixelRatio', 2)

  canvas = document.createElement('canvas')
  Object.defineProperty(canvas, 'clientWidth', { value: WIDTH, configurable: true })
  Object.defineProperty(canvas, 'clientHeight', { value: HEIGHT, configurable: true })
  canvas.getBoundingClientRect = () => new DOMRect(0, 0, WIDTH, HEIGHT)
  canvas.setPointerCapture = vi.fn()
  document.body.append(canvas)

  options = {
    palette,
    onPick: vi.fn(),
    onContextChange: vi.fn(),
    onIdle: vi.fn(),
  }
})

afterEach(() => {
  for (const controller of created) controller.dispose()
  canvas.remove()
  window.ResizeObserver = originalResizeObserver
  vi.unstubAllGlobals()
})

describe('starting', () => {
  it('takes over the canvas it is given, with antialiasing', () => {
    start()
    expect(harness.renderers).toHaveLength(1)
    expect(renderer().parameters.canvas).toBe(canvas)
    expect(renderer().parameters.antialias).toBe(true)
  })

  it('draws the first frame at once, sized to the canvas, with the pixel ratio capped at two', () => {
    vi.stubGlobal('devicePixelRatio', 3)
    start()
    expect(renderer().setPixelRatio).toHaveBeenCalledWith(2)
    // `false`: the canvas is sized by CSS, not by the renderer.
    expect(renderer().setSize).toHaveBeenCalledWith(WIDTH, HEIGHT, false)
    expect(renderer().render).toHaveBeenCalledTimes(1)
  })

  it('looks at the target from the home pose', () => {
    start()
    const pose = poseOfCamera()
    expect(pose.azimuth).toBeCloseTo(HOME_POSE.azimuth)
    expect(pose.polar).toBeCloseTo(HOME_POSE.polar)
    expect(pose.distance).toBeCloseTo(HOME_POSE.distance)
  })

  it('reports the renderer’s counters once, and then asks the browser for nothing', () => {
    start()
    expect(options.onIdle).toHaveBeenCalledTimes(1)
    expect(options.onIdle).toHaveBeenCalledWith({
      drawCalls: 7,
      triangles: 4200,
      geometries: 0,
      textures: 0,
      frames: 1,
    })
    expect(browser.frames.size).toBe(0)
  })

  it('builds the scene from the layers it is given', () => {
    const built = vi.fn()
    const marker = new Mesh(new BoxGeometry(), new MeshBasicMaterial())
    const layer: SceneLayer = {
      id: 'marker',
      build: (context) => {
        built(context.palette)
        const object = new Group()
        object.add(marker)
        return { object }
      },
    }
    start([layer])
    expect(built).toHaveBeenCalledWith(palette)
    const call = renderer().render.mock.calls[0] as [Scene, Camera]
    expect(call[0].getObjectById(marker.id)).toBe(marker)
  })
})

describe('failing to start', () => {
  it('throws when the renderer cannot be created, and leaves nothing behind', () => {
    harness.failToCreate = true
    expect(() => createSceneRuntime(canvas, options)).toThrow('Error creating WebGL context.')
    expect(browser.frames.size).toBe(0)
    expect(browser.observers).toHaveLength(0)
  })

  it('releases everything it had built when the first frame cannot be drawn', () => {
    const onCanvas = watchListeners(canvas, 'canvas')
    const onDocument = watchListeners(document, 'document')
    harness.failToDraw = true

    expect(() => createSceneRuntime(canvas, options)).toThrow('Shader program failed to link.')

    // Everything is registered before the first frame, so the controls and the scene had been
    // built, and all of it has been taken down again.
    expect(onCanvas.added).toBeGreaterThan(0)
    expect(onCanvas.left()).toEqual([])
    expect(onDocument.left()).toEqual([])
    expect(renderer().dispose).toHaveBeenCalledTimes(1)
    expect(renderer().forceContextLoss).toHaveBeenCalledTimes(1)
    expect(browser.observers[0]?.disconnect).toHaveBeenCalledTimes(1)
    // The controls give the canvas back to the page.
    expect(canvas.style.touchAction).toBe('')
  })
})

describe('drawing on demand', () => {
  it('draws one frame, however many changes arrive before it, and then goes quiet', () => {
    const controller = start()
    controller.setSelected('box')
    controller.setSelected('cone')
    controller.setPalette(palette)
    expect(browser.frames.size).toBe(1)

    tick(16)
    expect(renderer().render).toHaveBeenCalledTimes(2)
    expect(browser.frames.size).toBe(0)
    expect(options.onIdle).toHaveBeenCalledTimes(2)
  })

  it('draws nothing while nothing changes', () => {
    start()
    expect(renderer().render).toHaveBeenCalledTimes(1)
    expect(browser.frames.size).toBe(0)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('reports the counters of the frame it just drew each time it goes quiet', () => {
    const controller = start()
    controller.setSelected('box')
    tick()
    expect(options.onIdle).toHaveBeenLastCalledWith(expect.objectContaining({ frames: 2 }))
  })

  it('draws the new size in the same task as the resize, not in the next frame', () => {
    start()
    const observer = browser.observers[0]
    expect(observer).toBeDefined()
    Object.defineProperty(canvas, 'clientWidth', { value: 400, configurable: true })
    observer?.callback()
    expect(renderer().setSize).toHaveBeenLastCalledWith(400, HEIGHT, false)
    expect(renderer().render).toHaveBeenCalledTimes(2)
    expect(browser.frames.size).toBe(0)
  })

  it('leaves the picture alone while the canvas has no size', () => {
    start()
    Object.defineProperty(canvas, 'clientWidth', { value: 0, configurable: true })
    browser.observers[0]?.callback()
    expect(renderer().render).toHaveBeenCalledTimes(1)
    expect(renderer().setSize).toHaveBeenCalledTimes(1)
  })
})

describe('the camera buttons', () => {
  it('fly to the pose one step away, over several frames, and then go quiet', () => {
    const controller = start()
    controller.moveCamera('zoom-in')
    const frames = settle()

    expect(frames).toBeGreaterThan(2)
    const pose = poseOfCamera()
    const goal = movePose(HOME_POSE, 'zoom-in')
    expect(pose.distance).toBeCloseTo(goal.distance, 4)
    expect(pose.polar).toBeCloseTo(goal.polar, 4)
    expect(pose.azimuth).toBeCloseTo(goal.azimuth, 4)
    expect(browser.frames.size).toBe(0)
    expect(options.onIdle).toHaveBeenCalledTimes(2)
  })

  it('moves a little more in each frame of a flight, then stops', () => {
    const controller = start()
    controller.moveCamera('orbit-right')
    const seen: number[] = []
    for (let now = 0; browser.frames.size > 0; now += 100) {
      tick(now)
      seen.push(poseOfCamera().azimuth)
    }
    expect(seen.length).toBeGreaterThan(2)
    for (let index = 1; index < seen.length; index += 1) {
      expect(seen[index] ?? 0).toBeGreaterThanOrEqual(seen[index - 1] ?? 0)
    }
    expect(seen.at(-1)).toBeCloseTo(movePose(HOME_POSE, 'orbit-right').azimuth, 4)
  })

  it('add up when pressed quickly, instead of each starting from where the camera is', () => {
    const controller = start()
    controller.moveCamera('zoom-in')
    controller.moveCamera('zoom-in')
    settle()
    const goal = movePose(movePose(HOME_POSE, 'zoom-in'), 'zoom-in')
    expect(poseOfCamera().distance).toBeCloseTo(goal.distance, 4)
  })

  it('stop at the limits', () => {
    const controller = start()
    for (let press = 0; press < 30; press += 1) controller.moveCamera('zoom-in')
    settle()
    expect(poseOfCamera().distance).toBeCloseTo(7, 3)
    for (let press = 0; press < 30; press += 1) controller.moveCamera('lower')
    settle()
    expect(poseOfCamera().polar).toBeLessThan(Math.PI / 2)
  })

  it('reset the camera to the home pose from anywhere', () => {
    const controller = start()
    controller.moveCamera('orbit-left')
    controller.moveCamera('raise')
    controller.moveCamera('zoom-out')
    settle()
    expect(poseOfCamera().distance).not.toBeCloseTo(HOME_POSE.distance, 1)

    controller.resetCamera()
    settle()

    const pose = poseOfCamera()
    expect(pose.azimuth).toBeCloseTo(HOME_POSE.azimuth, 4)
    expect(pose.polar).toBeCloseTo(HOME_POSE.polar, 4)
    expect(pose.distance).toBeCloseTo(HOME_POSE.distance, 4)
  })

  it('always look at the target', () => {
    const controller = start()
    controller.moveCamera('orbit-right')
    settle()
    const camera = cameraOf()
    const direction = camera.getWorldDirection(new Vector3())
    const toTarget = new Vector3(TARGET[0], TARGET[1], TARGET[2]).sub(camera.position).normalize()
    expect(direction.dot(toTarget)).toBeCloseTo(1, 4)
  })

  it('are given up on when a drag takes over from a flight', () => {
    const controller = start()
    controller.moveCamera('zoom-in')
    tick(0)
    tick(100)
    const mid = poseOfCamera().distance
    pointer('pointerdown', { clientX: 10, clientY: 10 })
    settle()
    // Nothing carries the camera on to the flight's destination once the visitor has hold of it.
    expect(poseOfCamera().distance).toBeCloseTo(mid, 1)
  })
})

describe('reduced motion', () => {
  it('sends the camera to its destination at once, in one frame', () => {
    const controller = start()
    controller.setReducedMotion(true)
    controller.moveCamera('zoom-in')
    const goal = movePose(HOME_POSE, 'zoom-in')
    expect(poseOfCamera().distance).toBeCloseTo(goal.distance, 4)
    expect(settle()).toBe(1)
  })

  it('makes Reset camera a jump', () => {
    const controller = start()
    controller.moveCamera('zoom-out')
    settle()
    controller.setReducedMotion(true)
    controller.resetCamera()
    expect(poseOfCamera().distance).toBeCloseTo(HOME_POSE.distance, 4)
    expect(settle()).toBe(1)
  })

  it('lands a flight that is under way, when reduced motion is turned on in the middle of it', () => {
    const controller = start()
    controller.moveCamera('zoom-in')
    tick(0)
    tick(60)
    controller.setReducedMotion(true)
    expect(poseOfCamera().distance).toBeCloseTo(movePose(HOME_POSE, 'zoom-in').distance, 4)
    settle()
    expect(browser.frames.size).toBe(0)
  })

  it('can be turned off again, and flights come back', () => {
    const controller = start()
    controller.setReducedMotion(true)
    controller.setReducedMotion(false)
    controller.moveCamera('zoom-in')
    expect(poseOfCamera().distance).toBeCloseTo(HOME_POSE.distance, 4)
    expect(settle()).toBeGreaterThan(2)
  })
})

describe('clicking', () => {
  it('reports the solid under the pointer', () => {
    start()
    click()
    expect(options.onPick).toHaveBeenCalledTimes(1)
    expect(options.onPick).toHaveBeenCalledWith('box')
  })

  it('reports null for empty space, which clears the selection', () => {
    start()
    click({ clientX: 8, clientY: 8 })
    expect(options.onPick).toHaveBeenCalledWith(null)
  })

  it('treats a small wobble as a click and a drag as not one', () => {
    start()
    pointer('pointerdown')
    pointer('pointerup', { clientX: WIDTH / 2 + 3, clientY: HEIGHT / 2 })
    expect(options.onPick).toHaveBeenCalledTimes(1)

    pointer('pointerdown')
    pointer('pointerup', { clientX: WIDTH / 2 + 40, clientY: HEIGHT / 2 })
    expect(options.onPick).toHaveBeenCalledTimes(1)
  })

  it('ignores every button but the main one', () => {
    start()
    click({ button: 2 })
    click({ button: 1 })
    expect(options.onPick).not.toHaveBeenCalled()
  })

  it('ignores a press that a second finger joined', () => {
    start()
    pointer('pointerdown', { pointerId: 1, pointerType: 'touch' })
    pointer('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 500 })
    pointer('pointerup', { pointerId: 2, pointerType: 'touch', clientX: 500 })
    pointer('pointerup', { pointerId: 1, pointerType: 'touch' })
    expect(options.onPick).not.toHaveBeenCalled()
  })

  it('ignores a press the browser cancelled', () => {
    start()
    pointer('pointerdown')
    pointer('pointercancel')
    pointer('pointerup')
    expect(options.onPick).not.toHaveBeenCalled()
  })

  it('does not pick again from a release it has no press for', () => {
    start()
    pointer('pointerup')
    expect(options.onPick).not.toHaveBeenCalled()
  })
})

describe('the wheel', () => {
  const distance = () => poseOfCamera().distance

  it('leaves a plain wheel to the page, so a scene in the middle of a page does not trap scrolling', () => {
    start()
    const before = distance()
    const event = new WheelEvent('wheel', { deltaY: -120, bubbles: true, cancelable: true })
    canvas.dispatchEvent(event)
    expect(distance()).toBe(before)
    expect(event.defaultPrevented).toBe(false)
  })

  it('zooms on Ctrl and wheel, which is also what a trackpad pinch sends', () => {
    start()
    const before = distance()
    const event = new WheelEvent('wheel', {
      deltaY: -120,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    canvas.dispatchEvent(event)
    expect(distance()).toBeLessThan(before)
    expect(event.defaultPrevented).toBe(true)
  })

  it('zooms on ⌘ and wheel', () => {
    start()
    const before = distance()
    canvas.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -120, metaKey: true, bubbles: true, cancelable: true }),
    )
    expect(distance()).toBeLessThan(before)
  })

  it('keeps the zoom inside the limits', () => {
    start()
    for (let turn = 0; turn < 60; turn += 1) {
      canvas.dispatchEvent(
        new WheelEvent('wheel', { deltaY: -400, ctrlKey: true, bubbles: true, cancelable: true }),
      )
    }
    expect(distance()).toBeGreaterThanOrEqual(7 - 1e-6)
  })
})

describe('the graphics context', () => {
  it('tells the page when it is lost, and when it comes back', () => {
    start()
    canvas.dispatchEvent(new Event('webglcontextlost'))
    expect(options.onContextChange).toHaveBeenLastCalledWith(true)
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    expect(options.onContextChange).toHaveBeenLastCalledWith(false)
  })

  it('draws again when the context comes back', () => {
    start()
    canvas.dispatchEvent(new Event('webglcontextrestored'))
    expect(browser.frames.size).toBe(1)
    tick()
    expect(renderer().render).toHaveBeenCalledTimes(2)
  })
})

describe('disposing', () => {
  it('lets the renderer free the scene’s geometries and materials before it is disposed, and only then loses the context', () => {
    const geometry = new BoxGeometry()
    const material = new MeshBasicMaterial()
    geometry.addEventListener('dispose', () => {
      harness.order.push('geometry')
    })
    material.addEventListener('dispose', () => {
      harness.order.push('material')
    })
    const layer: SceneLayer = {
      id: 'tracked',
      build: () => {
        const object = new Group()
        object.add(new Mesh(geometry, material))
        return { object }
      },
    }
    const controller = start([layer])
    harness.order.length = 0

    controller.dispose()

    expect(harness.order).toEqual(['geometry', 'material', 'renderer.dispose', 'forceContextLoss'])
  })

  it('removes every listener it or the controls added', () => {
    const onCanvas = watchListeners(canvas, 'canvas')
    const onDocument = watchListeners(document, 'document')
    const controller = start()
    // A press, so the controls have attached their document-level listeners too.
    pointer('pointerdown', { clientX: 10, clientY: 10 })
    expect(onCanvas.left().length + onDocument.left().length).toBeGreaterThan(0)
    expect(onDocument.left()).toContain('document:pointermove')

    controller.dispose()

    expect(onCanvas.left()).toEqual([])
    expect(onDocument.left()).toEqual([])
  })

  it('cancels a frame that is waiting, so nothing draws after the page has left', () => {
    const controller = start()
    controller.setSelected('box')
    expect(browser.frames.size).toBe(1)
    controller.dispose()
    expect(browser.frames.size).toBe(0)
    expect(browser.cancelled).toHaveLength(1)
    expect(renderer().render).toHaveBeenCalledTimes(1)
  })

  it('stops watching the canvas’s size, and gives the canvas back', () => {
    const controller = start()
    expect(canvas.style.touchAction).toBe('none')
    controller.dispose()
    expect(browser.observers[0]?.disconnect).toHaveBeenCalledTimes(1)
    expect(canvas.style.touchAction).toBe('')
  })

  it('leaves the canvas in the page for React to remove', () => {
    const controller = start()
    controller.dispose()
    expect(canvas.isConnected).toBe(true)
  })

  it('can be done twice and releases everything once', () => {
    const controller = start()
    controller.dispose()
    expect(() => {
      controller.dispose()
    }).not.toThrow()
    expect(renderer().dispose).toHaveBeenCalledTimes(1)
    expect(renderer().forceContextLoss).toHaveBeenCalledTimes(1)
  })

  it('does nothing when told something afterwards', () => {
    const controller = start()
    controller.dispose()
    const draws = renderer().render.mock.calls.length

    controller.setSelected('box')
    controller.setPalette(palette)
    controller.moveCamera('zoom-in')
    controller.resetCamera()
    controller.setReducedMotion(true)
    click()
    canvas.dispatchEvent(new Event('webglcontextlost'))
    canvas.dispatchEvent(new WheelEvent('wheel', { ctrlKey: true, deltaY: -100 }))

    expect(browser.frames.size).toBe(0)
    expect(renderer().render).toHaveBeenCalledTimes(draws)
    expect(options.onPick).not.toHaveBeenCalled()
    expect(options.onContextChange).not.toHaveBeenCalled()
  })

  it('keeps releasing the rest when one release fails', () => {
    const controller = start()
    renderer().dispose.mockImplementation(() => {
      throw new Error('The renderer is already gone.')
    })
    expect(() => {
      controller.dispose()
    }).not.toThrow()
    expect(renderer().forceContextLoss).toHaveBeenCalledTimes(1)
  })
})
